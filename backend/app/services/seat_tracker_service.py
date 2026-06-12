from typing import Any

import pandas as pd

from app.services.data_loader import list_available_dates, load_positions
from app.services.matrix_engine import NOISE


TRACKED_BROKERS = [
    "高盛期货",
    "摩根大通",
    "国泰君安",
    "东方财富",
    "徽商期货",
]

CORE_BROKERS = [
    "高盛期货",
    "摩根大通",
    "国泰君安",
]

RETAIL_BROKERS = [
    "东方财富",
    "徽商期货",
]

SIGNAL_LABELS = {
    "strong_long": "强看多",
    "strong_short": "强看空",
    "conflict": "冲突",
    "positive": "正向",
    "reverse": "反向",
    "neutral": "中性",
}


def resolve_date(date: str | None = None) -> str:
    if date:
        return date

    dates = list_available_dates()

    if not dates:
        raise FileNotFoundError("data 目录下没有 positions_日期.csv 文件")

    return dates[0]


def get_direction(value: float, noise: int = NOISE) -> str:
    if value > noise:
        return "long"

    if value < -noise:
        return "short"

    return "neutral"


def get_direction_cn(value: float, noise: int = NOISE) -> str:
    direction = get_direction(value, noise=noise)

    if direction == "long":
        return "偏多"

    if direction == "short":
        return "偏空"

    return "中性"


def load_position_records(date: str | None = None) -> tuple[str, pd.DataFrame]:
    target_date = resolve_date(date)
    df = load_positions(target_date).copy()

    number_columns = [
        "long_position",
        "long_change",
        "short_position",
        "short_change",
    ]

    for column in number_columns:
        df[column] = pd.to_numeric(df[column], errors="coerce").fillna(0)

    df["net_change"] = df["long_change"] - df["short_change"]
    df = df[df["broker"].isin(TRACKED_BROKERS)].copy()

    return target_date, df


def get_available_categories(date: str | None = None) -> dict[str, Any]:
    target_date, df = load_position_records(date)
    categories = sorted(
        [str(item) for item in df["category"].dropna().unique().tolist()]
    )

    return {
        "date": target_date,
        "categories": categories,
    }


def get_product_broker_summary(df: pd.DataFrame, product: str) -> list[dict[str, Any]]:
    product_df = df[df["product"] == product]

    grouped = (
        product_df.groupby("broker", as_index=False)
        .agg(
            long_position=("long_position", "sum"),
            long_change=("long_change", "sum"),
            short_position=("short_position", "sum"),
            short_change=("short_change", "sum"),
            net_change=("net_change", "sum"),
        )
        if not product_df.empty
        else pd.DataFrame(
            columns=[
                "broker",
                "long_position",
                "long_change",
                "short_position",
                "short_change",
                "net_change",
            ]
        )
    )

    broker_map = {
        str(row["broker"]): row
        for _, row in grouped.iterrows()
    }

    result = []

    for broker in TRACKED_BROKERS:
        row = broker_map.get(broker)

        long_position = float(row["long_position"]) if row is not None else 0
        long_change = float(row["long_change"]) if row is not None else 0
        short_position = float(row["short_position"]) if row is not None else 0
        short_change = float(row["short_change"]) if row is not None else 0
        net_change = float(row["net_change"]) if row is not None else 0

        result.append(
            {
                "broker": broker,
                "long_position": int(long_position),
                "long_change": int(long_change),
                "short_position": int(short_position),
                "short_change": int(short_change),
                "net_change": int(net_change),
                "direction": get_direction(net_change),
                "direction_cn": get_direction_cn(net_change),
            }
        )

    return result


def get_product_contract_summary(df: pd.DataFrame, product: str) -> list[dict[str, Any]]:
    product_df = df[df["product"] == product]

    if product_df.empty:
        return []

    grouped = (
        product_df.groupby("contract", as_index=False)
        .agg(
            long_position=("long_position", "sum"),
            long_change=("long_change", "sum"),
            short_position=("short_position", "sum"),
            short_change=("short_change", "sum"),
            net_change=("net_change", "sum"),
        )
    )

    grouped["abs_net_change"] = grouped["net_change"].abs()
    grouped = grouped.sort_values("abs_net_change", ascending=False)

    result = []

    for _, row in grouped.iterrows():
        net_change = float(row["net_change"])
        result.append(
            {
                "contract": str(row["contract"]),
                "long_position": int(row["long_position"]),
                "long_change": int(row["long_change"]),
                "short_position": int(row["short_position"]),
                "short_change": int(row["short_change"]),
                "net_change": int(net_change),
                "direction": get_direction(net_change),
                "direction_cn": get_direction_cn(net_change),
            }
        )

    return result


