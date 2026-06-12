from typing import Any

import pandas as pd

from app.services.seat_tracker_service import (
    TRACKED_BROKERS,
    get_direction,
    get_direction_cn,
    load_position_records,
    resolve_date,
)


def parse_brokers(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default

    brokers = [
        item.strip()
        for item in value.split(",")
        if item.strip()
    ]

    invalid_brokers = [
        broker
        for broker in brokers
        if broker not in TRACKED_BROKERS
    ]

    if invalid_brokers:
        raise ValueError(f"未知席位：{'、'.join(invalid_brokers)}")

    return list(dict.fromkeys(brokers))


def summarize_side(df: pd.DataFrame, brokers: list[str]) -> dict[str, Any]:
    side_df = df[df["broker"].isin(brokers)]

    long_position = int(side_df["long_position"].sum()) if not side_df.empty else 0
    long_change = int(side_df["long_change"].sum()) if not side_df.empty else 0
    short_position = int(side_df["short_position"].sum()) if not side_df.empty else 0
    short_change = int(side_df["short_change"].sum()) if not side_df.empty else 0
    net_change = int(side_df["net_change"].sum()) if not side_df.empty else 0

    return {
        "brokers": brokers,
        "long_position": long_position,
        "long_change": long_change,
        "short_position": short_position,
        "short_change": short_change,
        "net_change": net_change,
        "direction": get_direction(net_change),
        "direction_cn": get_direction_cn(net_change),
    }


def classify_battle(side_a: dict[str, Any], side_b: dict[str, Any]) -> tuple[str, str]:
    a_direction = side_a["direction"]
    b_direction = side_b["direction"]

    if a_direction != "neutral" and b_direction != "neutral" and a_direction != b_direction:
        return "opposite", "方向相反"

    if a_direction != "neutral" and a_direction == b_direction:
        return "same", "方向相同"

    if a_direction != "neutral" and b_direction == "neutral":
        return "side_a_only", "阵营A单边"

    if a_direction == "neutral" and b_direction != "neutral":
        return "side_b_only", "阵营B单边"

    return "neutral", "中性"


def build_battle_item(
    category: str,
    product: str,
    product_df: pd.DataFrame,
    side_a_brokers: list[str],
    side_b_brokers: list[str],
) -> dict[str, Any]:
    side_a = summarize_side(product_df, side_a_brokers)
    side_b = summarize_side(product_df, side_b_brokers)
    battle_signal, battle_signal_cn = classify_battle(side_a, side_b)
    difference = side_a["net_change"] - side_b["net_change"]
    total_abs_change = abs(side_a["net_change"]) + abs(side_b["net_change"])

    return {
        "category": category,
        "product": product,
        "battle_signal": battle_signal,
        "battle_signal_cn": battle_signal_cn,
        "side_a": side_a,
        "side_b": side_b,
        "difference": int(difference),
        "total_abs_change": int(total_abs_change),
    }


def build_seat_battle(
    date: str | None = None,
    side_a: str | None = None,
    side_b: str | None = None,
    category: str | None = None,
    keyword: str | None = None,
    signal: str | None = None,
) -> dict[str, Any]:
    target_date, df = load_position_records(date)
    side_a_brokers = parse_brokers(side_a, TRACKED_BROKERS[:3])
    side_b_brokers = parse_brokers(side_b, TRACKED_BROKERS[3:])

    if not side_a_brokers:
        raise ValueError("阵营A至少需要选择一个席位")

    if not side_b_brokers:
        raise ValueError("阵营B至少需要选择一个席位")

    if set(side_a_brokers) & set(side_b_brokers):
        raise ValueError("两个阵营不能选择相同席位")

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

    for (product_category, product), product_df in df.groupby(["category", "product"]):
        item = build_battle_item(
            category=str(product_category),
            product=str(product),
            product_df=product_df,
            side_a_brokers=side_a_brokers,
            side_b_brokers=side_b_brokers,
        )

        if signal and item["battle_signal"] != signal:
            continue

        items.append(item)

    items.sort(key=lambda item: item["total_abs_change"], reverse=True)

    return {
        "date": target_date,
        "total": len(items),
        "brokers": TRACKED_BROKERS,
        "categories": categories,
        "side_a_brokers": side_a_brokers,
        "side_b_brokers": side_b_brokers,
        "items": items,
    }


def build_contract_battle_rows(
    product_df: pd.DataFrame,
    side_a_brokers: list[str],
    side_b_brokers: list[str],
) -> list[dict[str, Any]]:
    rows = []

    for contract, contract_df in product_df.groupby("contract"):
        side_a = summarize_side(contract_df, side_a_brokers)
        side_b = summarize_side(contract_df, side_b_brokers)
        battle_signal, battle_signal_cn = classify_battle(side_a, side_b)
        difference = side_a["net_change"] - side_b["net_change"]
        total_abs_change = abs(side_a["net_change"]) + abs(side_b["net_change"])

        rows.append(
            {
                "contract": str(contract),
                "battle_signal": battle_signal,
                "battle_signal_cn": battle_signal_cn,
                "side_a": side_a,
                "side_b": side_b,
                "difference": int(difference),
                "total_abs_change": int(total_abs_change),
            }
        )

    rows.sort(key=lambda item: item["total_abs_change"], reverse=True)

    return rows


def build_broker_contract_rows(
    product_df: pd.DataFrame,
    side_a_brokers: list[str],
    side_b_brokers: list[str],
) -> list[dict[str, Any]]:
    rows = []
    selected_brokers = side_a_brokers + side_b_brokers
    selected_df = product_df[product_df["broker"].isin(selected_brokers)]

    grouped = selected_df.groupby(["contract", "broker"], as_index=False).agg(
        long_position=("long_position", "sum"),
        long_change=("long_change", "sum"),
        short_position=("short_position", "sum"),
        short_change=("short_change", "sum"),
        net_change=("net_change", "sum"),
    )

    for _, row in grouped.iterrows():
        broker = str(row["broker"])
        net_change = int(row["net_change"])
        rows.append(
            {
                "contract": str(row["contract"]),
                "broker": broker,
                "side": "A" if broker in side_a_brokers else "B",
                "long_position": int(row["long_position"]),
                "long_change": int(row["long_change"]),
                "short_position": int(row["short_position"]),
                "short_change": int(row["short_change"]),
                "net_change": net_change,
                "direction": get_direction(net_change),
                "direction_cn": get_direction_cn(net_change),
            }
        )

    rows.sort(key=lambda item: (item["contract"], item["side"], item["broker"]))

    return rows


def get_seat_battle_product_detail(
    product: str,
    date: str | None = None,
    side_a: str | None = None,
    side_b: str | None = None,
) -> dict[str, Any]:
    target_date = resolve_date(date)
    _, df = load_position_records(target_date)
    product_df = df[df["product"] == product].copy()

    if product_df.empty:
        raise ValueError(f"找不到品种：{product}")

    side_a_brokers = parse_brokers(side_a, TRACKED_BROKERS[:3])
    side_b_brokers = parse_brokers(side_b, TRACKED_BROKERS[3:])

    if not side_a_brokers:
        raise ValueError("阵营A至少需要选择一个席位")

    if not side_b_brokers:
        raise ValueError("阵营B至少需要选择一个席位")

    if set(side_a_brokers) & set(side_b_brokers):
        raise ValueError("两个阵营不能选择相同席位")

    category = str(product_df["category"].iloc[0])
    summary = build_battle_item(
        category=category,
        product=product,
        product_df=product_df,
        side_a_brokers=side_a_brokers,
        side_b_brokers=side_b_brokers,
    )

    return {
        "date": target_date,
        "category": category,
        "product": product,
        "brokers": TRACKED_BROKERS,
        "side_a_brokers": side_a_brokers,
        "side_b_brokers": side_b_brokers,
        "summary": summary,
        "contract_rows": build_contract_battle_rows(
            product_df=product_df,
            side_a_brokers=side_a_brokers,
            side_b_brokers=side_b_brokers,
        ),
        "broker_contract_rows": build_broker_contract_rows(
            product_df=product_df,
            side_a_brokers=side_a_brokers,
            side_b_brokers=side_b_brokers,
        ),
    }
