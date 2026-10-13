/**
 * [etc.js] 학급 자료실 (Archive) 카테고리 로직
 * - 자료실 / 자료신청 2대 서브 탭 전환 제어
 * - 교과 학습 자료 및 PDF 교과서 목록 렌더링 (미리보기 & 다운로드 연동)
 */

// 등록된 학습 자료 목록 (PDF 교과서 및 수업 보조 자료)
const archiveMaterials = [
  {
    id: "mat-1",
    title: "물질과 에너지 교과서",
    subject: "과학",
    fileName: "물질과 에너지 교과서.pdf",
    filePath: "files/물질과 에너지 교과서.pdf",
    fileSize: "17.3 MB",
    fileExt: "PDF",
    uploadDate: "2026.10.12",
    description: "2학년 4반 정규 수업 및 수행 대비 교과서 전문 전자책(PDF)"
  },
  {
    id: "mat-2",
    title: "미적분II 교과서",
    subject: "수학",
    fileName: "미적분II 교과서.pdf",
    filePath: "files/미적분II 교과서.pdf",
    fileSize: "38.6 MB",
    fileExt: "PDF",
    uploadDate: "2026.10.12",
    description: "2학년 4반 정규 수업 및 지필/수행평가 대비 교과서 전문 전자책(PDF)"
  },
  {
    id: "mat-3",
    title: "확률과 통계 교과서",
    subject: "수학",
    fileName: "확통 교과서.pdf",
    filePath: "files/확통 교과서.pdf",
    fileSize: "42.2 MB",
    fileExt: "PDF",
    uploadDate: "2026.10.12",
    description: "2학년 4반 정규 수업 및 지필/수행평가 대비 교과서 전문 전자책(PDF)"
  }
];

let selectedArchiveFilter = "all"; // 'all', '수학', '과학'

// 로컬 스토리지 키 상수
const STORAGE_KEY_JP = "daeryun_jp_requests";
const STORAGE_KEY_ANON = "daeryun_anon_requests";
const STORAGE_KEY_ADMIN_AUTH = "daeryun_archive_admin_auth";

// [관리자 비밀번호 설정]
// 관리자(사용자) 본인만 익명 요청 글을 삭제할 수 있도록 보호합니다.
const ARCHIVE_ADMIN_PW = "38040281";

// 관리자 인증 여부 확인
function isArchiveAdmin() {
  return localStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === "true";
}

function initEtcModule() {
  setupArchiveSubtabs();
  renderArchiveMaterials();
  setupJapaneseRequestForm();
  setupAnonymousRequestForm();
}

/**
 * 자료실 / 자료신청 서브탭 전환 설정
 */
function setupArchiveSubtabs() {
  const tabButtons = document.querySelectorAll(".archive-subtab-btn");
  const repoPanel = document.getElementById("archiveRepoPanel");
  const requestPanel = document.getElementById("archiveRequestPanel");

  if (!tabButtons || tabButtons.length === 0) return;

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const targetTab = btn.getAttribute("data-archive-tab");
      if (targetTab === "repo") {
        if (repoPanel) repoPanel.classList.add("active");
        if (requestPanel) requestPanel.classList.remove("active");
      } else if (targetTab === "request") {
        if (repoPanel) repoPanel.classList.remove("active");
        if (requestPanel) requestPanel.classList.add("active");
      }
    });
  });
}

/**
 * 학습 자료 목록 렌더링
 */
