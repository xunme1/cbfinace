from pathlib import Path
from typing import Any
from functools import lru_cache
from datetime import datetime, timedelta

from app.core.paths import DATA_DIR
from app.services.seat_tracker_service import (
    CORE_BROKERS,
    RETAIL_BROKERS,
    TRACKED_BROKERS,
    get_direction,
    get_direction_cn,
    load_position_records,
    classify_signal,
)


def list_position_dates() -> list[str]:
    dates = []

    for file_path in DATA_DIR.glob("positions_*.csv"):
        stem = Path(file_path).stem
        date_text = stem.replace("positions_", "")

        if len(date_text) == 10:
            dates.append(date_text)

    return sorted(set(dates))


def resolve_trend_dates(end_date: str | None = None, days: int = 10) -> list[str]:
    dates = list_position_dates()

    if end_date:
        dates = [date for date in dates if date <= end_date]
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
    elif dates:
        end = datetime.strptime(dates[-1], "%Y-%m-%d").date()
    else:
        return []

    start = end - timedelta(days=days * 2 + 7)
    dates = [
        date
        for date in dates
        if datetime.strptime(date, "%Y-%m-%d").date() >= start
    ]

    return dates[-days:]


def summarize_group(broker_summary: list[dict[str, Any]], brokers: list[str]) -> dict[str, Any]:
    long_change = sum(
        item["long_change"]
        for item in broker_summary
        if item["broker"] in brokers
    )
    short_change = sum(
        item["short_change"]
        for item in broker_summary
        if item["broker"] in brokers
    )
    net_change = sum(
        item["net_change"]
        for item in broker_summary
        if item["broker"] in brokers
    )

    return {
        "long_change": int(long_change),
        "short_change": int(short_change),
        "net_change": int(net_change),
        "direction": get_direction(net_change),
        "direction_cn": get_direction_cn(net_change),
    }


def build_broker_summary_from_grouped(product: str, broker_group) -> list[dict[str, Any]]:
    if product in broker_group.index.get_level_values("product"):
        product_group = broker_group.loc[product]
    else:
        product_group = None

    result = []

    for broker in TRACKED_BROKERS:
        if product_group is not None and broker in product_group.index:
            row = product_group.loc[broker]
            long_position = int(row["long_position"])
            long_change = int(row["long_change"])
            short_position = int(row["short_position"])
            short_change = int(row["short_change"])
            net_change = int(row["net_change"])
        else:
            long_position = 0
            long_change = 0
            short_position = 0
            short_change = 0
            net_change = 0

        result.append(
            {
                "broker": broker,
                "long_position": long_position,
                "long_change": long_change,
                "short_position": short_position,
                "short_change": short_change,
                "net_change": net_change,
                "direction": get_direction(net_change),
                "direction_cn": get_direction_cn(net_change),
            }
        )

    return result


def build_contract_summary_from_grouped(product: str, contract_group) -> list[dict[str, Any]]:
    if product not in contract_group.index.get_level_values("product"):
        return []

    product_group = contract_group.loc[product].reset_index()
    product_group["abs_net_change"] = product_group["net_change"].abs()
    product_group = product_group.sort_values("abs_net_change", ascending=False)

    result = []

    for _, row in product_group.iterrows():
        net_change = int(row["net_change"])
        result.append(
            {
                "contract": str(row["contract"]),
                "long_position": int(row["long_position"]),
                "long_change": int(row["long_change"]),
                "short_position": int(row["short_position"]),
                "short_change": int(row["short_change"]),
                "net_change": net_change,
                "direction": get_direction(net_change),
                "direction_cn": get_direction_cn(net_change),
            }
        )

    return result


@lru_cache(maxsize=80)
def load_daily_record(date: str) -> dict[str, dict[str, Any]]:
    _, df = load_position_records(date)

    broker_group = df.groupby(["product", "broker"]).agg(
        long_position=("long_position", "sum"),
        long_change=("long_change", "sum"),
        short_position=("short_position", "sum"),
        short_change=("short_change", "sum"),
        net_change=("net_change", "sum"),
    )
    contract_group = df.groupby(["product", "contract"]).agg(
        long_position=("long_position", "sum"),
        long_change=("long_change", "sum"),
        short_position=("short_position", "sum"),
        short_change=("short_change", "sum"),
        net_change=("net_change", "sum"),
    )
    product_categories = (
        df.groupby("product")["category"]
        .first()
        .astype(str)
        .to_dict()
    )

    records = {}

    for product, category in product_categories.items():
        broker_summary = build_broker_summary_from_grouped(product, broker_group)
        contract_summary = build_contract_summary_from_grouped(product, contract_group)
        signal, signal_cn = classify_signal(broker_summary, contract_summary)
        core_summary = summarize_group(broker_summary, CORE_BROKERS)
        retail_summary = summarize_group(broker_summary, RETAIL_BROKERS)
        total_net_change = sum(item["net_change"] for item in contract_summary)

        records[str(product)] = {
            "date": date,
            "product": str(product),
            "category": category,
            "signal": signal,
            "signal_cn": signal_cn,
            "core": core_summary,
            "retail": retail_summary,
            "total_net_change": int(total_net_change),
            "broker_summary": broker_summary,
            "contract_summary": contract_summary,
        }

    return records


def load_daily_records(dates: list[str]) -> dict[str, dict[str, dict[str, Any]]]:
    result: dict[str, dict[str, dict[str, Any]]] = {}

    for date in dates:
        result[date] = load_daily_record(date)

    return result


def count_latest_streak(records: list[dict[str, Any]], key: str) -> int:
    if not records:
        return 0

    latest_value = records[-1].get(key)
    count = 0

    for record in reversed(records):
        if record.get(key) != latest_value:
            break
        count += 1

    return count


