from typing import Any

import pandas as pd

from app.services.data_refresh_service import ensure_fund_flows_data


def load_fund_flows(date: str) -> pd.DataFrame:
    file_path = ensure_fund_flows_data(date)
    df = pd.read_csv(file_path)

    required_columns = [
        "date",
        "broker",
        "product",
        "flow_value",
        "abs_flow_value",
    ]

    missing_columns = [
        column for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(f"资金流 CSV 缺少必要字段：{missing_columns}")

    df["flow_value"] = pd.to_numeric(df["flow_value"], errors="coerce").fillna(0)
    df["abs_flow_value"] = pd.to_numeric(df["abs_flow_value"], errors="coerce").fillna(0)

    return df


def build_rank_items(df: pd.DataFrame, ascending: bool, limit: int) -> list[dict[str, Any]]:
    grouped = (
        df.groupby("product", as_index=False)
        .agg(
            flow_value=("flow_value", "sum"),
            abs_flow_value=("abs_flow_value", "sum"),
            broker_count=("broker", "nunique"),
            brokers=("broker", lambda x: "、".join(sorted(set(map(str, x))))),
        )
    )

    if ascending:
        ranked = grouped[grouped["flow_value"] < 0].sort_values("flow_value", ascending=True)
    else:
        ranked = grouped[grouped["flow_value"] > 0].sort_values("flow_value", ascending=False)

    result = []

    for _, row in ranked.head(limit).iterrows():
        flow_value = int(row["flow_value"])
        result.append(
            {
                "product": str(row["product"]),
                "flow_value": flow_value,
                "abs_flow_value": int(row["abs_flow_value"]),
                "direction": "outflow" if flow_value < 0 else "inflow",
                "direction_cn": "流出" if flow_value < 0 else "流入",
                "broker_count": int(row["broker_count"]),
                "brokers": str(row["brokers"]),
            }
        )

    return result


def get_fund_flow_rank(date: str, limit: int = 5) -> dict[str, Any]:
    df = load_fund_flows(date)

    return {
        "date": date,
        "limit": limit,
        "top_inflows": build_rank_items(df, ascending=False, limit=limit),
        "top_outflows": build_rank_items(df, ascending=True, limit=limit),
    }


def get_product_fund_flow_detail(date: str, product: str) -> dict[str, Any]:
    df = load_fund_flows(date)
    product_df = df[df["product"] == product].copy()

    if product_df.empty:
        raise ValueError(f"找不到品种资金流数据：{product}")

    product_df = product_df.sort_values("abs_flow_value", ascending=False)
    items = []

    for _, row in product_df.iterrows():
        flow_value = int(row["flow_value"])
        items.append(
            {
                "broker": str(row["broker"]),
                "flow_text": str(row.get("flow_text", "")),
                "flow_direction": str(row.get("flow_direction", "")),
                "flow_direction_cn": str(row.get("flow_direction_cn", "")),
                "flow_value": flow_value,
                "abs_flow_value": int(row["abs_flow_value"]),
                "action": str(row.get("action", "")),
            }
        )

    total_flow_value = int(product_df["flow_value"].sum())

    return {
        "date": date,
        "product": product,
        "total_flow_value": total_flow_value,
        "direction": "outflow" if total_flow_value < 0 else "inflow",
        "direction_cn": "流出" if total_flow_value < 0 else "流入",
        "items": items,
    }
