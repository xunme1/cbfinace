import os
import threading
import time
from datetime import datetime

from app.services.data_refresh_service import refresh_market_data, resolve_today


_scheduler_started = False


def scheduler_enabled() -> bool:
    return os.getenv("JYKC_SCHEDULER_ENABLED", "false").lower() in {
        "1",
        "true",
        "yes",
    }


def get_update_time() -> str:
    return os.getenv("JYKC_SCHEDULER_TIME", "17:30")


def scheduler_loop() -> None:
    last_run_date = ""

    while True:
        now = datetime.now()
        today = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M")

        if current_time == get_update_time() and last_run_date != today:
            try:
                refresh_market_data(date=resolve_today())
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
