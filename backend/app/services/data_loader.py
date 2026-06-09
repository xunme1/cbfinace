from pathlib import Path
import pandas as pd
from app.core.paths import DATA_DIR

def get_positions_file(date: str) -> Path:
    """
    获取指定日期的持仓 CSV 文件路径。
    """
    return DATA_DIR / f"positions_{date}.csv"


def load_positions(date: str) -> pd.DataFrame:
    """
    读取 scraper.py 生成的持仓 CSV。
    """
    file_path = get_positions_file(date)

    if not file_path.exists():
        raise FileNotFoundError(f"找不到持仓文件：{file_path}")

    df = pd.read_csv(file_path)

    required_columns = [
        "date",
        "broker",
        "category",
        "product",
        "contract",
        "long_position",
        "long_change",
        "short_position",
        "short_change",
    ]

    missing_columns = [
        column for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(f"持仓 CSV 缺少必要字段：{missing_columns}")

    return df


def list_available_dates() -> list[str]:
    """
    扫描 data 目录，找出已有 positions_日期.csv。
    后面前端日期选择器可以用这个。
    """
    files = DATA_DIR.glob("positions_*.csv")

    dates = []

    for file in files:
        name = file.stem

        # positions_2026-03-27
        if name.startswith("positions_"):
            date = name.replace("positions_", "", 1)
            dates.append(date)

    return sorted(dates, reverse=True)