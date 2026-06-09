import pandas as pd


def clean_positions(df: pd.DataFrame) -> pd.DataFrame:
    """
    清洗持仓数据：
    1. 数字列转为数值
    2. 缺失值补 0
    3. 去掉缺少品种或合约的异常行
    """
    df = df.copy()

    numeric_columns = [
        "long_position",
        "long_change",
        "short_position",
        "short_change",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        ).fillna(0)

    text_columns = [
        "date",
        "broker",
        "category",
        "product",
        "contract",
    ]

    for column in text_columns:
        df[column] = df[column].astype(str).str.strip()

    df = df[df["product"] != ""]
    df = df[df["contract"] != ""]
    df = df[df["product"].str.lower() != "nan"]
    df = df[df["contract"].str.lower() != "nan"]

    return df


def add_basic_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """
    增加基础指标。

    net_change = long_change - short_change
    """
    df = df.copy()

    df["net_change"] = df["long_change"] - df["short_change"]
    df["abs_net_change"] = df["net_change"].abs()

    # 避免除以 0
    df["long_short_ratio"] = df.apply(
        lambda row: row["long_position"] / row["short_position"]
        if row["short_position"] != 0
        else None,
        axis=1,
    )

    return df


def prepare_positions(df: pd.DataFrame) -> pd.DataFrame:
    """
    对外暴露的统一处理函数。
    """
    df = clean_positions(df)
    df = add_basic_metrics(df)

    return df