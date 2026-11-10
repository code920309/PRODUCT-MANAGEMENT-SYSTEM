from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from service import data
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    name: str
    category: str
    price: int
    quantity: int
    min_quantity: int = 10
    supplier: str
    status: str = "판매중"

class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    price: int | None = None
    quantity: int | None = None
    min_quantity: int | None = None
    supplier: str | None = None
    status: str | None = None

@a.get("/")
def home():
    return {"message": "start"}

# 👉 try-except가 사라져서 코드가 매우 간결해집니다!
@a.get("/products")
def get_products():
    return data.load_products()

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
    new_product = data.add_product(product.model_dump())
    return {
        "success": True,
        "message": "상품이 성공적으로 등록되었습니다.",
        "data": new_product
    }

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