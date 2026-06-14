from pathlib import Path
from typing import Any

from app.core.paths import DATA_DIR


def list_dates_by_prefix(prefix: str) -> list[str]:
    dates = []

    for file_path in DATA_DIR.glob(f"{prefix}_*.csv"):
        stem = Path(file_path).stem
        date_text = stem.replace(f"{prefix}_", "", 1)

        if len(date_text) == 10:
            dates.append(date_text)

    return sorted(set(dates))


def latest_date(dates: list[str]) -> str | None:
    return dates[-1] if dates else None


def get_available_data_dates() -> dict[str, Any]:
    positions_dates = list_dates_by_prefix("positions")
    fund_flow_dates = list_dates_by_prefix("fund_flows")
    common_dates = sorted(set(positions_dates) & set(fund_flow_dates))

    return {
        "positions_dates": positions_dates,
        "fund_flow_dates": fund_flow_dates,
        "common_dates": common_dates,
        "latest_positions_date": latest_date(positions_dates),
        "latest_fund_flow_date": latest_date(fund_flow_dates),
        "latest_common_date": latest_date(common_dates),
    }
