from fastapi import APIRouter, HTTPException, Query

from app.services.signal_service import (
    get_categories,
    get_signal_types,
    get_signals,
)


router = APIRouter(prefix="/api", tags=["signals"])


@router.get("/signals")
def list_signals(
    date: str = Query(..., description="分析日期，例如 2026-03-27"),
    signal_type: str | None = Query(None, description="信号类型，例如 opponent"),
    category: str | None = Query(None, description="板块，例如 化工"),
    keyword: str | None = Query(None, description="关键词，例如 甲醇"),
    limit: int | None = Query(None, description="返回条数限制"),
):
    """
    获取信号列表。
    """
    try:
        return get_signals(
            date=date,
            signal_type=signal_type,
            category=category,
            keyword=keyword,
            limit=limit,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"读取信号列表失败：{e}")


@router.get("/signal-categories")
def list_signal_categories(
    date: str = Query(..., description="分析日期，例如 2026-03-27"),
):
    """
    获取所有板块分类。
    """
    try:
        return get_categories(date)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"读取板块分类失败：{e}")


@router.get("/signal-types")
def list_signal_types():
    """
    获取所有信号类型。
    """
    return get_signal_types()