import argparse
import sys
from datetime import date, datetime, timedelta
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.services.data_refresh_service import (  # noqa: E402
    get_fund_flows_path,
    get_positions_path,
    refresh_market_data,
)


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def build_date_range(
    start_date: date,
    end_date: date,
    include_weekends: bool,
) -> list[str]:
    if start_date > end_date:
        raise ValueError("开始日期不能晚于结束日期")

    result = []
    current = start_date

    while current <= end_date:
        if include_weekends or current.weekday() < 5:
            result.append(current.strftime("%Y-%m-%d"))

        current += timedelta(days=1)

    return result


def should_skip(date_text: str, include_positions: bool, include_fund_flows: bool) -> bool:
    checks = []

    if include_positions:
        checks.append(get_positions_path(date_text).exists())

    if include_fund_flows:
        checks.append(get_fund_flows_path(date_text).exists())

    return bool(checks) and all(checks)


def main() -> int:
    today = date.today()
    default_start = today - timedelta(days=30)

    parser = argparse.ArgumentParser(
        description="批量补抓交易可查持仓和资金流数据。",
    )
    parser.add_argument(
        "--start-date",
        default=default_start.strftime("%Y-%m-%d"),
        help="开始日期，格式 YYYY-MM-DD，默认最近 30 天。",
    )
    parser.add_argument(
        "--end-date",
        default=today.strftime("%Y-%m-%d"),
        help="结束日期，格式 YYYY-MM-DD，默认今天。",
    )
    parser.add_argument(
        "--positions-only",
        action="store_true",
        help="只抓取持仓数据。",
    )
    parser.add_argument(
        "--fund-flows-only",
        action="store_true",
        help="只抓取资金流数据。",
    )
    parser.add_argument(
        "--include-weekends",
        action="store_true",
        help="包含周末日期。默认只抓工作日。",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="即使 CSV 已存在也重新抓取。",
    )

    args = parser.parse_args()

    if args.positions_only and args.fund_flows_only:
        raise ValueError("--positions-only 和 --fund-flows-only 不能同时使用")

    include_positions = not args.fund_flows_only
    include_fund_flows = not args.positions_only
    dates = build_date_range(
        start_date=parse_date(args.start_date),
        end_date=parse_date(args.end_date),
        include_weekends=args.include_weekends,
    )

    print(f"准备补抓 {len(dates)} 个日期")
    print(f"持仓数据：{'是' if include_positions else '否'}")
    print(f"资金流数据：{'是' if include_fund_flows else '否'}")
    print(f"跳过已有文件：{'否' if args.force else '是'}")

    succeeded = []
    skipped = []
    failed = []

    for date_text in dates:
        if not args.force and should_skip(
            date_text=date_text,
            include_positions=include_positions,
            include_fund_flows=include_fund_flows,
        ):
            print(f"[SKIP] {date_text} 文件已存在")
            skipped.append(date_text)
            continue

        try:
            print(f"[START] {date_text}")
            result = refresh_market_data(
                date=date_text,
                include_positions=include_positions,
                include_fund_flows=include_fund_flows,
            )
            print(f"[OK] {date_text} {result}")
            succeeded.append(date_text)
        except Exception as error:
            print(f"[FAIL] {date_text} {error}")
            failed.append((date_text, str(error)))

    print("")
    print("补抓完成")
    print(f"成功：{len(succeeded)}")
    print(f"跳过：{len(skipped)}")
    print(f"失败：{len(failed)}")

    if failed:
        print("")
        print("失败日期：")

        for date_text, error in failed:
            print(f"- {date_text}: {error}")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
