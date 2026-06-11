from typing import Any

from app.services.seat_tracker_service import (
    CORE_BROKERS,
    RETAIL_BROKERS,
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
    core_direction = get_group_direction(broker_summary, CORE_BROKERS)
    retail_direction = get_group_direction(broker_summary, RETAIL_BROKERS)

    return (
        core_direction != "neutral"
        and retail_direction != "neutral"
        and core_direction != retail_direction
    )


def get_group_direction(
    broker_summary: list[dict[str, Any]],
    brokers: list[str],
) -> str:
    net_change = sum(
        item["net_change"]
        for item in broker_summary
        if item["broker"] in brokers
    )

    return get_direction(net_change)


def build_product_description(
    broker_summary: list[dict[str, Any]],
    has_conflict: bool,
) -> str:
    core_direction = get_group_direction(broker_summary, CORE_BROKERS)
    retail_direction = get_group_direction(broker_summary, RETAIL_BROKERS)
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
        core_direction_cn = "偏多" if core_direction == "long" else "偏空"
        retail_direction_cn = "偏多" if retail_direction == "long" else "偏空"

        return (
            f"主力席位（{'、'.join(CORE_BROKERS)}）整体{core_direction_cn}；"
            f"散户席位（{'、'.join(RETAIL_BROKERS)}）整体{retail_direction_cn}，"
            "形成主力与散户的反向结构。"
        )

    if core_direction != "neutral" and retail_direction == core_direction:
        direction_cn = "偏多" if core_direction == "long" else "偏空"

        return (
            f"主力席位与散户席位同时{direction_cn}，属于同向结构，"
            "方向一致但缺少反向确认，不作为强信号。"
        )

    if long_brokers and not short_brokers:
        return f"{'、'.join(long_brokers)}偏多，但主力与散户未形成明确反向结构。"

    if short_brokers and not long_brokers:
        return f"{'、'.join(short_brokers)}偏空，但主力与散户未形成明确反向结构。"

    return "主力席位与散户席位暂未形成明确反向结构。"


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