def count_direction_streak(records: list[dict[str, Any]], side: str) -> int:
    if not records:
        return 0

    latest_direction = records[-1][side]["direction"]

    if latest_direction == "neutral":
        return 0

    count = 0

    for record in reversed(records):
        if record[side]["direction"] != latest_direction:
            break
        count += 1

    return count


def get_trend_status(records: list[dict[str, Any]]) -> str:
    if len(records) <= 1:
        return "首次出现"

    latest = records[-1]
    previous = records[-2]

    if latest["signal"] == previous["signal"]:
        return "连续"

    strong_signals = {"strong_long", "strong_short"}

    if latest["signal"] in strong_signals and previous["signal"] not in strong_signals:
        return "增强"

    if latest["signal"] not in strong_signals and previous["signal"] in strong_signals:
        return "减弱"

    if latest["core"]["direction"] != "neutral" and previous["core"]["direction"] != "neutral":
        if latest["core"]["direction"] != previous["core"]["direction"]:
            return "主力反转"

    return "切换"


def get_trends(
    end_date: str | None = None,
    days: int = 10,
    category: str | None = None,
    keyword: str | None = None,
    signal: str | None = None,
) -> dict[str, Any]:
    dates = resolve_trend_dates(end_date=end_date, days=days)
    daily_records = load_daily_records(dates)
    product_names = sorted(
        {
            product
            for records in daily_records.values()
            for product in records.keys()
        }
    )
    items = []

    for product in product_names:
        records = [
            daily_records[date][product]
            for date in dates
            if product in daily_records[date]
        ]

        if not records:
            continue

        latest = records[-1]

        if category and latest["category"] != category:
            continue

        if keyword:
            keyword_text = keyword.strip()

            if keyword_text not in latest["product"] and keyword_text not in latest["category"]:
                continue

        if signal and latest["signal"] != signal:
            continue

        core_cumulative_net_change = sum(item["core"]["net_change"] for item in records)
        retail_cumulative_net_change = sum(item["retail"]["net_change"] for item in records)

        items.append(
            {
                "product": latest["product"],
                "category": latest["category"],
                "latest_date": latest["date"],
                "latest_signal": latest["signal"],
                "latest_signal_cn": latest["signal_cn"],
                "signal_streak_days": count_latest_streak(records, "signal"),
                "core_direction_streak_days": count_direction_streak(records, "core"),
                "retail_direction_streak_days": count_direction_streak(records, "retail"),
                "latest_core_net_change": latest["core"]["net_change"],
                "latest_core_direction_cn": latest["core"]["direction_cn"],
                "latest_retail_net_change": latest["retail"]["net_change"],
                "latest_retail_direction_cn": latest["retail"]["direction_cn"],
                "core_cumulative_net_change": int(core_cumulative_net_change),
                "retail_cumulative_net_change": int(retail_cumulative_net_change),
                "trend_status": get_trend_status(records),
            }
        )

    items.sort(
        key=lambda item: (
            item["signal_streak_days"],
            abs(item["core_cumulative_net_change"]) + abs(item["retail_cumulative_net_change"]),
        ),
        reverse=True,
    )

    categories = sorted({item["category"] for item in items})

    return {
        "dates": dates,
        "total": len(items),
        "categories": categories,
        "items": items,
    }


def get_product_trend(
    product: str,
    end_date: str | None = None,
    days: int = 10,
) -> dict[str, Any]:
    dates = resolve_trend_dates(end_date=end_date, days=days)
    daily_records = load_daily_records(dates)
    records = [
        daily_records[date][product]
        for date in dates
        if product in daily_records[date]
    ]

    if not records:
        raise ValueError(f"找不到品种历史趋势：{product}")

    broker_series = []

    for broker in records[-1]["broker_summary"]:
        broker_name = broker["broker"]
        broker_series.append(
            {
                "broker": broker_name,
                "data": [
                    {
                        "date": record["date"],
                        "net_change": next(
                            (
                                item["net_change"]
                                for item in record["broker_summary"]
                                if item["broker"] == broker_name
                            ),
                            0,
                        ),
                    }
                    for record in records
                ],
            }
        )

    top_contracts = []

    for record in records:
        for contract in record["contract_summary"][:3]:
            if contract["contract"] not in top_contracts:
                top_contracts.append(contract["contract"])

    contract_series = [
        {
            "contract": contract,
            "data": [
                {
                    "date": record["date"],
                    "net_change": next(
                        (
                            item["net_change"]
                            for item in record["contract_summary"]
                            if item["contract"] == contract
                        ),
                        0,
                    ),
                }
                for record in records
            ],
        }
        for contract in top_contracts[:5]
    ]

    return {
        "product": product,
        "category": records[-1]["category"],
        "dates": [record["date"] for record in records],
        "summary": {
            "latest_signal": records[-1]["signal"],
            "latest_signal_cn": records[-1]["signal_cn"],
            "signal_streak_days": count_latest_streak(records, "signal"),
            "core_direction_streak_days": count_direction_streak(records, "core"),
            "retail_direction_streak_days": count_direction_streak(records, "retail"),
            "trend_status": get_trend_status(records),
        },
        "daily_items": [
            {
                "date": record["date"],
                "signal": record["signal"],
                "signal_cn": record["signal_cn"],
                "core_net_change": record["core"]["net_change"],
                "core_direction_cn": record["core"]["direction_cn"],
                "retail_net_change": record["retail"]["net_change"],
                "retail_direction_cn": record["retail"]["direction_cn"],
                "total_net_change": record["total_net_change"],
            }
            for record in records
        ],
        "broker_series": broker_series,
        "contract_series": contract_series,
    }
