from fastapi import APIRouter, HTTPException, Query

from app.services.seat_tracker_service import (
    build_seat_tracker,
    get_available_categories,
)


router = APIRouter(prefix="/api", tags=["seat-tracker"])


@router.get("/seat-tracker")
def seat_tracker(
    date: str | None = Query(None, description="分析日期，例如 2026-06-09"),
    signal: str | None = Query(None, description="信号类型，例如 strong_long"),
    category: str | None = Query(None, description="板块，例如 化工"),
    keyword: str | None = Query(None, description="品种关键词，例如 甲醇"),
):
    try:
        return build_seat_tracker(
            date=date,
            signal=signal,
            category=category,
            keyword=keyword,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取席位追踪数据失败：{e}")


@router.get("/seat-tracker/categories")
def seat_tracker_categories(
    date: str | None = Query(None, description="分析日期，例如 2026-06-09"),
):
    try:
        return get_available_categories(date)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取板块列表失败：{e}")
