from fastapi import FastAPI, HTTPException
from service import data
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 요청하신 변수명 a 적용
a = FastAPI()

a.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 오리진과 내 서버의 주소가 달라도 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 상품 등록 요청 데이터 형식
class ProductCreate(BaseModel):
    code: str | None = None
    name: str
    category: str
    price: int
    quantity: int
    min_quantity: int = 10
    supplier: str
    status: str = "판매중"

# 상품 수정 요청 데이터 형식 (선택적 수정이 가능하도록 Optional 혹은 기본값 설정)
class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    price: int | None = None
    quantity: int | None = None
    min_quantity: int | None = None
    supplier: str | None = None
    status: str | None = None

@a.get("/")     # 첫 화면
def home():
    print("클라이언트가 /를 요청하였습니다.")
    return {
        "message": "start"
    }

@a.get("/products")
def get_products():
    """전체 상품 목록 조회"""
    try:
        return data.load_products()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@a.get("/products/{product_id}")
def get_product_detail(product_id: int):
    """상품 상세 조회 (ID 기반)"""
    try:
        product = data.get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="해당 상품을 찾을 수 없습니다.")
        return {
            "success": True,
            "data": product
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@a.post("/products")
def create_product(product: ProductCreate):
    """상품 등록 API"""
    try:
        new_product = data.add_product(product.model_dump())
        return {
            "success": True,
            "message": "상품이 성공적으로 등록되었습니다.",
            "data": new_product
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@a.put("/products/{product_id}")
def update_product_api(product_id: int, product: ProductUpdate):
    """상품 ID로 기존 데이터를 찾아 변경된 값으로 수정합니다."""
    try:
        # None이 아닌 값들만 딕셔너리로 추출
        update_data = {k: v for k, v in product.model_dump().items() if v is not None}
        
        updated_product = data.update_product(product_id, update_data)
        if not updated_product:
            raise HTTPException(status_code=404, detail="수정할 상품을 찾을 수 없습니다.")
            
        return {
            "success": True,
            "message": "상품이 성공적으로 수정되었습니다.",
            "data": updated_product
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@a.delete("/products/{product_id}")
def delete_product_api(product_id: int):
    """삭제할 상품 ID를 받아 배열에서 제외하고 저장합니다."""
    try:
        success = data.delete_product(product_id)
        if not success:
            raise HTTPException(status_code=404, detail="삭제할 상품을 찾을 수 없습니다.")
            
        return {
            "success": True,
            "message": f"ID {product_id} 상품이 성공적으로 삭제되었습니다."
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))