def get_main_and_second_contract(
    contract_summary: list[dict[str, Any]],
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    main_contract = contract_summary[0] if len(contract_summary) >= 1 else None
    second_contract = contract_summary[1] if len(contract_summary) >= 2 else None

    return main_contract, second_contract


def classify_signal(
    broker_summary: list[dict[str, Any]],
    contract_summary: list[dict[str, Any]],
) -> tuple[str, str]:
    core_items = [
        item
        for item in broker_summary
        if item["broker"] in CORE_BROKERS
    ]
    retail_items = [
        item
        for item in broker_summary
        if item["broker"] in RETAIL_BROKERS
    ]

    core_long_count = sum(1 for item in core_items if item["direction"] == "long")
    core_short_count = sum(1 for item in core_items if item["direction"] == "short")
    retail_long_count = sum(1 for item in retail_items if item["direction"] == "long")
    retail_short_count = sum(1 for item in retail_items if item["direction"] == "short")

    core_net_change = sum(item["net_change"] for item in core_items)
    retail_net_change = sum(item["net_change"] for item in retail_items)

    core_direction = get_direction(core_net_change)
    retail_direction = get_direction(retail_net_change)

    if (
        core_long_count >= 2
        and retail_short_count >= 1
        and core_direction == "long"
        and retail_direction == "short"
    ):
        return "strong_long", SIGNAL_LABELS["strong_long"]

    if (
        core_short_count >= 2
        and retail_long_count >= 1
        and core_direction == "short"
        and retail_direction == "long"
    ):
        return "strong_short", SIGNAL_LABELS["strong_short"]

    if (
        core_direction != "neutral"
        and retail_direction != "neutral"
        and core_direction != retail_direction
    ):
        return "conflict", SIGNAL_LABELS["conflict"]

    total_net_change = sum(item["net_change"] for item in contract_summary)
    total_direction = get_direction(total_net_change)
    main_contract, _ = get_main_and_second_contract(contract_summary)
    main_direction = main_contract["direction"] if main_contract else "neutral"

    if core_direction != "neutral" and retail_direction == core_direction:
        return "positive", SIGNAL_LABELS["positive"]

    if total_direction != "neutral" and main_direction == total_direction:
        return "positive", SIGNAL_LABELS["positive"]

    if total_direction != "neutral" and main_direction != "neutral":
        return "reverse", SIGNAL_LABELS["reverse"]

    return "neutral", SIGNAL_LABELS["neutral"]


def build_seat_tracker(
    date: str | None = None,
    signal: str | None = None,
    category: str | None = None,
    keyword: str | None = None,
) -> dict[str, Any]:
    target_date, df = load_position_records(date)

    categories = sorted(
        [str(item) for item in df["category"].dropna().unique().tolist()]
    )

    if category:
        df = df[df["category"] == category]

    if keyword:
        keyword = keyword.strip()
        df = df[
            df["product"].astype(str).str.contains(keyword, na=False)
            | df["category"].astype(str).str.contains(keyword, na=False)
        ]

    items = []

    for (product_category, product), _ in df.groupby(["category", "product"]):
        broker_summary = get_product_broker_summary(df, product)
        contract_summary = get_product_contract_summary(df, product)
        main_contract, second_contract = get_main_and_second_contract(contract_summary)
        signal_value, signal_cn = classify_signal(broker_summary, contract_summary)

        if signal and signal_value != signal:
            continue

        all_contract_net_change = sum(item["net_change"] for item in contract_summary)

        items.append(
            {
                "product": str(product),
                "category": str(product_category),
                "signal": signal_value,
                "signal_cn": signal_cn,
                "main_contract": main_contract["contract"] if main_contract else "",
                "main_contract_net_change": (
                    main_contract["net_change"] if main_contract else 0
                ),
                "second_contract": second_contract["contract"] if second_contract else "",
                "second_contract_net_change": (
                    second_contract["net_change"] if second_contract else 0
                ),
                "all_contract_net_change": int(all_contract_net_change),
                "broker_changes": broker_summary,
            }
        )

    items.sort(key=lambda item: abs(item["all_contract_net_change"]), reverse=True)

    return {
        "date": target_date,
        "total": len(items),
        "categories": categories,
        "items": items,
    }
