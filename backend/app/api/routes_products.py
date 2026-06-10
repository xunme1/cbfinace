from fastapi import APIRouter, HTTPException, Query, Path

from app.services.product_service import (
    get_product_detail,
    search_products,
)
from app.services.product_analysis_service import get_product_dashboard

router = APIRouter(prefix="/api", tags=["products"])

@router.get("/products")
def list_products(
    date: str = Query(..., description="分析日期，例如 2026-03-27"),
    keyword: str | None = Query(None, description="品种或板块关键词，例如 甲醇 / 化工"),
):
    """
    获取品种列表。
    """
    try:
        return search_products(date=date, keyword=keyword)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取品种列表失败：{e}")


@router.get("/products/{product}")
def product_detail(
    product: str = Path(..., description="品种名称，例如 甲醇"),
    date: str = Query(..., description="分析日期，例如 2026-03-27"),
):
    """
    获取单个品种详情。
    """
    try:
        return get_product_detail(date=date, product=product)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取品种详情失败：{e}")


@router.get("/products/{product}/dashboard")
def product_dashboard(
    product: str = Path(..., description="品种名称，例如 甲醇"),
    date: str | None = Query(None, description="分析日期，例如 2026-06-09"),
):
    """
    获取单个品种的席位持仓仪表盘数据。
    """
    try:
        return get_product_dashboard(date=date, product=product)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取品种席位仪表盘失败：{e}")
