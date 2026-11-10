import json
from datetime import datetime

# os 모듈 없이 상대 경로 사용
DATA_FILE = "./storage/products.json"

def load_products():
    """JSON 파일에서 상품 목록을 불러옵니다."""
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_products(products):
    """상품 목록을 JSON 파일에 저장합니다."""
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=4)

def add_product(product_data: dict):
    """새로운 상품을 받아 ID와 기본값을 부여한 뒤 JSON 파일에 추가합니다."""
    products = load_products()
    
    # 기존 상품들의 최대 ID를 구한 뒤 +1 (데이터가 없으면 1부터 시작)
    new_id = max([p.get("id", 0) for p in products], default=0) + 1
    
    # 저장할 최종 상품 객체 생성
    new_product = {
        "id": new_id,
        "code": product_data.get("code") or f"P{str(new_id).zfill(3)}",
        "name": product_data.get("name"),
        "category": product_data.get("category"),
        "price": product_data.get("price"),
        "quantity": product_data.get("quantity"),
        "min_quantity": product_data.get("min_quantity", 10),
        "supplier": product_data.get("supplier"),
        "status": product_data.get("status", "판매중"),
        "created_at": datetime.now().strftime("%Y-%m-%d"),
        "deleted": False,
        "version": 1
    }
    
    products.append(new_product)
    save_products(products)
    return new_product

def get_product_by_id(product_id: int):
    """상품 ID와 일치하는 상품 데이터를 찾아 반환합니다."""
    products = load_products()
    for product in products:
        if product.get("id") == product_id:
            return product
    return None

def update_product(product_id: int, update_data: dict):
    """기존 상품 데이터를 찾아 수정할 정보로 교체합니다."""
    products = load_products()
    updated_product = None
    
    for i, product in enumerate(products):
        if product.get("id") == product_id:
            # 기존 값 유지하면서 전달받은 수정 데이터만 덮어쓰기 (버전 업그레이드 포함)
            products[i].update({
                "name": update_data.get("name", product.get("name")),
                "category": update_data.get("category", product.get("category")),
                "price": update_data.get("price", product.get("price")),
                "quantity": update_data.get("quantity", product.get("quantity")),
                "min_quantity": update_data.get("min_quantity", product.get("min_quantity")),
                "supplier": update_data.get("supplier", product.get("supplier")),
                "status": update_data.get("status", product.get("status")),
                "version": product.get("version", 1) + 1
            })
            updated_product = products[i]
            break
            
    if updated_product:
        save_products(products)
    return updated_product

def delete_product(product_id: int):
    """해당 ID를 가진 데이터를 배열에서 제외하고 저장합니다."""
    products = load_products()
    new_products = [p for p in products if p.get("id") != product_id]
    
    # 삭제된 항목이 있는지 확인 (전체 길이가 줄었는지 비교)
    if len(new_products) < len(products):
        save_products(new_products)
        return True
    return False