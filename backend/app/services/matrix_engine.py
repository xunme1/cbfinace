from typing import Any

import pandas as pd


NOISE = 500

INSTITUTION_BROKERS = [
    "高盛期货",
    "摩根大通",
    "国泰君安",
]

RETAIL_BROKERS = [
    "东方财富",
    "徽商期货",
]


def direction(value: float, noise: int = NOISE) -> str:
    """
    根据净变化判断方向。
    """
    if value > noise:
        return "long"

    if value < -noise:
        return "short"

    return "neutral"


def direction_cn(value: float, noise: int = NOISE) -> str:
    """
    中文方向。
    """
    d = direction(value, noise)

    if d == "long":
        return "做多"

    if d == "short":
        return "做空"

    return "中性"


def classify_signal(inst_net: float, retail_net: float, noise: int = NOISE) -> str:
    """
    判断信号文本。
    """
    inst_dir = direction(inst_net, noise)
    retail_dir = direction(retail_net, noise)

    if inst_dir == "long" and retail_dir == "short":
        return "对手盘：机构做多，散户做空"

    if inst_dir == "short" and retail_dir == "long":
        return "对手盘：机构做空，散户做多"

    if inst_dir == "long" and retail_dir == "long":
        return "共振：机构散户共同做多"

    if inst_dir == "short" and retail_dir == "short":
        return "共振：机构散户共同做空"

    if inst_dir != "neutral" and retail_dir == "neutral":
        return "机构突击：机构明显行动，散户反应较弱"

    if inst_dir == "neutral" and retail_dir != "neutral":
        return "散户自嗨：散户明显行动，机构反应较弱"

    return "噪音：双方变化都不明显"


def signal_type(signal: str) -> str:
    """
    判断信号类型。
    """
    if signal.startswith("对手盘"):
        return "opponent"

    if signal.startswith("共振"):
        return "resonance"

    if signal.startswith("机构突击"):
        return "institution_attack"

    if signal.startswith("散户自嗨"):
        return "retail_noise"

    return "noise"


def add_camp(df: pd.DataFrame) -> pd.DataFrame:
    """
    给席位增加阵营标记。
    """
    df = df.copy()

    df["camp"] = "其他"
    df.loc[df["broker"].isin(INSTITUTION_BROKERS), "camp"] = "机构"
    df.loc[df["broker"].isin(RETAIL_BROKERS), "camp"] = "散户"

    return df


def build_matrix(df: pd.DataFrame, noise: int = NOISE) -> pd.DataFrame:
    """
    构建机构 vs 散户矩阵结果。

    输入：已经清洗并计算好 net_change 的持仓明细 DataFrame
    输出：按品种聚合后的矩阵结果 DataFrame
    """
    df = add_camp(df)

    grouped = (
        df.groupby(["category", "product", "camp"], as_index=False)
        .agg(
            net_change=("net_change", "sum"),
            long_change=("long_change", "sum"),
            short_change=("short_change", "sum"),
            long_position=("long_position", "sum"),
            short_position=("short_position", "sum"),
            brokers=("broker", lambda x: "、".join(sorted(set(x)))),
            contracts=("contract", lambda x: "、".join(sorted(set(x)))),
        )
    )

    result_rows: list[dict[str, Any]] = []

    for (category, product), sub_df in grouped.groupby(["category", "product"]):
        inst_row = sub_df[sub_df["camp"] == "机构"]
        retail_row = sub_df[sub_df["camp"] == "散户"]

        inst_net = float(inst_row["net_change"].sum()) if not inst_row.empty else 0.0
        retail_net = float(retail_row["net_change"].sum()) if not retail_row.empty else 0.0

        inst_long_change = float(inst_row["long_change"].sum()) if not inst_row.empty else 0.0
        inst_short_change = float(inst_row["short_change"].sum()) if not inst_row.empty else 0.0

        retail_long_change = float(retail_row["long_change"].sum()) if not retail_row.empty else 0.0
        retail_short_change = float(retail_row["short_change"].sum()) if not retail_row.empty else 0.0

        signal = classify_signal(inst_net, retail_net, noise=noise)
        strength = abs(inst_net) + abs(retail_net)

        result_rows.append(
            {
                "category": category,
                "product": product,
                "institution_net_change": int(inst_net),
                "retail_net_change": int(retail_net),
                "institution_direction": direction_cn(inst_net, noise=noise),
                "retail_direction": direction_cn(retail_net, noise=noise),
                "institution_long_change": int(inst_long_change),
                "institution_short_change": int(inst_short_change),
                "retail_long_change": int(retail_long_change),
                "retail_short_change": int(retail_short_change),
                "signal": signal,
                "signal_type": signal_type(signal),
                "strength": int(strength),
            }
        )

    result_df = pd.DataFrame(result_rows)

    if result_df.empty:
        return result_df

    result_df = result_df.sort_values(
        "strength",
        ascending=False,
    ).reset_index(drop=True)

    return result_df


def matrix_to_records(matrix_df: pd.DataFrame) -> list[dict[str, Any]]:
    """
    把矩阵 DataFrame 转成前端方便接收的 records。
    """
    if matrix_df.empty:
        return []

    return matrix_df.to_dict(orient="records")