function renderArchiveMaterials() {
  const container = document.getElementById("archiveRepoPanel");
  if (!container) return;

  if (archiveMaterials.length === 0) {
    container.innerHTML = `
      <div class="card-box archive-empty-card">
        <div class="empty-state-visual">
          <i class="fa-regular fa-folder-open"></i>
        </div>
        <h3 class="empty-state-title">등록된 학습 자료가 없습니다</h3>
        <p class="empty-state-sub">추후 업로드되는 교과 수업 자료, 유인물, 모의고사 기출 분석 자료가 이곳에 표시됩니다.</p>
      </div>
    `;
    return;
  }

  // 필터링
  const filteredList = selectedArchiveFilter === "all"
    ? archiveMaterials
    : archiveMaterials.filter(m => m.subject === selectedArchiveFilter);

  // 상단 툴바
  const filterHtml = `
    <div class="archive-toolbar">
      <div class="archive-count-info">
        <i class="fa-solid fa-file-pdf"></i>
        <span>총 <strong>${archiveMaterials.length}</strong>개의 학습 자료가 등록되어 있습니다.</span>
      </div>
      <div class="archive-subject-filters">
        <button class="archive-filter-chip ${selectedArchiveFilter === 'all' ? 'active' : ''}" data-filter="all">전체 (${archiveMaterials.length})</button>
        <button class="archive-filter-chip ${selectedArchiveFilter === '수학' ? 'active' : ''}" data-filter="수학">수학 (${archiveMaterials.filter(m => m.subject === '수학').length})</button>
        <button class="archive-filter-chip ${selectedArchiveFilter === '과학' ? 'active' : ''}" data-filter="과학">과학 (${archiveMaterials.filter(m => m.subject === '과학').length})</button>
      </div>
    </div>
  `;

  // 카드 그리드
  const cardsHtml = `
    <div class="archive-materials-grid">
      ${filteredList.map(item => {
        const encodedUrl = encodeURI(item.filePath);
        return `
          <div class="card-box material-card">
            <div class="material-card-top">
              <div class="material-badges">
                <span class="material-subj-tag subj-${item.subject === '수학' ? 'math' : 'sci'}">${item.subject}</span>
                <span class="material-ext-tag"><i class="fa-solid fa-file-pdf"></i> ${item.fileExt}</span>
              </div>
              <span class="material-size-badge">${item.fileSize}</span>
            </div>
            
            <div class="material-card-body">
              <div class="material-icon-box">
                <i class="fa-solid fa-book-bookmark"></i>
              </div>
              <div class="material-text-wrap">
                <h4 class="material-title" title="${item.title}">${item.title}</h4>
                <p class="material-desc">${item.description}</p>
                <div class="material-meta-row">
                  <span><i class="fa-regular fa-calendar"></i> ${item.uploadDate}</span>
                  <span><i class="fa-regular fa-file"></i> ${item.fileName}</span>
                </div>
              </div>
            </div>

            <div class="material-card-footer">
              <a href="${encodedUrl}" target="_blank" rel="noopener noreferrer" class="btn-material-preview" title="새 탭에서 PDF 열람">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> 바로보기
              </a>
              <a href="${encodedUrl}" download="${item.fileName}" class="btn-material-download" title="기기에 파일 다운로드">
                <i class="fa-solid fa-download"></i> 다운로드
              </a>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  container.innerHTML = filterHtml + cardsHtml;

  // 필터 버튼 이벤트 바인딩
  const filterBtns = container.querySelectorAll(".archive-filter-chip");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedArchiveFilter = btn.getAttribute("data-filter");
      renderArchiveMaterials();
    });
  });
}

/**
 * ========================================================
 * [박스 1] 일본어 기말자료 신청 로직
 * - 출석번호(1~24번) 선택 + 학생 이름 수동 입력
 * - 번호 중복 방지 및 오름차순 자동 정렬
 * - 실시간 현황 칩 렌더링, 신청 취소, 명단 클립보드 복사
 * ========================================================
 */
