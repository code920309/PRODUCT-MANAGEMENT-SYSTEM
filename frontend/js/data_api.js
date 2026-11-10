const API_BASE_URL = "https://product-management-system-wqot.onrender.com";

// 페이지네이션 및 필터 상태 변수
let currentPage = 1;
const limit = 5; // 한 페이지에 보여줄 상품 개수

document.addEventListener("DOMContentLoaded", () => {
    initCategoryFilter();
    fetchProducts();
    initEventListeners();
});

/**
 * 1. 서버에서 필터 및 페이지네이션 조건에 맞는 상품 목록을 가져오는 함수
 */
async function fetchProducts() {
    const keyword = document.getElementById("searchInput")?.value.trim() || "";
    const category = document.getElementById("categorySelect")?.value || "전체 카테고리";
    const status = document.getElementById("statusSelect")?.value || "전체 상태";
    const sortBy = document.getElementById("sortSelect")?.value || "latest";

    try {
        // A. 전체 필터링된 데이터 개수 조회를 위한 요청 (페이지네이션 계산용)
        let countUrl = `${API_BASE_URL}/products?`;
        const countParams = new URLSearchParams();
        if (keyword) countParams.append("keyword", keyword);
        if (category && category !== "전체 카테고리") countParams.append("category", category);
        if (status && status !== "전체 상태") countParams.append("status", status);

        const countRes = await fetch(countUrl + countParams.toString());
        const allFiltered = await countRes.json();
        const totalCount = allFiltered.length;

        // B. 실제 현재 페이지 데이터 요청 (page, limit, sort_by 포함)
        let url = `${API_BASE_URL}/products?`;
        const params = new URLSearchParams();
        if (keyword) params.append("keyword", keyword);
        if (category && category !== "전체 카테고리") params.append("category", category);
        if (status && status !== "전체 상태") params.append("status", status);
        if (sortBy && sortBy !== "latest") params.append("sort_by", sortBy);
        params.append("page", currentPage);
        params.append("limit", limit);

        const res = await fetch(url + params.toString());
        if (!res.ok) throw new Error("상품 목록을 불러오는데 실패했습니다.");

        const products = await res.json();

        // 화면 렌더링 및 페이지네이션 버튼 생성
        renderDashboard(products, totalCount);
        renderPagination(totalCount);

    } catch (error) {
        console.error("API 연동 에러:", error);
    }
}

/**
 * 2. 카테고리 셀렉트박스 목록을 동적으로 채우는 함수
 */
async function initCategoryFilter() {
    const categorySelect = document.getElementById("categorySelect");
    if (!categorySelect) return;

    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        if (res.ok) {
            const products = await res.json();
            const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

            categorySelect.innerHTML = `<option value="전체 카테고리">전체 카테고리</option>` +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
        }
    } catch (e) {
        console.error("카테고리 목록 로딩 실패:", e);
    }
}

/**
 * 3. 검색, 필터, 정렬 UI 요소에 이벤트 리스너 바인딩
 */
function initEventListeners() {
    const searchInput = document.getElementById("searchInput");
    const categorySelect = document.getElementById("categorySelect");
    const statusSelect = document.getElementById("statusSelect");
    const sortSelect = document.getElementById("sortSelect");

    // 검색어 입력 시 (1페이지로 초기화 후 조회)
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            currentPage = 1;
            fetchProducts();
        });
    }

    // 카테고리 변경 시
    if (categorySelect) {
        categorySelect.addEventListener("change", () => {
            currentPage = 1;
            fetchProducts();
        });
    }

    // 판매 상태 변경 시
    if (statusSelect) {
        statusSelect.addEventListener("change", () => {
            currentPage = 1;
            fetchProducts();
        });
    }

    // 정렬 방식 변경 시
    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            currentPage = 1;
            fetchProducts();
        });
    }
}

/**
 * 4. 페이지네이션 버튼 UI 동적 생성 함수
 */
function renderPagination(totalCount) {
    const container = document.getElementById("paginationContainer");
    if (!container) return;

    const totalPages = Math.ceil(totalCount / limit) || 1;

    let html = "";
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? "active" : "";
        html += `<button class="${activeClass}" onclick="changePage(${i})">${i}</button>`;
    }
    container.innerHTML = html;
}

/**
 * 5. 페이지 번호 클릭 시 실행되는 함수
 */
function changePage(page) {
    currentPage = page;
    fetchProducts();
    window.scrollTo({ top: 500, behavior: 'smooth' }); // 페이지 이동 시 상단으로 부드럽게 스크롤
}

/**
 * 6. 대시보드 요약 정보 및 상품 목록 DOM 렌더링 함수
 */
function renderDashboard(products, totalCount) {
    // 전체 요약 카드 계산은 전체 원본 데이터 기준으로 하거나 현재 목록 기준으로 반영
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const lowStockCount = products.filter(p => p.quantity < (p.min_quantity || 10)).length;
    const totalAssetValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);
    const assetValueMan = Math.floor(totalAssetValue / 10000);

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
        productListContainer.innerHTML = `<p style="text-align: center; padding: 30px; color: #64748b;">조건에 일치하는 상품이 없습니다.</p>`;
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
 * 7. 상품 신규 등록 API 요청 함수 (modal.js에서 호출)
 */
async function saveCreateProduct(payload) {
    try {
        const res = await fetch(`${API_BASE_URL}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (res.ok && result.success) {
            alert(result.message);
            closeModal();
            fetchProducts();
        } else {
            alert(result.detail || "상품 등록에 실패했습니다.");
        }
    } catch (error) {
        console.error("상품 등록 통신 에러:", error);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}

/**
 * 8. 특정 상품 상세 정보 조회 후 수정 모달 열기
 */
async function editProduct(productId) {
    try {
        const res = await fetch(`${API_BASE_URL}/products/${productId}`);
        const result = await res.json();

        if (res.ok && result.success) {
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
 * 9. 상품 수정 API 요청 함수
 */
async function saveUpdateProduct(productId, payload) {
    try {
        const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (res.ok && result.success) {
            alert(result.message);
            closeModal();
            fetchProducts();
        } else {
            alert(result.detail || "상품 수정에 실패했습니다.");
        }
    } catch (error) {
        console.error("상품 수정 통신 에러:", error);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}

/**
 * 10. 상품 삭제 API 요청 함수
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
            fetchProducts();
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