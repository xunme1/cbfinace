from fastapi import APIRouter, HTTPException, Query

from app.services.data_refresh_service import refresh_market_data


router = APIRouter(prefix="/api", tags=["data-refresh"])


@router.post("/data/refresh")
def refresh_data(
    date: str | None = Query(None, description="抓取日期，例如 2026-06-10；不传则使用今天"),
    include_positions: bool = Query(True, description="是否抓取持仓数据"),
    include_fund_flows: bool = Query(True, description="是否抓取资金流数据"),
):
    """
    手动触发交易可查数据抓取。
    """
    try:
        return refresh_market_data(
            date=date,
            include_positions=include_positions,
            include_fund_flows=include_fund_flows,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"刷新数据失败：{e}")
