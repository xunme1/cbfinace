from fastapi import APIRouter, HTTPException, Query

from app.services.seat_battle_service import (
    build_seat_battle,
    get_seat_battle_product_detail,
)


router = APIRouter(prefix="/api", tags=["seat-battle"])


@router.get("/seat-battle")
def seat_battle(
    date: str | None = Query(None, description="分析日期，例如 2026-06-09"),
    side_a: str | None = Query(None, description="阵营A席位，逗号分隔"),
    side_b: str | None = Query(None, description="阵营B席位，逗号分隔"),
    category: str | None = Query(None, description="板块，例如 化工"),
    keyword: str | None = Query(None, description="品种关键词，例如 甲醇"),
    signal: str | None = Query(None, description="对比信号，例如 opposite"),
):
    try:
        return build_seat_battle(
            date=date,
            side_a=side_a,
            side_b=side_b,
            category=category,
            keyword=keyword,
            signal=signal,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取席位对对碰数据失败：{e}")


@router.get("/seat-battle/products/{product}")
def seat_battle_product_detail(
    product: str,
    date: str | None = Query(None, description="分析日期，例如 2026-06-09"),
    side_a: str | None = Query(None, description="阵营A席位，逗号分隔"),
    side_b: str | None = Query(None, description="阵营B席位，逗号分隔"),
):
    try:
        return get_seat_battle_product_detail(
            product=product,
            date=date,
            side_a=side_a,
            side_b=side_b,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取品种席位对比详情失败：{e}")
