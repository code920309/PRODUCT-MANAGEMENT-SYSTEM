from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from service import data
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

a = FastAPI()

a.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# [추가] 모든 예기치 않은 서버 에러(Exception)를 일괄 처리하는 핸들러
@a.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )

# Pydantic 모델들...
class ProductCreate(BaseModel):
    code: str | None = None
    name: str = Field(..., min_length=1, description="상품명은 필수입니다.")
    category: str = Field(..., min_length=1, description="카테고리는 필수입니다.")
    price: int = Field(..., ge=0, description="가격은 0원 이상이어야 합니다.")
    quantity: int = Field(..., ge=0, description="재고 수량은 0개 이상이어야 합니다.")
    min_quantity: int = Field(default=10, ge=0, description="안전 재고 기준은 0개 이상이어야 합니다.")
    supplier: str | None = None
    status: str = "판매중"

class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    category: str | None = Field(default=None, min_length=1)
    price: int | None = Field(default=None, ge=0)
    quantity: int | None = Field(default=None, ge=0)
    min_quantity: int | None = Field(default=None, ge=0)
    supplier: str | None = None
    status: str | None = None

@a.get("/")
def home():
    return {"message": "start"}

@a.get("/products")
def get_products(
    keyword: str | None = None, 
    category: str | None = None,
    status: str | None = None,
    sort_by: str | None = None,
    page: int | None = None,
    limit: int | None = None
):
    """전체 상품 목록 조회 (검색, 카테고리, 상태, 정렬, 페이지네이션 쿼리 파라미터 지원)"""
    return data.load_products(
        keyword=keyword, 
        category=category, 
        status=status, 
        sort_by=sort_by, 
        page=page, 
        limit=limit
    )

@a.get("/products/{product_id}")
def get_product_detail(product_id: int):
    product = data.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="해당 상품을 찾을 수 없습니다.")
    return {
        "success": True,
        "data": product
    }

@a.post("/products")
def create_product(product: ProductCreate):
    try:
        new_product = data.add_product(product.model_dump())
        return {
            "success": True,
            "message": "상품이 성공적으로 등록되었습니다.",
            "data": new_product
        }
    except ValueError as e:
        # 중복 코드 등 비즈니스 로직 에러는 400 상태 코드로 반환
        raise HTTPException(status_code=400, detail=str(e))

@a.put("/products/{product_id}")
def update_product_api(product_id: int, product: ProductUpdate):
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    updated_product = data.update_product(product_id, update_data)
    if not updated_product:
        raise HTTPException(status_code=404, detail="수정할 상품을 찾을 수 없습니다.")
        
    return {
        "success": True,
        "message": "상품이 성공적으로 수정되었습니다.",
        "data": updated_product
    }

@a.delete("/products/{product_id}")
def delete_product_api(product_id: int):
    success = data.delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="삭제할 상품을 찾을 수 없습니다.")
        
    return {
        "success": True,
        "message": f"ID {product_id} 상품이 성공적으로 삭제되었습니다."
    }