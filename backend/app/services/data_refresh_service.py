import os
from datetime import date as date_type
from pathlib import Path

from app.core.paths import DATA_DIR
from app.scrapers.jykc_scraper import scrape_fund_flows, scrape_positions


def auto_scrape_enabled() -> bool:
    return os.getenv("JYKC_AUTO_SCRAPE_ON_MISSING", "true").lower() not in {
        "0",
        "false",
        "no",
    }


def resolve_today() -> str:
    return date_type.today().strftime("%Y-%m-%d")


def get_positions_path(date: str) -> Path:
    return DATA_DIR / f"positions_{date}.csv"


def get_fund_flows_path(date: str) -> Path:
    return DATA_DIR / f"fund_flows_{date}.csv"


def ensure_positions_data(date: str) -> Path:
    file_path = get_positions_path(date)

    if file_path.exists():
        return file_path

    if not auto_scrape_enabled():
        raise FileNotFoundError(f"找不到持仓文件：{file_path}")

    return scrape_positions(date)


def ensure_fund_flows_data(date: str) -> Path:
    file_path = get_fund_flows_path(date)

    if file_path.exists():
        return file_path

    if not auto_scrape_enabled():
        raise FileNotFoundError(f"找不到资金流文件：{file_path}")

    return scrape_fund_flows(date)


def refresh_market_data(
    date: str | None = None,
    include_positions: bool = True,
    include_fund_flows: bool = True,
) -> dict[str, str]:
    target_date = date or resolve_today()
    result: dict[str, str] = {"date": target_date}

    if include_positions:
        result["positions_file"] = str(scrape_positions(target_date))

    if include_fund_flows:
        result["fund_flows_file"] = str(scrape_fund_flows(target_date))

    return result
