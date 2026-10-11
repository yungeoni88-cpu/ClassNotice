/**
 * [notice.js] 공지사항 카테고리 로직
 * - 공지사항 데이터 관리
 * - 검색 및 태그 필터링
 * - 상세 내용 모달 팝업 제어
 */

// 초기 공지 데이터 (실제 서비스에서는 백엔드 API 또는 JSON 파일 연동)
const noticeData = [
  {
    id: 1,
    tag: "필독",
    isImportant: true,
    title: "10월 둘째 주 현장체험학습 안전 수칙 및 준비물 안내",
    content: `안녕하세요, 2학년 4반 학생 여러분!\n\n이번 주 금요일 진행되는 가을 현장체험학습(에버랜드) 관련 안내사항입니다.\n\n1. 집합 시간: 오전 8시 20분 (교실 집합, 늦지 않도록 유의)\n2. 복장: 단정한 사복 (활동하기 편한 운동화 필수)\n3. 필수 준비물: 학생증, 개인 비상약, 보조배터리, 필기도구\n4. 유의사항:\n- 4인 1조 개별 이동 원칙 준수\n- 비상시 담임선생님 연락처(010-XXXX-XXXX)로 즉시 연락\n- 지정된 귀가 시간(오후 4시 정문 집합) 엄수`,
    author: "담임선생님",
    date: "2026-10-10",
  },
  {
    id: 2,
    tag: "과제",
    isImportant: false,
    title: "수학Ⅰ 2단원 삼각함수 수행평가 제출 기한 연장 안내",
    content: `수학 수행평가 보고서 제출 기한이 이번 주 수요일(14일) 방과 후 5시까지로 1일 연장되었습니다.\n\n구글 클래스룸에 PDF 파일 형식으로 과제 번호와 이름을 적어 업로드해주세요.\n* 기한 이후 제출 시 감점 처리되니 미리 제출 바랍니다.`,
    author: "수학부장",
    date: "2026-10-09",
  },
  {
    id: 3,
    tag: "행사",
    isImportant: false,
    title: "교내 독서 골든벨 참가 신청 (10월 20일까지)",
    content: `2학기 교내 독서 골든벨 행사에 참여할 학생은 반장에게 수요일까지 신청해 주시기 바랍니다.\n\n선정도서: '페인트', '클로버', '불편한 편의점'\n우수자에게는 상장 및 문화상품권이 지급됩니다!`,
    author: "반장",
    date: "2026-10-08",
  },
  {
    id: 4,
    tag: "준비물",
    isImportant: false,
    title: "미술 시간 수채화 도구 및 켄트지 지참 안내",
    content: `내일(화요일) 3교시 미술 시간에는 풍경화 채색 작업이 진행됩니다.\n\n개인 붓, 팔레트, 물통을 반드시 챙겨오세요. 켄트지는 미술실에서 배부됩니다.`,
    author: "미술부장",
    date: "2026-10-07",
  }
];

let currentFilterTag = "all";
let currentSearchKeyword = "";

// 공지사항 모듈 초기화
function initNoticeModule() {
  renderNoticeList();
  setupNoticeEvents();
  updateNoticeBadge();
}

// 공지 뱃지 카운트 업데이트
function updateNoticeBadge() {
  const badge = document.getElementById("noticeBadge");
  if (badge) {
    badge.textContent = noticeData.length;
  }
}

// 이벤트 리스너 등록
function setupNoticeEvents() {
  // 태그 필터 버튼 클릭
  const filterButtons = document.querySelectorAll("#noticeTagFilters .filter-btn");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilterTag = btn.dataset.filter;
      renderNoticeList();
    });
  });

  // 검색창 입력 이벤트
  const searchInput = document.getElementById("noticeSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchKeyword = e.target.value.trim().toLowerCase();
      renderNoticeList();
    });
  }

  // 모달 닫기 버튼 이벤트
  const modalBackdrop = document.getElementById("noticeModalBackdrop");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  const closeModal = () => {
    modalBackdrop.classList.remove("active");
  };

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalConfirmBtn) modalConfirmBtn.addEventListener("click", closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }
}

// 공지 목록 필터링 및 렌더링
function renderNoticeList() {
  const container = document.getElementById("noticeListContainer");
  if (!container) return;

  const filtered = noticeData.filter(item => {
    const matchTag = (currentFilterTag === "all") || (item.tag === currentFilterTag);
    const matchKeyword = currentSearchKeyword === "" || 
      item.title.toLowerCase().includes(currentSearchKeyword) || 
      item.content.toLowerCase().includes(currentSearchKeyword);
    return matchTag && matchKeyword;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <p>조건에 맞는 공지사항이 없습니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <article class="notice-card ${item.isImportant ? 'is-important' : ''}" onclick="openNoticeModal(${item.id})">
      <div class="notice-card-top">
        <div class="notice-badges">
          <span class="tag-badge ${item.isImportant ? 'important' : ''}">${item.isImportant ? '🚨 ' : ''}${item.tag}</span>
        </div>
        <span class="notice-date">${item.date}</span>
      </div>
      <h3 class="notice-title">
        ${item.title}
      </h3>
      <p class="notice-preview">${item.content}</p>
      <div class="notice-footer">
        <span><i class="fa-solid fa-user-pen"></i> 작성자: ${item.author}</span>
        <span>자세히 보기 <i class="fa-solid fa-chevron-right"></i></span>
      </div>
    </article>
  `).join("");
}

// 공지사항 상세 모달 열기
function openNoticeModal(id) {
  const item = noticeData.find(n => n.id === id);
  if (!item) return;

  const backdrop = document.getElementById("noticeModalBackdrop");
  document.getElementById("modalTag").textContent = item.tag;
  document.getElementById("modalTag").className = `modal-tag ${item.isImportant ? 'important' : ''}`;
  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalAuthor").innerHTML = `<i class="fa-solid fa-user"></i> ${item.author}`;
  document.getElementById("modalDate").innerHTML = `<i class="fa-regular fa-clock"></i> ${item.date}`;
  document.getElementById("modalContent").textContent = item.content;

  backdrop.classList.add("active");
}
