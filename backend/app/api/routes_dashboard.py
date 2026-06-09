from fastapi import APIRouter, HTTPException, Query
from app.services.dashboard_service import build_dashboard


router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard(date: str = Query(..., description="分析日期，例如 2026-03-27")):
    """
    获取指定日期的仪表盘数据。
    """
    try:
        return build_dashboard(date)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"读取仪表盘数据失败：{e}")