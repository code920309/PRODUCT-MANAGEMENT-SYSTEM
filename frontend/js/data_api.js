// [배포 시 수정 용이] 서버 API 기본 주소 설정 (추후 실제 배포 주소로 변경 가능)
const API_BASE_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
});

/**
 * 1. 서버에서 전체 상품 목록을 가져와 화면에 렌더링하는 함수
 */
async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        if (!res.ok) {
            throw new Error("상품 목록을 불러오는데 실패했습니다.");
        }

        const products = await res.json();
        renderDashboard(products);

    } catch (error) {
        console.error("API 연동 에러:", error);
    }
}

/**
 * 2. 가져온 데이터로 대시보드 요약 정보와 상품 목록 DOM을 업데이트하는 함수
 */
function renderDashboard(products) {
    const totalCount = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const lowStockCount = products.filter(p => p.quantity < (p.min_quantity || 10)).length;
    const totalAssetValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);
    const assetValueMan = Math.floor(totalAssetValue / 10000);

    // 요약 카드 텍스트 업데이트
    const summaryCards = document.querySelectorAll(".summary-card .card-value");
    if (summaryCards.length >= 4) {
        summaryCards[0].innerHTML = `${totalCount}<span class="card-unit">개</span>`;
        summaryCards[1].innerHTML = `${totalStock}<span class="card-unit">개</span>`;
        summaryCards[2].innerHTML = `${lowStockCount}<span class="card-unit">10개 미만</span>`;
        summaryCards[3].innerHTML = `${assetValueMan.toLocaleString()}만<span class="card-unit">원</span>`;
    }

    const badgeCount = document.querySelector(".badge-count");
    if (badgeCount) {
        badgeCount.textContent = `${totalCount}개`;
    }

    const productListContainer = document.querySelector(".product-list");
    if (!productListContainer) return;

    if (products.length === 0) {
        productListContainer.innerHTML = `<p style="text-align: center; padding: 30px; color: #64748b;">등록된 상품이 없습니다.</p>`;
        return;
    }

    productListContainer.innerHTML = products.map(product => {
        const isOutOfStock = product.quantity === 0;
        const statusText = product.status || (isOutOfStock ? "판매중지" : "판매중");
        const statusClass = statusText === "판매중" ? "badge-status" : "badge-status text-danger";
        const stockClass = product.quantity < (product.min_quantity || 10) ? "product-stock text-danger" : "product-stock text-success";

        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-main-info">
                    <div class="product-left">
                        <input type="checkbox" class="product-checkbox">
                        <div class="product-details">
                            <div class="product-title-row">
                                <h3 class="product-name">${escapeHtml(product.name)}</h3>
                                <span class="${statusClass}">${statusText}</span>
                            </div>
                            <p class="product-meta">${escapeHtml(product.code)} · ${escapeHtml(product.category)}</p>
                            <p class="product-supplier">공급업체: ${escapeHtml(product.supplier || '-')}</p>
                        </div>
                    </div>
                    <div class="product-right">
                        <div class="product-price">${Number(product.price).toLocaleString()}원</div>
                        <div class="${stockClass}">재고 ${product.quantity}개</div>
                    </div>
                </div>
                <div class="product-footer">
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editProduct(${product.id})">
                            <i class="fa-solid fa-pen"></i> 수정
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteProduct(${product.id})">
                            <i class="fa-solid fa-trash-can"></i> 삭제
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

/**
 * 3. 상품 신규 등록 API 요청 함수 (modal.js에서 호출)
 */
async function saveCreateProduct(payload) {
    try {
        const res = await fetch(`${API_BASE_URL}/products`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (res.ok && result.success) {
            alert(result.message);
            closeModal();       // 모달 닫기
            fetchProducts();    // 목록 새로고침
        } else {
            alert(result.detail || "상품 등록에 실패했습니다.");
        }
    } catch (error) {
        console.error("상품 등록 통신 에러:", error);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}

/**
 * 4. 특정 상품 상세 정보 조회 후 수정 모달 열기 (수정 버튼 클릭 시 연동)
 */
async function editProduct(productId) {
    try {
        const res = await fetch(`${API_BASE_URL}/products/${productId}`);
        const result = await res.json();

        if (res.ok && result.success) {
            // modal.js에 정의된 수정 모달 오픈 함수 호출
            openModalForEdit(result.data);
        } else {
            alert(result.detail || "상품 정보를 불러오지 못했습니다.");
        }
    } catch (error) {
        console.error("상품 상세 조회 에러:", error);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}

/**
 * 5. 상품 수정 API 요청 함수 (modal.js에서 호출)
 */
async function saveUpdateProduct(productId, payload) {
    try {
        const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (res.ok && result.success) {
            alert(result.message);
            closeModal();       // 모달 닫기
            fetchProducts();    // 목록 새로고침
        } else {
            alert(result.detail || "상품 수정에 실패했습니다.");
        }
    } catch (error) {
        console.error("상품 수정 통신 에러:", error);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}

/**
 * 6. 상품 삭제 API 요청 함수
 */
async function deleteProduct(productId) {
    if (!confirm(`정말 ID ${productId} 상품을 삭제하시겠습니까?`)) return;

    try {
        const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: "DELETE"
        });

        const result = await res.json();
        if (res.ok) {
            alert(result.message);
            fetchProducts(); // 목록 새로고침
        } else {
            alert(result.detail || "삭제 실패");
        }
    } catch (error) {
        console.error("삭제 요청 에러:", error);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}

/**
 * XSS 방지용 간단 HTML 특수문자 이스케이프 함수
 */
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}