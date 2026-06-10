from fastapi import APIRouter, HTTPException, Path, Query

from app.services.fund_flow_service import (
    get_fund_flow_rank,
    get_product_fund_flow_detail,
)


router = APIRouter(prefix="/api", tags=["fund-flows"])


@router.get("/fund-flows/rank")
def fund_flow_rank(
    date: str = Query(..., description="分析日期，例如 2026-03-27"),
    limit: int = Query(5, ge=1, le=50, description="排行榜条数"),
):
    try:
        return get_fund_flow_rank(date=date, limit=limit)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取资金流排名失败：{e}")


@router.get("/fund-flows/products/{product}")
def product_fund_flow_detail(
    product: str = Path(..., description="品种名称，例如 甲醇"),
    date: str = Query(..., description="分析日期，例如 2026-03-27"),
):
    try:
        return get_product_fund_flow_detail(date=date, product=product)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取品种资金流详情失败：{e}")
