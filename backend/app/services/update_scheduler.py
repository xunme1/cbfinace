import os
import threading
import time
from datetime import datetime, timedelta

from app.services.data_refresh_service import (
    get_fund_flows_path,
    get_positions_path,
    refresh_market_data,
    resolve_today,
)


_scheduler_started = False


def scheduler_enabled() -> bool:
    return os.getenv("JYKC_SCHEDULER_ENABLED", "false").lower() in {
        "1",
        "true",
        "yes",
    }


def get_update_time() -> str:
    return os.getenv("JYKC_SCHEDULER_TIME", "17:30")


def get_lookback_days() -> int:
    try:
        return max(int(os.getenv("JYKC_SCHEDULER_LOOKBACK_DAYS", "3")), 1)
    except ValueError:
        return 3


def include_positions() -> bool:
    return os.getenv("JYKC_SCHEDULER_INCLUDE_POSITIONS", "true").lower() not in {
        "0",
        "false",
        "no",
    }


def include_fund_flows() -> bool:
    return os.getenv("JYKC_SCHEDULER_INCLUDE_FUND_FLOWS", "true").lower() not in {
        "0",
        "false",
        "no",
    }


def skip_weekends() -> bool:
    return os.getenv("JYKC_SCHEDULER_SKIP_WEEKENDS", "true").lower() not in {
        "0",
        "false",
        "no",
    }


def iter_recent_dates(today: datetime) -> list[str]:
    dates = []

    for offset in range(get_lookback_days() - 1, -1, -1):
        target = today - timedelta(days=offset)

        if skip_weekends() and target.weekday() >= 5:
            continue

        dates.append(target.strftime("%Y-%m-%d"))

    return dates


def should_refresh_date(target_date: str, today: str) -> bool:
    if target_date == today:
        return True

    if include_positions() and not get_positions_path(target_date).exists():
        return True

    if include_fund_flows() and not get_fund_flows_path(target_date).exists():
        return True

    return False


def run_scheduled_update(now: datetime) -> None:
    today = resolve_today()

    for target_date in iter_recent_dates(now):
        if not should_refresh_date(target_date, today):
            continue

        print(f"开始定时更新交易可查数据：{target_date}")
        result = refresh_market_data(
            date=target_date,
            include_positions=include_positions(),
            include_fund_flows=include_fund_flows(),
        )
        print(f"定时更新完成：{result}")


def scheduler_loop() -> None:
    last_run_date = ""

    while True:
        now = datetime.now()
        today = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M")

        if current_time >= get_update_time() and last_run_date != today:
            try:
                run_scheduled_update(now)
                last_run_date = today
            except Exception as e:
                print(f"定时抓取数据失败：{e}")

        time.sleep(30)


def start_update_scheduler() -> None:
    global _scheduler_started

    if _scheduler_started or not scheduler_enabled():
        return

    thread = threading.Thread(target=scheduler_loop, daemon=True)
    thread.start()
    _scheduler_started = True
    print(f"交易可查定时抓取已启动，每天 {get_update_time()} 执行。")
