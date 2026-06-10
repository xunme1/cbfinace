from typing import Any

from app.services.seat_tracker_service import (
    TRACKED_BROKERS,
    build_seat_tracker,
    classify_signal,
    get_direction,
    get_direction_cn,
    get_main_and_second_contract,
    get_product_broker_summary,
    get_product_contract_summary,
    load_position_records,
    resolve_date,
)


def get_product_contract_broker_detail(date: str | None, product: str) -> list[dict[str, Any]]:
    _, df = load_position_records(date)
    product_df = df[df["product"] == product].copy()

    if product_df.empty:
        return []

    product_df = product_df.sort_values(["contract", "broker"])

    result = []

    for _, row in product_df.iterrows():
        net_change = float(row["net_change"])
        result.append(
            {
                "contract": str(row["contract"]),
                "broker": str(row["broker"]),
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


def detect_broker_conflict(broker_summary: list[dict[str, Any]]) -> bool:
    long_count = sum(1 for item in broker_summary if item["direction"] == "long")
    short_count = sum(1 for item in broker_summary if item["direction"] == "short")

    return long_count >= 2 and short_count >= 2


def build_product_description(
    broker_summary: list[dict[str, Any]],
    has_conflict: bool,
) -> str:
    long_brokers = [
        item["broker"]
        for item in broker_summary
        if item["direction"] == "long"
    ]
    short_brokers = [
        item["broker"]
        for item in broker_summary
        if item["direction"] == "short"
    ]

    if has_conflict:
        return (
            f"{'、'.join(long_brokers)}偏多；{'、'.join(short_brokers)}偏空，"
            "主力席位之间存在明显对峙。"
        )

    if long_brokers and not short_brokers:
        return f"{'、'.join(long_brokers)}偏多，五大席位整体方向偏多。"

    if short_brokers and not long_brokers:
        return f"{'、'.join(short_brokers)}偏空，五大席位整体方向偏空。"

    return "五大席位整体方向较一致，暂未出现明显对峙。"


def get_product_dashboard(date: str | None, product: str) -> dict[str, Any]:
    target_date = resolve_date(date)
    _, df = load_position_records(target_date)
    product_df = df[df["product"] == product]

    if product_df.empty:
        raise ValueError(f"找不到品种：{product}")

    category = str(product_df["category"].iloc[0])
    broker_summary = get_product_broker_summary(df, product)
    contract_summary = get_product_contract_summary(df, product)
    contract_broker_detail = get_product_contract_broker_detail(target_date, product)
    main_contract, second_contract = get_main_and_second_contract(contract_summary)
    signal, signal_cn = classify_signal(broker_summary, contract_summary)
    has_conflict = detect_broker_conflict(broker_summary)
    all_contract_net_change = sum(item["net_change"] for item in contract_summary)

    return {
        "date": target_date,
        "product": product,
        "category": category,
        "signal": signal,
        "signal_cn": signal_cn,
        "summary": {
            "all_contract_net_change": int(all_contract_net_change),
            "main_contract": main_contract["contract"] if main_contract else "",
            "main_contract_net_change": (
                main_contract["net_change"] if main_contract else 0
            ),
            "second_contract": second_contract["contract"] if second_contract else "",
            "second_contract_net_change": (
                second_contract["net_change"] if second_contract else 0
            ),
            "has_conflict": has_conflict,
            "description": build_product_description(broker_summary, has_conflict),
        },
        "broker_summary": broker_summary,
        "contract_summary": contract_summary,
        "contract_broker_detail": contract_broker_detail,
        "tracked_brokers": TRACKED_BROKERS,
    }


def get_product_from_tracker(date: str | None, product: str) -> dict[str, Any] | None:
    tracker = build_seat_tracker(date=date, keyword=product)

    for item in tracker["items"]:
        if item["product"] == product:
            return item

    return None