function setupJapaneseRequestForm() {
  const form = document.getElementById("jpRequestForm");
  const numSelect = document.getElementById("jpStudentNum");
  const nameInput = document.getElementById("jpStudentName");
  const listContainer = document.getElementById("jpRequestListContainer");
  const countBadge = document.getElementById("jpCountBadge");
  const copyBtn = document.getElementById("jpCopyListBtn");

  if (!form || !numSelect || !nameInput || !listContainer) return;

  function loadJpRequests() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_JP);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("일본어 신청 데이터 불러오기 오류:", e);
      return [];
    }
  }

  function saveJpRequests(list) {
    try {
      localStorage.setItem(STORAGE_KEY_JP, JSON.stringify(list));
    } catch (e) {
      console.error("일본어 신청 데이터 저장 오류:", e);
    }
  }

  function renderJpList() {
    const list = loadJpRequests();
    if (countBadge) countBadge.textContent = list.length;

    if (list.length === 0) {
      listContainer.innerHTML = `
        <div class="request-empty-state">
          <i class="fa-regular fa-clipboard"></i>
          <p>아직 일본어 자료를 신청한 학생이 없습니다.<br>출석번호와 이름을 입력하여 첫 번째로 신청해보세요!</p>
        </div>
      `;
      return;
    }

    // 출석번호 순으로 정렬
    list.sort((a, b) => Number(a.num) - Number(b.num));

    listContainer.innerHTML = `
      <div class="jp-chips-grid">
        ${list.map(item => `
          <div class="jp-student-chip" data-num="${item.num}">
            <span class="chip-num">${item.num}번</span>
            <span class="chip-name">${escapeHtml(item.name)}</span>
            <button type="button" class="btn-cancel-chip" data-num="${item.num}" title="${item.num}번 신청 취소">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        `).join("")}
      </div>
    `;

    // 신청 취소 버튼 이벤트 바인딩
    const cancelBtns = listContainer.querySelectorAll(".btn-cancel-chip");
    cancelBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetNum = Number(btn.getAttribute("data-num"));
        const targetItem = list.find(it => Number(it.num) === targetNum);
        const displayName = targetItem ? `${targetItem.num}번 ${targetItem.name}` : `${targetNum}번`;

        if (confirm(`${displayName} 학생의 일본어 자료 신청을 취소하시겠습니까?`)) {
          const updated = list.filter(it => Number(it.num) !== targetNum);
          saveJpRequests(updated);
          renderJpList();
        }
      });
    });
  }

  // 폼 제출 이벤트
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const num = Number(numSelect.value);
    const name = nameInput.value.trim();

    if (!num || num < 1 || num > 24) {
      alert("출석번호를 1번부터 24번 사이에서 올바르게 선택해주세요.");
      numSelect.focus();
      return;
    }

    if (!name) {
      alert("학생 이름을 입력해주세요.");
      nameInput.focus();
      return;
    }

    const currentList = loadJpRequests();
    const existing = currentList.find(it => Number(it.num) === num);
    if (existing) {
      alert(`이미 ${num}번(${existing.name}) 학생이 신청을 완료했습니다.\n번호를 잘못 선택하셨거나 수정을 원하시면 기존 신청을 취소한 후 다시 시도해주세요.`);
      return;
    }

    currentList.push({
      num: num,
      name: name,
      createdAt: formatSimpleDate(new Date())
    });

    saveJpRequests(currentList);
    renderJpList();

    // 폼 초기화
    numSelect.value = "";
    nameInput.value = "";

    alert(`${num}번 ${name} 학생의 일본어 기말자료 신청이 완료되었습니다!`);
  });

  // 명단 클립보드 복사 버튼
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const list = loadJpRequests();
      if (list.length === 0) {
        alert("복사할 신청자 명단이 아직 없습니다.");
        return;
      }

      list.sort((a, b) => Number(a.num) - Number(b.num));
      const textLines = [
        `[대륜고 2학년 4반 일본어 기말자료 신청 명단]`,
        `총 신청: ${list.length}명 / 24명`,
        `----------------------------------------`,
        ...list.map(it => `${it.num}번 ${it.name}`)
      ];

      const fullText = textLines.join("\n");
      navigator.clipboard.writeText(fullText)
        .then(() => {
          const originalHtml = copyBtn.innerHTML;
          copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> 복사 완료!`;
          copyBtn.classList.add("copied");
          setTimeout(() => {
            copyBtn.innerHTML = originalHtml;
            copyBtn.classList.remove("copied");
          }, 2000);
        })
        .catch(err => {
          console.error("클립보드 복사 실패:", err);
          alert("명단 복사 중 오류가 발생했습니다. 브라우저 권한을 확인해주세요.");
        });
    });
  }

  // 초기 렌더링
  renderJpList();
}

/**
 * ========================================================
 * [박스 2] 자유 익명 자료 요청 로직
 * - 100% 익명 보장 피드 (이름 없이 자유 글 작성)
 * - 과목 선택 및 상세 요청 내용 입력
 * - 실시간 피드 렌더링, 공감(좋아요), 삭제 기능
 * ========================================================
 */
function setupAnonymousRequestForm() {
  const form = document.getElementById("anonRequestForm");
  const subjSelect = document.getElementById("anonSubjectSelect");
  const contentInput = document.getElementById("anonContent");
  const feedContainer = document.getElementById("anonFeedContainer");
  const countBadge = document.getElementById("anonCountBadge");
  const adminAuthBtn = document.getElementById("anonAdminAuthBtn");
  const adminAuthIcon = document.getElementById("adminAuthIcon");
  const adminAuthBtnText = document.getElementById("adminAuthBtnText");

  if (!form || !subjSelect || !contentInput || !feedContainer) return;

  function loadAnonRequests() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ANON);
      if (data) return JSON.parse(data);

      // 기본 데모 샘플 데이터 제공 (학우들이 형식과 분위기를 참고할 수 있도록)
      return [
        {
          id: "anon-demo-1",
          subject: "일본어",
          content: "기말고사 시험범위 주요 단어랑 본문 필수 문형 정리 유인물도 혹시 올려주실 수 있나요?",
          createdAt: "10.13",
          likes: 3,
          liked: false
        }
      ];
    } catch (e) {
      console.error("익명 요청 데이터 불러오기 오류:", e);
      return [];
    }
  }

  function saveAnonRequests(list) {
    try {
      localStorage.setItem(STORAGE_KEY_ANON, JSON.stringify(list));
    } catch (e) {
      console.error("익명 요청 데이터 저장 오류:", e);
    }
  }

  // 관리자 인증 버튼 UI 동기화
  function updateAdminAuthUI() {
    if (!adminAuthBtn) return;
    const isAdmin = isArchiveAdmin();

    if (isAdmin) {
      adminAuthBtn.classList.add("active");
      adminAuthBtn.title = "관리자 권한 활성화됨 (클릭 시 로그아웃)";
      if (adminAuthIcon) adminAuthIcon.className = "fa-solid fa-unlock-keyhole";
      if (adminAuthBtnText) adminAuthBtnText.textContent = "관리자 ON";
    } else {
      adminAuthBtn.classList.remove("active");
      adminAuthBtn.title = "관리자 인증 (글 삭제 권한 활성화)";
      if (adminAuthIcon) adminAuthIcon.className = "fa-solid fa-lock";
      if (adminAuthBtnText) adminAuthBtnText.textContent = "관리자";
    }
  }

  function renderAnonFeed() {
    const list = loadAnonRequests();
    const isAdmin = isArchiveAdmin();

    if (countBadge) countBadge.textContent = list.length;
    updateAdminAuthUI();

    if (list.length === 0) {
      feedContainer.innerHTML = `
        <div class="request-empty-state">
          <i class="fa-regular fa-comment-dots"></i>
          <p>아직 등록된 익명 요청이 없습니다.<br>필요한 교과 자료나 기출문제를 자유롭게 남겨보세요!</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = `
      <div class="anon-feed-list">
        ${list.map(item => `
          <div class="anon-feed-item" data-id="${item.id}">
            <div class="anon-item-header">
              <div class="anon-meta-left">
                <span class="anon-subj-pill subj-${getSubjectColorClass(item.subject)}">${escapeHtml(item.subject)}</span>
                <span class="anon-author"><i class="fa-solid fa-user-secret"></i> 익명의 학우</span>
              </div>
              <div class="anon-meta-right">
                <span class="anon-time">${item.createdAt}</span>
                ${isAdmin ? `
                  <button type="button" class="btn-anon-delete" data-id="${item.id}" title="요청 글 삭제 (관리자 전용)">
                    <i class="fa-regular fa-trash-can"></i>
                  </button>
                ` : ""}
              </div>
            </div>
            <div class="anon-item-body">
              <p class="anon-content-text">${escapeHtml(item.content)}</p>
            </div>
            <div class="anon-item-footer">
              <button type="button" class="btn-anon-like ${item.liked ? 'active' : ''}" data-id="${item.id}">
                <i class="fa-${item.liked ? 'solid' : 'regular'} fa-heart"></i>
                <span>나도 필요해요</span>
                <strong class="like-count">${item.likes || 0}</strong>
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    // 공감(좋아요) 버튼 이벤트
    const likeBtns = feedContainer.querySelectorAll(".btn-anon-like");
    likeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const currentList = loadAnonRequests();
        const target = currentList.find(it => it.id === id);
        if (!target) return;

        if (target.liked) {
          target.liked = false;
          target.likes = Math.max(0, (target.likes || 1) - 1);
        } else {
          target.liked = true;
          target.likes = (target.likes || 0) + 1;
        }

        saveAnonRequests(currentList);
        renderAnonFeed();
      });
    });

    // 관리자 전용 삭제 버튼 이벤트 (관리자 인증 상태일 때만 동작)
    if (isAdmin) {
      const deleteBtns = feedContainer.querySelectorAll(".btn-anon-delete");
      deleteBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          if (!isArchiveAdmin()) {
            alert("글 삭제 권한이 없습니다. 관리자 인증이 필요합니다.");
            return;
          }

          const id = btn.getAttribute("data-id");
          if (confirm("이 익명 요청 글을 삭제하시겠습니까? (관리자 권한)")) {
            const currentList = loadAnonRequests();
            const updated = currentList.filter(it => it.id !== id);
            saveAnonRequests(updated);
            renderAnonFeed();
          }
        });
      });
    }
  }

  // 관리자 인증 토글 버튼 이벤트
  if (adminAuthBtn) {
    adminAuthBtn.addEventListener("click", () => {
      if (isArchiveAdmin()) {
        if (confirm("관리자 모드를 해제(로그아웃)하시겠습니까?\n해제 시 글 삭제 권한이 비활성화됩니다.")) {
          localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
          alert("관리자 모드가 해제되었습니다.");
          renderAnonFeed();
        }
      } else {
        const inputPw = prompt("익명 글 관리를 위한 관리자 비밀번호를 입력해주세요:");
        if (inputPw === null) return; // 취소

        if (inputPw.trim() === ARCHIVE_ADMIN_PW) {
          localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, "true");
          alert("관리자 인증이 완료되었습니다!\n이제 익명 요청 글을 삭제할 수 있습니다.");
          renderAnonFeed();
        } else {
          alert("관리자 비밀번호가 올바르지 않습니다.");
        }
      }
    });
  }

  // 폼 제출 이벤트
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const subject = subjSelect.value || "공통/기타";
    const content = contentInput.value.trim();

    if (!content) {
      alert("요청하실 자료 내용을 작성해주세요.");
      contentInput.focus();
      return;
    }

    if (content.length < 3) {
      alert("요청 내용은 최소 3자 이상 구체적으로 적어주세요.");
      contentInput.focus();
      return;
    }

    const currentList = loadAnonRequests();
    const newItem = {
      id: "anon_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      subject: subject,
      content: content,
      createdAt: formatSimpleDate(new Date()),
      likes: 0,
      liked: false
    };

    currentList.unshift(newItem); // 최신글 상단 추가
    saveAnonRequests(currentList);
    renderAnonFeed();

    // 폼 리셋
    contentInput.value = "";

    alert("익명 자료 요청이 성공적으로 등록되었습니다!");
  });

  // 초기 렌더링
  renderAnonFeed();
}

/**
 * --------------------------------------------------------
 * 헬퍼 유틸리티 함수
 * --------------------------------------------------------
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

function formatSimpleDate(d) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}.${day} ${hh}:${mm}`;
}

function getSubjectColorClass(subj) {
  if (!subj) return "etc";
  if (subj.includes("수학")) return "math";
  if (subj.includes("과학")) return "sci";
  if (subj.includes("국어")) return "kor";
  if (subj.includes("영어")) return "eng";
  if (subj.includes("일본어")) return "jp";
  return "etc";
}

