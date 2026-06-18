from __future__ import annotations

import os
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[4]
PROJECT_ROOT = Path(
    os.getenv("US_STOCK_PROJECT_ROOT", str(REPO_ROOT / "us_stock_data_project"))
)
DATA_DIR = Path(os.getenv("US_STOCK_DATA_DIR", str(PROJECT_ROOT / "data")))
RAW_DAILY_DIR = DATA_DIR / "raw" / "daily"
CONFIG_DIR = Path(os.getenv("US_STOCK_CONFIG_DIR", str(PROJECT_ROOT / "config")))
NASDAQ100_FILE = CONFIG_DIR / "nasdaq100_tickers.txt"

DEFAULT_BENCHMARK = "QQQ"
MIN_WINDOW = 2
MAX_WINDOW = 60
