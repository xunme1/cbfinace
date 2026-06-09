from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_signals import router as signals_router
from app.api.routes_charts import router as charts_router
from app.api.routes_products import router as products_router


app = FastAPI(
    title="交易可查持仓矩阵分析系统",
    description="基于席位持仓数据的机构 vs 散户矩阵分析仪表盘 API",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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