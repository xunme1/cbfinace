from typing import Any

from app.services.data_loader import load_positions
from app.services.position_metrics import prepare_positions
from app.services.matrix_engine import build_matrix, matrix_to_records


def load_matrix_records(date: str) -> list[dict[str, Any]]:
    """
    从持仓 CSV 计算矩阵 records。
    """
    raw_df = load_positions(date)
    prepared_df = prepare_positions(raw_df)
    matrix_df = build_matrix(prepared_df)

    return matrix_to_records(matrix_df)


def get_signals(
    date: str,
    signal_type: str | None = None,
    category: str | None = None,
    keyword: str | None = None,
    limit: int | None = None,
) -> dict[str, Any]:
    """
    获取信号列表，支持筛选。
    """
    signals = load_matrix_records(date)

    if signal_type:
        signals = [
            item for item in signals
            if item.get("signal_type") == signal_type
        ]

    if category:
        signals = [
            item for item in signals
            if item.get("category") == category
        ]

    if keyword:
        keyword = keyword.strip()
        signals = [
            item for item in signals
            if keyword in str(item.get("product", ""))
            or keyword in str(item.get("category", ""))
            or keyword in str(item.get("signal", ""))
        ]

    signals = sorted(
        signals,
        key=lambda x: x.get("strength", 0),
        reverse=True,
    )

    if limit is not None and limit > 0:
        signals = signals[:limit]

    return {
        "date": date,
        "total": len(signals),
        "items": signals,
    }


def get_categories(date: str) -> dict[str, Any]:
    """
    获取所有板块分类。
    """
    signals = load_matrix_records(date)

    categories = sorted(
        {
            item.get("category")
            for item in signals
            if item.get("category")
        }
    )

    return {
        "date": date,
        "categories": categories,
    }


def get_signal_types() -> dict[str, Any]:
    """
    获取信号类型。
    """
    return {
        "signal_types": [
            {
                "label": "对手盘",
                "value": "opponent",
            },
            {
                "label": "共振",
                "value": "resonance",
            },
            {
                "label": "机构突击",
                "value": "institution_attack",
            },
            {
                "label": "散户自嗨",
                "value": "retail_noise",
            },
            {
                "label": "噪音",
                "value": "noise",
            },
        ]
    }