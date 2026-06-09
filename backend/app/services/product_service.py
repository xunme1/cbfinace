from typing import Any

import pandas as pd

from app.services.data_loader import load_positions
from app.services.position_metrics import prepare_positions
from app.services.matrix_engine import (
    build_matrix,
    add_camp,
)


def load_prepared_positions(date: str) -> pd.DataFrame:
    """
    读取并预处理持仓数据。
    """
    raw_df = load_positions(date)
    prepared_df = prepare_positions(raw_df)
    prepared_df = add_camp(prepared_df)

    return prepared_df


def get_product_matrix_summary(date: str, product: str) -> dict[str, Any] | None:
    """
    获取某个品种的矩阵分析总览。
    """
    raw_df = load_positions(date)
    prepared_df = prepare_positions(raw_df)
    matrix_df = build_matrix(prepared_df)

    product_df = matrix_df[matrix_df["product"] == product]

    if product_df.empty:
        return None

    row = product_df.iloc[0]

    return {
        "category": row.get("category"),
        "product": row.get("product"),
        "institution_net_change": int(row.get("institution_net_change", 0)),
        "retail_net_change": int(row.get("retail_net_change", 0)),
        "institution_direction": row.get("institution_direction"),
        "retail_direction": row.get("retail_direction"),
        "institution_long_change": int(row.get("institution_long_change", 0)),
        "institution_short_change": int(row.get("institution_short_change", 0)),
        "retail_long_change": int(row.get("retail_long_change", 0)),
        "retail_short_change": int(row.get("retail_short_change", 0)),
        "signal": row.get("signal"),
        "signal_type": row.get("signal_type"),
        "strength": int(row.get("strength", 0)),
    }


def get_broker_contribution(df: pd.DataFrame, product: str) -> list[dict[str, Any]]:
    """
    统计某品种下各席位贡献。

    贡献 = 该席位该品种所有合约的 net_change 加总。
    """
    product_df = df[df["product"] == product].copy()

    if product_df.empty:
        return []

    grouped = (
        product_df.groupby(["broker", "camp"], as_index=False)
        .agg(
            long_change=("long_change", "sum"),
            short_change=("short_change", "sum"),
            net_change=("net_change", "sum"),
            long_position=("long_position", "sum"),
            short_position=("short_position", "sum"),
            contract_count=("contract", "nunique"),
        )
    )

    grouped["abs_net_change"] = grouped["net_change"].abs()

    grouped = grouped.sort_values("abs_net_change", ascending=False)

    result = []

    for _, row in grouped.iterrows():
        result.append(
            {
                "broker": row["broker"],
                "camp": row["camp"],
                "long_change": int(row["long_change"]),
                "short_change": int(row["short_change"]),
                "net_change": int(row["net_change"]),
                "long_position": int(row["long_position"]),
                "short_position": int(row["short_position"]),
                "contract_count": int(row["contract_count"]),
                "abs_net_change": int(row["abs_net_change"]),
            }
        )

    return result


def get_contract_summary(df: pd.DataFrame, product: str) -> list[dict[str, Any]]:
    """
    按合约汇总某品种的多空变化。
    """
    product_df = df[df["product"] == product].copy()

    if product_df.empty:
        return []

    grouped = (
        product_df.groupby(["contract"], as_index=False)
        .agg(
            long_change=("long_change", "sum"),
            short_change=("short_change", "sum"),
            net_change=("net_change", "sum"),
            long_position=("long_position", "sum"),
            short_position=("short_position", "sum"),
            broker_count=("broker", "nunique"),
        )
    )

    grouped["abs_net_change"] = grouped["net_change"].abs()
    grouped = grouped.sort_values("abs_net_change", ascending=False)

    result = []

    for _, row in grouped.iterrows():
        result.append(
            {
                "contract": row["contract"],
                "long_change": int(row["long_change"]),
                "short_change": int(row["short_change"]),
                "net_change": int(row["net_change"]),
                "long_position": int(row["long_position"]),
                "short_position": int(row["short_position"]),
                "broker_count": int(row["broker_count"]),
                "abs_net_change": int(row["abs_net_change"]),
            }
        )

    return result


def get_contract_details(df: pd.DataFrame, product: str) -> list[dict[str, Any]]:
    """
    返回某品种下每个席位、每个合约的明细。
    """
    product_df = df[df["product"] == product].copy()

    if product_df.empty:
        return []

    product_df = product_df.sort_values(
        ["contract", "camp", "broker"],
        ascending=True,
    )

    result = []

    for _, row in product_df.iterrows():
        result.append(
            {
                "date": row["date"],
                "category": row["category"],
                "product": row["product"],
                "contract": row["contract"],
                "broker": row["broker"],
                "camp": row["camp"],
                "long_position": int(row["long_position"]),
                "long_change": int(row["long_change"]),
                "short_position": int(row["short_position"]),
                "short_change": int(row["short_change"]),
                "net_change": int(row["net_change"]),
                "abs_net_change": int(row["abs_net_change"]),
            }
        )

    return result


def get_product_detail(date: str, product: str) -> dict[str, Any]:
    """
    获取品种详情页所需的完整数据。
    """
    prepared_df = load_prepared_positions(date)

    product_df = prepared_df[prepared_df["product"] == product]

    if product_df.empty:
        raise ValueError(f"找不到品种：{product}")

    matrix_summary = get_product_matrix_summary(date, product)

    if matrix_summary is None:
        raise ValueError(f"找不到品种矩阵结果：{product}")

    broker_contribution = get_broker_contribution(prepared_df, product)
    contract_summary = get_contract_summary(prepared_df, product)
    contract_details = get_contract_details(prepared_df, product)

    category = str(product_df["category"].iloc[0])

    return {
        "date": date,
        "category": category,
        "product": product,
        "matrix_summary": matrix_summary,
        "broker_contribution": broker_contribution,
        "contract_summary": contract_summary,
        "contract_details": contract_details,
    }


def search_products(date: str, keyword: str | None = None) -> dict[str, Any]:
    """
    获取品种列表，可选关键词搜索。
    前端搜索框可以用。
    """
    prepared_df = load_prepared_positions(date)

    products_df = (
        prepared_df.groupby(["category", "product"], as_index=False)
        .agg(
            contract_count=("contract", "nunique"),
            broker_count=("broker", "nunique"),
        )
    )

    if keyword:
        keyword = keyword.strip()
        products_df = products_df[
            products_df["product"].astype(str).str.contains(keyword, na=False)
            | products_df["category"].astype(str).str.contains(keyword, na=False)
        ]

    products_df = products_df.sort_values(["category", "product"])

    items = []

    for _, row in products_df.iterrows():
        items.append(
            {
                "category": row["category"],
                "product": row["product"],
                "contract_count": int(row["contract_count"]),
                "broker_count": int(row["broker_count"]),
            }
        )

    return {
        "date": date,
        "total": len(items),
        "items": items,
    }