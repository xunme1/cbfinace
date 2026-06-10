import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_signals import router as signals_router
from app.api.routes_charts import router as charts_router
from app.api.routes_products import router as products_router
from app.api.routes_seat_tracker import router as seat_tracker_router
from app.api.routes_data_refresh import router as data_refresh_router
from app.api.routes_fund_flows import router as fund_flows_router
from app.services.update_scheduler import start_update_scheduler


app = FastAPI(
    title="交易可查持仓矩阵分析系统",
    description="基于席位持仓数据的机构 vs 散户矩阵分析仪表盘 API",
    version="0.1.0",
)


def get_allowed_origins() -> list[str]:
    origins = os.getenv(
        "FRONTEND_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173,https://cbfinace.vercel.app",
    )

    return [origin.strip() for origin in origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "交易可查持仓矩阵分析系统 API 已启动",
        "docs": "/docs",
    }


app.include_router(dashboard_router)
app.include_router(signals_router)
app.include_router(charts_router)
app.include_router(products_router)
app.include_router(seat_tracker_router)
app.include_router(data_refresh_router)
app.include_router(fund_flows_router)


@app.on_event("startup")
def on_startup():
    start_update_scheduler()
