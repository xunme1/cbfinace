from fastapi import APIRouter, HTTPException, Query

from app.services.chart_service import (
    get_signal_distribution,
    get_category_strength,
    get_top_products,
    get_matrix_scatter,
)


router = APIRouter(prefix="/api/charts", tags=["charts"])


@router.get("/signal-distribution")
def signal_distribution(
    date: str = Query(..., description="分析日期，例如 2026-03-27"),
):
    """
    信号类型分布饼图数据。
    """
    try:
        return get_signal_distribution(date)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取信号类型分布失败：{e}")


@router.get("/category-strength")
def category_strength(
    date: str = Query(..., description="分析日期，例如 2026-03-27"),
):
    """
    板块信号强度柱状图数据。
    """
    try:
        return get_category_strength(date)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取板块信号强度失败：{e}")


@router.get("/top-products")
def top_products(
    date: str = Query(..., description="分析日期，例如 2026-03-27"),
    limit: int = Query(10, ge=1, le=50, description="返回 Top N 品种"),
    signal_type: str | None = Query(None, description="信号类型，例如 opponent"),
):
    """
    Top 品种信号强度柱状图数据。
    """
    try:
        return get_top_products(date=date, limit=limit, signal_type=signal_type)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取 Top 品种失败：{e}")


@router.get("/matrix-scatter")
def matrix_scatter(
    date: str = Query(..., description="分析日期，例如 2026-03-27"),
):
    """
    机构 vs 散户矩阵散点图数据。
    """
    try:
        return get_matrix_scatter(date)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取矩阵散点图数据失败：{e}")
