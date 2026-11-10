document.addEventListener("DOMContentLoaded", () => {
    // 1. modal.html 템플릿을 index.html의 #modal-container 영역으로 읽어와 삽입
    loadModalTemplate();
});

/**
 * modal.html 파일을 비동기로 불러와 페이지에 동적으로 삽입하는 함수
 */
async function loadModalTemplate() {
    try {
        const response = await fetch("./modal.html");
        if (!response.ok) {
            throw new Error("modal.html 템플릿을 불러오지 못했습니다.");
        }
        const modalHtml = await response.text();
        const container = document.getElementById("modal-container");
        if (container) {
            container.innerHTML = modalHtml;
            // 템플릿 로드 후 이벤트 리스너 바인딩
            initModalEvents();
        }
    } catch (error) {
        console.error("모달 템플릿 로딩 실패:", error);
    }
}

/**
 * 모달 내부 이벤트(닫기, 폼 제출, 열기 버튼) 등록 함수
 */
function initModalEvents() {
    const modalOverlay = document.getElementById("productModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const productForm = document.getElementById("productForm");
    const openCreateModalBtn = document.getElementById("openCreateModalBtn");

    // 1) 헤더의 [상품 등록] 버튼 클릭 시 모달 열기 (등록 모드)
    if (openCreateModalBtn) {
        openCreateModalBtn.addEventListener("click", () => {
            openModalForCreate();
        });
    }

    // 2) 닫기 및 취소 버튼 클릭 시 모달 닫기
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

    // 3) 모달 바깥 배경 클릭 시 모달 닫기
    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // 4) 폼 제출(Submit) 이벤트
    if (productForm) {
        productForm.addEventListener("submit", handleFormSubmit);
    }
}

/**
 * 상품 등록 모드로 모달 띄우기
 */
function openModalForCreate() {
    const modalOverlay = document.getElementById("productModal");
    const modalTitle = document.getElementById("modalTitle");
    const productForm = document.getElementById("productForm");

    if (!modalOverlay || !productForm) return;

    // 폼 초기화 및 숨겨진 ID 제거
    productForm.reset();
    document.getElementById("productId").value = "";

    modalTitle.textContent = "상품 등록";
    modalOverlay.classList.add("active");
    modalOverlay.style.display = "flex";
}

/**
 * 상품 수정 모드로 모달 띄우기 (data_api.js 등 외부 호출용)
 * @param {Object} product - 서버에서 조회한 기존 상품 정보 객체
 */
function openModalForEdit(product) {
    const modalOverlay = document.getElementById("productModal");
    const modalTitle = document.getElementById("modalTitle");

    if (!modalOverlay) return;

    // 기존 상품 데이터를 폼 input 요소에 채워 넣기
    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name || "";
    document.getElementById("productCode").value = product.code || "";
    document.getElementById("productCategory").value = product.category || "";
    document.getElementById("productPrice").value = product.price || 0;
    document.getElementById("productQuantity").value = product.quantity || 0;
    document.getElementById("productMinQuantity").value = product.min_quantity || 10;
    document.getElementById("productStatus").value = product.status || "판매중";
    document.getElementById("productSupplier").value = product.supplier || "";

    modalTitle.textContent = "상품 수정";
    modalOverlay.classList.add("active");
    modalOverlay.style.display = "flex";
}

/**
 * 모달 닫기 함수
 */
function closeModal() {
    const modalOverlay = document.getElementById("productModal");
    if (modalOverlay) {
        modalOverlay.classList.remove("active");
        setTimeout(() => {
            modalOverlay.style.display = "none";
        }, 200);
    }
}

/**
 * 폼 제출 처리 함수 (등록 및 수정 요청 분기)
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById("productId").value;

    // 폼 입력 데이터 수집
    const payload = {
        name: document.getElementById("productName").value.trim(),
        code: document.getElementById("productCode").value.trim() || null,
        category: document.getElementById("productCategory").value.trim(),
        price: parseInt(document.getElementById("productPrice").value, 10),
        quantity: parseInt(document.getElementById("productQuantity").value, 10),
        min_quantity: parseInt(document.getElementById("productMinQuantity").value, 10),
        status: document.getElementById("productStatus").value,
        supplier: document.getElementById("productSupplier").value.trim()
    };

    if (productId) {
        // ID가 있으면 수정 API 호출 (data_api.js 내 함수)
        await saveUpdateProduct(productId, payload);
    } else {
        // ID가 없으면 등록 API 호출 (data_api.js 내 함수)
        await saveCreateProduct(payload);
    }
}