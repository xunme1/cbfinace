from fastapi import APIRouter, HTTPException, Query

from app.services.trend_service import get_product_trend, get_trends


router = APIRouter(prefix="/api", tags=["trends"])


@router.get("/trends")
def trends(
    end_date: str | None = Query(None, description="结束日期，例如 2026-06-12"),
    days: int = Query(10, ge=2, le=60, description="向前统计的交易日数量"),
    category: str | None = Query(None, description="板块"),
    keyword: str | None = Query(None, description="品种关键词"),
    signal: str | None = Query(None, description="最新信号"),
):
    try:
        return get_trends(
            end_date=end_date,
            days=days,
            category=category,
            keyword=keyword,
            signal=signal,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取历史趋势失败：{e}")


@router.get("/trends/products/{product}")
def product_trend(
    product: str,
    end_date: str | None = Query(None, description="结束日期，例如 2026-06-12"),
    days: int = Query(10, ge=2, le=60, description="向前统计的交易日数量"),
):
    try:
        return get_product_trend(
            product=product,
            end_date=end_date,
            days=days,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取品种历史趋势失败：{e}")
