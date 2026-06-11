from typing import Any
from app.services.data_loader import load_positions
from app.services.position_metrics import prepare_positions
from app.services.matrix_engine import build_matrix, matrix_to_records


SIGNAL_TYPE_LABELS = {
    "opponent": "对手盘",
    "resonance": "共振",
    "institution_attack": "机构突击",
    "retail_noise": "散户自嗨",
    "noise": "噪音",
}


def load_signals(date: str) -> list[dict[str, Any]]:
    """
    从 positions_日期.csv 实时计算矩阵分析结果。
    """
    raw_df = load_positions(date)
    prepared_df = prepare_positions(raw_df)
    matrix_df = build_matrix(prepared_df)

    return matrix_to_records(matrix_df)


def get_signal_distribution(date: str) -> dict[str, Any]:
    """
    信号类型分布。

    适合前端画饼图：
    对手盘 / 共振 / 机构突击 / 散户自嗨 / 噪音
    """
    signals = load_signals(date)

    counts = {
        "opponent": 0,
        "resonance": 0,
        "institution_attack": 0,
        "retail_noise": 0,
        "noise": 0,
    }

    for item in signals:
        signal_type = item.get("signal_type", "noise")
        if signal_type not in counts:
            counts[signal_type] = 0
        counts[signal_type] += 1

    data = [
        {
            "name": SIGNAL_TYPE_LABELS.get(signal_type, signal_type),
            "type": signal_type,
            "value": count,
        }
        for signal_type, count in counts.items()
    ]

    return {
        "date": date,
        "chart_type": "pie",
        "title": "信号类型分布",
        "data": data,
    }


def get_category_strength(date: str) -> dict[str, Any]:
    """
    板块信号强度。

    按 category 汇总 strength。
    适合前端画柱状图。
    """
    signals = load_signals(date)

    category_map: dict[str, int] = {}

    for item in signals:
        category = item.get("category") or "未知"
        strength = int(item.get("strength", 0))

        category_map[category] = category_map.get(category, 0) + strength

    data = [
        {
            "category": category,
            "strength": strength,
        }
        for category, strength in category_map.items()
    ]

    data.sort(key=lambda x: x["strength"], reverse=True)

    return {
        "date": date,
        "chart_type": "bar",
        "title": "板块信号强度",
        "data": data,
    }


def get_top_products(
    date: str,
    limit: int = 10,
    signal_type: str | None = None,
) -> dict[str, Any]:
    """
    Top 品种强度排名。

    按 strength 排序，取前 limit 个。
    适合前端画横向柱状图。
    """
    signals = load_signals(date)

    if signal_type:
        signals = [
            item
            for item in signals
            if item.get("signal_type") == signal_type
        ]

    signals = sorted(
        signals,
        key=lambda x: x.get("strength", 0),
        reverse=True,
    )

    top_items = signals[:limit]

    data = [
        {
            "product": item.get("product"),
            "category": item.get("category"),
            "signal_type": item.get("signal_type"),
            "signal": item.get("signal"),
            "strength": item.get("strength", 0),
            "institution_net_change": item.get("institution_net_change", 0),
            "retail_net_change": item.get("retail_net_change", 0),
        }
        for item in top_items
    ]

    return {
        "date": date,
        "chart_type": "bar",
        "title": f"Top {limit} 品种信号强度",
        "data": data,
    }


def get_matrix_scatter(date: str) -> dict[str, Any]:
    """
    机构 vs 散户矩阵散点图。

    横轴：机构净变化
    纵轴：散户净变化

    象限含义：
    右上：机构做多，散户做多
    右下：机构做多，散户做空
    左上：机构做空，散户做多
    左下：机构做空，散户做空
    """
    signals = load_signals(date)

    data = [
        {
            "product": item.get("product"),
            "category": item.get("category"),
            "x": item.get("institution_net_change", 0),
            "y": item.get("retail_net_change", 0),
            "strength": item.get("strength", 0),
            "signal_type": item.get("signal_type"),
            "signal": item.get("signal"),
            "institution_direction": item.get("institution_direction"),
            "retail_direction": item.get("retail_direction"),
        }
        for item in signals
    ]

    return {
        "date": date,
        "chart_type": "scatter",
        "title": "机构 vs 散户矩阵散点图",
        "x_axis": "机构净变化",
        "y_axis": "散户净变化",
        "quadrants": {
            "right_top": "机构做多，散户做多：多头共振",
            "right_bottom": "机构做多，散户做空：对手盘",
            "left_top": "机构做空，散户做多：对手盘",
            "left_bottom": "机构做空，散户做空：空头共振",
        },
        "data": data,
    }
