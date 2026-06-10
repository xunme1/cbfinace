import asyncio
import os
import re
from pathlib import Path
from typing import Any

import pandas as pd

from app.core.paths import BASE_DIR, DATA_DIR


BROKERS = [
    "高盛期货",
    "摩根大通",
    "国泰君安",
    "东方财富",
    "徽商期货",
]


def get_auth_file() -> Path:
    configured = os.getenv("JYKC_AUTH_FILE")

    if configured:
        return Path(configured)

    backend_auth = BASE_DIR / "auth.json"

    if backend_auth.exists():
        return backend_auth

    legacy_auth = BASE_DIR.parent / "jykc_scraper" / "scripts" / "auth.json"

    return legacy_auth


def ensure_auth_file() -> Path:
    auth_file = get_auth_file()

    if not auth_file.exists():
        raise FileNotFoundError(
            "未找到交易可查登录态 auth.json。请将 auth.json 放到 backend/auth.json，"
            "或通过 JYKC_AUTH_FILE 指定路径。"
        )

    return auth_file


def get_browser_channel() -> str | None:
    channel = os.getenv("JYKC_BROWSER_CHANNEL", "").strip()
    return channel or None


def get_headless() -> bool:
    return os.getenv("JYKC_HEADLESS", "true").lower() not in {"0", "false", "no"}


def clean_text(text: str) -> str:
    if text is None:
        return ""

    text = str(text).strip().replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()


def parse_position_cell(text: str) -> tuple[int, int]:
    if text is None:
        return 0, 0

    text = str(text).strip().replace(",", "")

    if not text:
        return 0, 0

    nums = re.findall(r"[+-]?\d+", text)

    if not nums:
        return 0, 0

    position = int(nums[0])
    change = int(nums[1]) if len(nums) >= 2 else 0

    return position, change


def build_position_url(broker: str, date: str) -> str:
    return f"https://www.jiaoyikecha.com/#/broker/position/broker={broker}/date={date}"


def build_fund_flow_url(broker: str, date: str) -> str:
    return f"https://www.jiaoyikecha.com/#/broker/trend/broker={broker}/date={date}"


async def scrape_position_broker(page, broker: str, date: str) -> list[dict[str, Any]]:
    await page.goto(build_position_url(broker, date), wait_until="domcontentloaded")
    await page.wait_for_timeout(5000)

    row_selector = "#broker_positions_list table tbody tr"
    row_count = await page.locator(row_selector).count()

    if row_count == 0:
        return []

    raw_rows = await page.evaluate(
        """
        () => {
            const rows = Array.from(
                document.querySelectorAll('#broker_positions_list table tbody tr')
            );

            return rows.map((tr, rowIndex) => {
                const cells = Array.from(tr.children).map(td => ({
                    text: td.innerText.trim(),
                    rowspan: td.getAttribute('rowspan') || '',
                    colspan: td.getAttribute('colspan') || '',
                    tag: td.tagName
                }));

                return { rowIndex, cells };
            });
        }
        """
    )

    data = []
    current_category = ""
    current_product = ""
    current_net_position = ""

    for raw_row in raw_rows:
        cell_texts = [cell["text"] for cell in raw_row["cells"]]

        if not cell_texts:
            continue

        joined_text = "\n".join(cell_texts)

        if "席位持仓列表" in joined_text:
            continue

        if "品种" in joined_text and "合约" in joined_text and "多头持仓" in joined_text:
            continue

        if len(cell_texts) == 1:
            text = cell_texts[0].strip()

            if text and not re.search(r"\d", text):
                current_category = text
                continue

        product = current_product
        net_position_text = current_net_position
        contract = ""
        long_text = ""
        short_text = ""

        if len(cell_texts) >= 5:
            product = cell_texts[0].strip()
            net_position_text = cell_texts[1].strip()
            contract = cell_texts[2].strip()
            long_text = cell_texts[3].strip()
            short_text = cell_texts[4].strip()

            current_product = product
            current_net_position = net_position_text
        elif len(cell_texts) >= 3:
            contract = cell_texts[0].strip()
            long_text = cell_texts[1].strip()
            short_text = cell_texts[2].strip()
        else:
            continue

        contract_lines = [item.strip() for item in contract.splitlines() if item.strip()]
        contract_code = contract_lines[0] if contract_lines else ""

        if not contract_code:
            continue

        long_position, long_change = parse_position_cell(long_text)
        short_position, short_change = parse_position_cell(short_text)

        data.append(
            {
                "date": date,
                "broker": broker,
                "category": current_category,
                "product": product,
                "net_position_text": net_position_text,
                "contract": contract_code,
                "long_position": long_position,
                "long_change": long_change,
                "short_position": short_position,
                "short_change": short_change,
            }
        )

    return data


