from typing import Any

from app.services.data_loader import load_positions
from app.services.position_metrics import prepare_positions
from app.services.matrix_engine import build_matrix, matrix_to_records, NOISE


def count_by_signal_type(signals: list[dict[str, Any]]) -> dict[str, int]:
    """
    统计不同信号类型数量。
    """
    result = {
        "opponent": 0,
        "resonance": 0,
        "institution_attack": 0,
        "retail_noise": 0,
        "noise": 0,
    }

    for item in signals:
        signal_type = item.get("signal_type", "noise")

        if signal_type not in result:
            result[signal_type] = 0

        result[signal_type] += 1

    return result


def get_top_signals(signals: list[dict[str, Any]], limit: int = 10) -> list[dict[str, Any]]:
    """
    按 strength 从高到低取 Top 信号。
    """
    sorted_signals = sorted(
        signals,
        key=lambda x: x.get("strength", 0),
        reverse=True,
    )

    return sorted_signals[:limit]


def build_signal_distribution(counts: dict[str, int]) -> list[dict[str, Any]]:
    """
    构造信号分布图数据。
    """
    label_map = {
        "opponent": "对手盘",
        "resonance": "共振",
        "institution_attack": "机构突击",
        "retail_noise": "散户自嗨",
        "noise": "噪音",
    }

    return [
        {
            "name": label_map.get(key, key),
            "type": key,
            "value": value,
        }
        for key, value in counts.items()
    ]


def build_category_strength(signals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    按板块统计信号强度。
    """
    category_map: dict[str, int] = {}

    for item in signals:
        category = item.get("category", "未知")
        strength = int(item.get("strength", 0))

        category_map[category] = category_map.get(category, 0) + strength

    result = [
        {
            "category": category,
            "strength": strength,
        }
        for category, strength in category_map.items()
    ]

    result.sort(key=lambda x: x["strength"], reverse=True)

    return result


def build_dashboard(date: str) -> dict[str, Any]:
    """
    从 positions_日期.csv 实时计算仪表盘数据。
    """
    raw_df = load_positions(date)
    prepared_df = prepare_positions(raw_df)
    matrix_df = build_matrix(prepared_df)

    signals = matrix_to_records(matrix_df)
    counts = count_by_signal_type(signals)

    return {
        "date": date,
        "noise_threshold": NOISE,
        "total_products": len(signals),
        "total_signals": len(signals),
        "summary": {
            "opponent_count": counts.get("opponent", 0),
            "resonance_count": counts.get("resonance", 0),
            "institution_attack_count": counts.get("institution_attack", 0),
            "retail_noise_count": counts.get("retail_noise", 0),
            "noise_count": counts.get("noise", 0),
        },
        "top_signals": get_top_signals(signals, limit=10),
        "signal_distribution": build_signal_distribution(counts),
        "category_strength": build_category_strength(signals),
    }