def parse_flow_value(flow_text: str) -> tuple[str, str, int]:
    raw = clean_text(flow_text)

    if "流多" in raw:
        direction_cn = "流多"
        direction = "long"
        sign = 1
    elif "流空" in raw:
        direction_cn = "流空"
        direction = "short"
        sign = -1
    else:
        direction_cn = "未知"
        direction = "unknown"
        sign = 1

    match = re.search(r"[+-]?\d[\d,]*(?:\.\d+)?", raw)

    if not match:
        return direction_cn, direction, 0

    value = float(match.group().replace(",", ""))

    if "亿" in raw:
        value *= 100000000
    elif "万" in raw:
        value *= 10000

    return direction_cn, direction, int(value * sign)


def is_flow_line(text: str) -> bool:
    text = clean_text(text)
    return bool(re.search(r"流[多空]\s*[+-]?\d[\d,]*(?:\.\d+)?", text))


def is_action_line(text: str) -> bool:
    return "过程" in clean_text(text)


def parse_fund_flow_visible_text(text: str, broker: str, date: str) -> list[dict[str, Any]]:
    lines = [clean_text(line) for line in (text or "").splitlines()]
    lines = [line for line in lines if line]

    if not lines:
        return []

    start_index = 0

    for i, line in enumerate(lines):
        if "大资金动向" in line:
            start_index = i + 1
            break

    useful_lines = lines[start_index:]
    ignore_words = {"品种", "流动市值", "建仓过程"}
    data = []

    for i, current in enumerate(useful_lines):
        if not is_flow_line(current):
            continue

        product = ""
        action = ""

        for j in range(i - 1, -1, -1):
            candidate = useful_lines[j]

            if (
                candidate
                and candidate not in ignore_words
                and not is_flow_line(candidate)
                and not is_action_line(candidate)
                and "大资金动向" not in candidate
            ):
                product = candidate
                break

        if i + 1 < len(useful_lines) and is_action_line(useful_lines[i + 1]):
            action = useful_lines[i + 1]

        if not product:
            continue

        direction_cn, direction, flow_value = parse_flow_value(current)

        data.append(
            {
                "date": date,
                "broker": broker,
                "product": product,
                "flow_text": current,
                "flow_direction_cn": direction_cn,
                "flow_direction": direction,
                "flow_value": flow_value,
                "abs_flow_value": abs(flow_value),
                "action": action,
            }
        )

    unique = []
    seen = set()

    for row in data:
        key = (
            row["date"],
            row["broker"],
            row["product"],
            row["flow_text"],
            row["action"],
        )

        if key not in seen:
            seen.add(key)
            unique.append(row)

    return unique


async def scrape_fund_flow_broker(page, broker: str, date: str) -> list[dict[str, Any]]:
    await page.goto(build_fund_flow_url(broker, date), wait_until="domcontentloaded")
    await page.wait_for_timeout(6000)

    try:
        await page.wait_for_function(
            """
            () => {
                const text = document.body.innerText || "";
                return text.includes("大资金动向")
                    || text.includes("流多")
                    || text.includes("流空");
            }
            """,
            timeout=15000,
        )
    except Exception:
        return []

    visible_text = await page.locator("body").inner_text()
    return parse_fund_flow_visible_text(visible_text, broker, date)


async def scrape_positions_async(date: str) -> Path:
    from playwright.async_api import async_playwright

    auth_file = ensure_auth_file()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    all_rows = []

    async with async_playwright() as p:
        launch_options: dict[str, Any] = {"headless": get_headless()}
        channel = get_browser_channel()

        if channel:
            launch_options["channel"] = channel

        browser = await p.chromium.launch(**launch_options)
        context = await browser.new_context(storage_state=str(auth_file))
        page = await context.new_page()

        for broker in BROKERS:
            rows = await scrape_position_broker(page, broker, date)
            all_rows.extend(rows)

        await browser.close()

    if not all_rows:
        raise RuntimeError(f"{date} 没有抓到任何持仓数据")

    df = pd.DataFrame(all_rows)
    output_file = DATA_DIR / f"positions_{date}.csv"
    df.to_csv(output_file, index=False, encoding="utf-8-sig")

    return output_file


async def scrape_fund_flows_async(date: str) -> Path:
    from playwright.async_api import async_playwright

    auth_file = ensure_auth_file()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    all_rows = []

    async with async_playwright() as p:
        launch_options: dict[str, Any] = {"headless": get_headless()}
        channel = get_browser_channel()

        if channel:
            launch_options["channel"] = channel

        browser = await p.chromium.launch(**launch_options)
        context = await browser.new_context(storage_state=str(auth_file))
        page = await context.new_page()

        for broker in BROKERS:
            rows = await scrape_fund_flow_broker(page, broker, date)
            all_rows.extend(rows)

        await browser.close()

    if not all_rows:
        raise RuntimeError(f"{date} 没有抓到任何大资金动向数据")

    df = pd.DataFrame(all_rows)
    df = df.sort_values(by=["broker", "abs_flow_value"], ascending=[True, False])
    output_file = DATA_DIR / f"fund_flows_{date}.csv"
    df.to_csv(output_file, index=False, encoding="utf-8-sig")

    return output_file


def scrape_positions(date: str) -> Path:
    return asyncio.run(scrape_positions_async(date))


def scrape_fund_flows(date: str) -> Path:
    return asyncio.run(scrape_fund_flows_async(date))
