/**
 * [etc.js] 학급 자료실 (Archive) 카테고리 로직
 * - 자료실 / 자료신청 2대 서브 탭 전환 제어
 * - 교과 학습 자료 및 PDF 교과서 목록 렌더링 (미리보기 & 다운로드 연동)
 */

// 등록된 과목별 학습 자료 그룹 (과목명별 상자 / 윈도우 폴더 구조)
const archiveSubjectGroups = [
  {
    groupId: "grp-math",
    subjectName: "수학",
    description: "미적분II 및 확률과 통계 교과서 전문 전자책(PDF)",
    files: [
      {
        id: "mat-math-1",
        title: "미적분II 교과서",
        fileName: "미적분II 교과서.pdf",
        filePath: "files/미적분II 교과서.pdf",
        fileSize: "38.6 MB",
        fileExt: "PDF",
        uploadDate: "2026.10.12"
      },
      {
        id: "mat-math-2",
        title: "확률과 통계 교과서",
        fileName: "확통 교과서.pdf",
        filePath: "files/확통 교과서.pdf",
        fileSize: "42.2 MB",
        fileExt: "PDF",
        uploadDate: "2026.10.12"
      }
    ]
  },
  {
    groupId: "grp-eng",
    subjectName: "영어 & 영어 발표와 토론",
    description: "모의고사 기출 및 시험 대비 핵심 학습 자료",
    files: [
      {
        id: "mat-eng-2025-10",
        title: "2025년 10월 모의고사 (고2)",
        fileName: "2025년 10월 모의고사(고2).pdf",
        filePath: "files/2025년 10월 모의고사(고2).pdf",
        fileSize: "486 KB",
        fileExt: "PDF",
        uploadDate: "2026.10.13"
      },
      {
        id: "mat-eng-2025-09",
        title: "2025년 9월 모의고사 (고2)",
        fileName: "2025년 9월 모의고사(고2).pdf",
        filePath: "files/2025년 9월 모의고사(고2).pdf",
        fileSize: "414 KB",
        fileExt: "PDF",
        uploadDate: "2026.10.13"
      },
      {
        id: "mat-eng-2024-10",
        title: "2024년 10월 모의고사 (고2)",
        fileName: "2024년 10월 모의고사(고2).pdf",
        filePath: "files/2024년 10월 모의고사(고2).pdf",
        fileSize: "728 KB",
        fileExt: "PDF",
        uploadDate: "2026.10.13"
      },
      {
        id: "mat-eng-2024-09",
        title: "2024년 9월 모의고사 (고2)",
        fileName: "2024년 9월 모의고사(고2).pdf",
        filePath: "files/2024년 9월 모의고사(고2).pdf",
        fileSize: "1.09 MB",
        fileExt: "PDF",
        uploadDate: "2026.10.13"
      },
      {
        id: "mat-eng-2023-09",
        title: "2023년 9월 모의고사 (고2)",
        fileName: "2023년 9월 모의고사(고2).pdf",
        filePath: "files/2023년 9월 모의고사(고2).pdf",
        fileSize: "905 KB",
        fileExt: "PDF",
        uploadDate: "2026.10.13"
      }
    ]
  },
  {
    groupId: "grp-matter",
    subjectName: "물질과 에너지",
    description: "2학년 4반 정규 수업 및 수행 대비 교과서 전문 전자책(PDF)",
    files: [
      {
        id: "mat-sci-1",
        title: "물질과 에너지 교과서",
        fileName: "물질과 에너지 교과서.pdf",
        filePath: "files/물질과 에너지 교과서.pdf",
        fileSize: "17.3 MB",
        fileExt: "PDF",
        uploadDate: "2026.10.12"
      }
    ]
  }
];

// 로컬 스토리지 키 상수
const STORAGE_KEY_JP = "daeryun_jp_requests";
const STORAGE_KEY_ANON = "daeryun_anon_requests";
const STORAGE_KEY_ADMIN_AUTH = "daeryun_archive_admin_auth";

// [관리자 비밀번호 설정]
// 관리자(사용자) 본인만 익명 요청 글을 삭제할 수 있도록 보호합니다.
const ARCHIVE_ADMIN_PW = "38040281";

// ========================================================
// [Firebase Realtime Database 연동 설정]
// - 반 친구들이 각자 스마트폰/컴퓨터로 신청해도 실시간 동기화
// ========================================================
const firebaseConfig = {
  apiKey: "AIzaSyAwokSUQ9oyv8SzCixa5s0B1rz84mDs-DM",
  authDomain: "classnote-75ff8.firebaseapp.com",
  databaseURL: "https://classnote-75ff8-default-rtdb.firebaseio.com",
  projectId: "classnote-75ff8",
  storageBucket: "classnote-75ff8.firebasestorage.app",
  messagingSenderId: "148059183324",
  appId: "1:148059183324:web:458bae1c9988878d92bc19"
};

let firebaseDb = null;
try {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    firebaseDb = firebase.database();
  }
} catch (e) {
  console.warn("Firebase 초기화 중 알림 (로컬 저장소 모드로 작동):", e);
}

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
 * 학습 자료 목록 렌더링 (과목명별 상자 / 윈도우 탐색기 폴더 구조)
 * - 각 상자(폴더) 접었다 폈다(Collapsible) 토글 기능 지원
 * - 상단 '모두 펼치기 / 모두 접기' 일괄 제어 기능 지원
 */
function renderArchiveMaterials() {
  const container = document.getElementById("archiveRepoPanel");
  if (!container) return;

  const totalFiles = archiveSubjectGroups.reduce((acc, g) => acc + g.files.length, 0);

  if (totalFiles === 0) {
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

  // 상단 툴바 (전체 통계 및 일괄 접기/펼치기 제어)
  const toolbarHtml = `
    <div class="archive-toolbar">
      <div class="archive-count-info">
        <i class="fa-solid fa-folder-open folder-toolbar-icon"></i>
        <span>총 <strong>${archiveSubjectGroups.length}</strong>개 과목 상자 / <strong>${totalFiles}</strong>개 학습 자료가 등록되어 있습니다.</span>
      </div>
      <div class="archive-toolbar-actions">
        <button type="button" class="btn-folder-control" id="btnExpandAllFolders" title="모든 과목 폴더 펼치기">
          <i class="fa-solid fa-folder-open"></i> 모두 펼치기
        </button>
        <button type="button" class="btn-folder-control" id="btnCollapseAllFolders" title="모든 과목 폴더 접기">
          <i class="fa-solid fa-folder"></i> 모두 접기
        </button>
      </div>
    </div>
  `;

  // 과목별 상자(폴더 박스) 그리드
  const foldersGridHtml = `
    <div class="archive-folders-grid">
      ${archiveSubjectGroups.map(group => `
        <div class="card-box archive-folder-box is-collapsed" id="${group.groupId}">
          <div class="folder-box-header" data-group-id="${group.groupId}" title="클릭하여 ${escapeHtml(group.subjectName)} 폴더 접기/펼치기">
            <div class="folder-header-left">
              <div class="folder-icon-wrap">
                <i class="fa-solid fa-folder folder-main-icon"></i>
              </div>
              <div class="folder-title-wrap">
                <h3 class="folder-subject-title">${escapeHtml(group.subjectName)}</h3>
                <p class="folder-desc">${escapeHtml(group.description)}</p>
              </div>
            </div>
            <div class="folder-header-right">
              <span class="folder-count-badge">
                <i class="fa-regular fa-file-lines"></i> ${group.files.length}개 파일
              </span>
              <button type="button" class="folder-toggle-btn" aria-label="${escapeHtml(group.subjectName)} 폴더 접기/펼치기">
                <i class="fa-solid fa-chevron-down"></i>
              </button>
            </div>
          </div>

          <div class="folder-files-container">
            ${group.files.map(file => {
              const encodedUrl = encodeURI(file.filePath);
              return `
                <div class="folder-file-row">
                  <div class="file-row-left">
                    <div class="file-type-icon">
                      <i class="fa-solid fa-file-pdf"></i>
                    </div>
                    <div class="file-details">
                      <h4 class="file-title" title="${escapeHtml(file.fileName)}">${escapeHtml(file.title)}</h4>
                      <div class="file-meta">
                        <span class="file-size-tag"><i class="fa-regular fa-hard-drive"></i> ${file.fileSize}</span>
                        <span class="file-date-tag"><i class="fa-regular fa-calendar"></i> ${file.uploadDate}</span>
                      </div>
                    </div>
                  </div>
                  <div class="file-row-actions">
                    <a href="${encodedUrl}" target="_blank" rel="noopener noreferrer" class="btn-file-preview" title="새 탭에서 PDF 열람">
                      <i class="fa-solid fa-arrow-up-right-from-square"></i> <span>바로보기</span>
                    </a>
                    <a href="${encodedUrl}" download="${escapeHtml(file.fileName)}" class="btn-file-download" title="기기에 파일 다운로드">
                      <i class="fa-solid fa-download"></i> <span>다운로드</span>
                    </a>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;

  container.innerHTML = toolbarHtml + foldersGridHtml;

  // 1) 개별 폴더 헤더 클릭 시 접기/펼치기 토글
  const folderHeaders = container.querySelectorAll(".folder-box-header");
  folderHeaders.forEach(header => {
    header.addEventListener("click", () => {
      const box = header.closest(".archive-folder-box");
      if (!box) return;

      const isCollapsed = box.classList.toggle("is-collapsed");
      const icon = box.querySelector(".folder-main-icon");
      const chevron = box.querySelector(".folder-toggle-btn i");

      if (isCollapsed) {
        if (icon) icon.className = "fa-solid fa-folder folder-main-icon";
        if (chevron) chevron.className = "fa-solid fa-chevron-down";
      } else {
        if (icon) icon.className = "fa-solid fa-folder-open folder-main-icon";
        if (chevron) chevron.className = "fa-solid fa-chevron-up";
      }
    });
  });

  // 2) 모두 펼치기 버튼 이벤트
  const expandAllBtn = container.querySelector("#btnExpandAllFolders");
  if (expandAllBtn) {
    expandAllBtn.addEventListener("click", () => {
      container.querySelectorAll(".archive-folder-box").forEach(box => {
        box.classList.remove("is-collapsed");
        const icon = box.querySelector(".folder-main-icon");
        const chevron = box.querySelector(".folder-toggle-btn i");
        if (icon) icon.className = "fa-solid fa-folder-open folder-main-icon";
        if (chevron) chevron.className = "fa-solid fa-chevron-up";
      });
    });
  }

  // 3) 모두 접기 버튼 이벤트
  const collapseAllBtn = container.querySelector("#btnCollapseAllFolders");
  if (collapseAllBtn) {
    collapseAllBtn.addEventListener("click", () => {
      container.querySelectorAll(".archive-folder-box").forEach(box => {
        box.classList.add("is-collapsed");
        const icon = box.querySelector(".folder-main-icon");
        const chevron = box.querySelector(".folder-toggle-btn i");
        if (icon) icon.className = "fa-solid fa-folder folder-main-icon";
        if (chevron) chevron.className = "fa-solid fa-chevron-down";
      });
    });
  }
}

// 관리자 UI 동기화 헬퍼 (두 박스 모두 리렌더링)
let refreshArchiveModules = () => {};

function handleArchiveAdminToggle() {
  if (isArchiveAdmin()) {
    if (confirm("관리자 모드를 해제(로그아웃)하시겠습니까?\n해제 시 신청 현황 명단 및 글 삭제 권한이 비활성화됩니다.")) {
      localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
      alert("관리자 모드가 해제되었습니다.");
      refreshArchiveModules();
    }
  } else {
    const inputPw = prompt("관리자 비밀번호를 입력해주세요:");
    if (inputPw === null) return;

    if (inputPw.trim() === ARCHIVE_ADMIN_PW) {
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, "true");
      alert("관리자 인증이 완료되었습니다!\n이제 일본어 신청 명단 열람 및 익명 글 관리 권한이 활성화됩니다.");
      refreshArchiveModules();
    } else {
      alert("관리자 비밀번호가 올바르지 않습니다.");
    }
  }
}

/**
 * ========================================================
 * [박스 1] 일본어 기말자료 신청 로직
 * - 출석번호(1~24번) 선택 + 학생 이름 수동 입력
 * - 번호 중복 방지 및 오름차순 자동 정렬
 * - 관리자 전용: 신청 현황 칩 렌더링, 신청 취소, 명단 클립보드 복사
 * - 일반 학생: 신청 현황 비공개 보호 안내 카드 표시
 * ========================================================
 */
function setupJapaneseRequestForm() {
  const form = document.getElementById("jpRequestForm");
  const numSelect = document.getElementById("jpStudentNum");
  const nameInput = document.getElementById("jpStudentName");
  const listContainer = document.getElementById("jpRequestListContainer");
  const countBadge = document.getElementById("jpCountBadge");
  const copyBtn = document.getElementById("jpCopyListBtn");
  const adminAuthBtn = document.getElementById("jpAdminAuthBtn");
  const adminAuthIcon = document.getElementById("jpAdminAuthIcon");
  const adminAuthBtnText = document.getElementById("jpAdminAuthBtnText");
  const submitBtn = document.getElementById("jpSubmitBtn");

  if (!form || !numSelect || !nameInput || !listContainer) return;

  function loadJpRequestsLocal() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_JP);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("일본어 신청 로컬 데이터 불러오기 오류:", e);
      return [];
    }
  }

  function saveJpRequestsLocal(list) {
    try {
      localStorage.setItem(STORAGE_KEY_JP, JSON.stringify(list));
    } catch (e) {
      console.error("일본어 신청 로컬 데이터 저장 오류:", e);
    }
  }

  let jpRequestsList = loadJpRequestsLocal();

  // Firebase 실시간 동기화 리스너
  if (firebaseDb) {
    firebaseDb.ref("jp_requests").on("value", (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => {
          const item = data[key];
          return {
            num: Number(item.num || key),
            name: item.name || "",
            createdAt: item.createdAt || ""
          };
        }).filter(it => it.num && it.name);

        jpRequestsList = list;
        saveJpRequestsLocal(list);
      } else {
        if (jpRequestsList.length > 0) {
          // 기존 로컬 데이터가 있으면 Firebase로 마이그레이션 업로드
          jpRequestsList.forEach(item => {
            if (item.num && item.name) {
              firebaseDb.ref("jp_requests/" + item.num).set(item);
            }
          });
        } else {
          jpRequestsList = [];
          saveJpRequestsLocal([]);
        }
      }
      renderJpList();
    }, (error) => {
      console.warn("Firebase jp_requests 동기화 알림:", error);
    });
  }

  function updateJpAdminUI() {
    if (!adminAuthBtn) return;
    const isAdmin = isArchiveAdmin();

    if (isAdmin) {
      adminAuthBtn.classList.add("active");
      adminAuthBtn.title = "관리자 권한 활성화됨 (클릭 시 로그아웃)";
      if (adminAuthIcon) adminAuthIcon.className = "fa-solid fa-unlock-keyhole";
      if (adminAuthBtnText) adminAuthBtnText.textContent = "관리자 ON";
    } else {
      adminAuthBtn.classList.remove("active");
      adminAuthBtn.title = "관리자 인증 (신청 명단 열람)";
      if (adminAuthIcon) adminAuthIcon.className = "fa-solid fa-lock";
      if (adminAuthBtnText) adminAuthBtnText.textContent = "관리자";
    }
  }

  function renderJpList() {
    const list = [...jpRequestsList];
    const isAdmin = isArchiveAdmin();

    updateJpAdminUI();

    // 관리자가 아닐 때 (일반 학생) : 신청 현황 비공개
    if (!isAdmin) {
      if (countBadge) countBadge.textContent = "비공개";
      if (copyBtn) copyBtn.style.display = "none";

      listContainer.innerHTML = `
        <div class="request-locked-notice">
          <i class="fa-solid fa-user-shield"></i>
          <p class="lock-title">신청자 명단은 관리자 전용입니다</p>
          <p class="lock-desc">개인정보 보호를 위해 신청자 명단은 관리자에게만 비공개 처리됩니다.<br>자료 수령 희망자는 위의 양식으로 신청해주세요.</p>
        </div>
      `;
      return;
    }

    // 관리자 인증 상태일 때 : 인원 수 및 복사 버튼 표시, 명단 노출
    if (countBadge) countBadge.textContent = `${list.length}명`;
    if (copyBtn) copyBtn.style.display = "inline-flex";

    if (list.length === 0) {
      listContainer.innerHTML = `
        <div class="request-empty-state">
          <i class="fa-regular fa-clipboard"></i>
          <p>아직 일본어 자료를 신청한 학생이 없습니다.</p>
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

    // 신청 취소 버튼 이벤트 바인딩 (관리자 전용)
    const cancelBtns = listContainer.querySelectorAll(".btn-cancel-chip");
    cancelBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        if (!isArchiveAdmin()) {
          alert("관리자 권한이 필요합니다.");
          return;
        }

        const targetNum = Number(btn.getAttribute("data-num"));
        const targetItem = list.find(it => Number(it.num) === targetNum);
        const displayName = targetItem ? `${targetItem.num}번 ${targetItem.name}` : `${targetNum}번`;

        if (confirm(`${displayName} 학생의 일본어 자료 신청을 취소하시겠습니까?`)) {
          if (firebaseDb) {
            firebaseDb.ref("jp_requests/" + targetNum).remove()
              .then(() => {
                alert(`${displayName} 학생의 신청이 취소되었습니다.`);
              })
              .catch(err => {
                console.error("Firebase 신청 취소 실패:", err);
                alert("신청 취소 처리 중 오류가 발생했습니다.");
              });
          } else {
            jpRequestsList = jpRequestsList.filter(it => Number(it.num) !== targetNum);
            saveJpRequestsLocal(jpRequestsList);
            renderJpList();
          }
        }
      });
    });
  }

  // 관리자 인증 버튼 이벤트
  if (adminAuthBtn) {
    adminAuthBtn.addEventListener("click", handleArchiveAdminToggle);
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

    const existing = jpRequestsList.find(it => Number(it.num) === num);
    if (existing) {
      if (isArchiveAdmin()) {
        alert(`이미 ${num}번(${existing.name}) 학생이 신청을 완료했습니다.\n번호를 잘못 선택하셨거나 수정을 원하시면 기존 신청을 취소한 후 다시 시도해주세요.`);
      } else {
        alert(`이미 ${num}번 학생의 신청이 완료되었습니다.\n본인 번호가 맞지 않다면 번호를 다시 확인해주세요.`);
      }
      return;
    }

    const newEntry = {
      num: num,
      name: name,
      createdAt: formatSimpleDate(new Date())
    };

    if (submitBtn) submitBtn.disabled = true;

    if (firebaseDb) {
      firebaseDb.ref("jp_requests/" + num).set(newEntry)
        .then(() => {
          numSelect.value = "";
          nameInput.value = "";
          alert(`${num}번 ${name} 학생의 일본어 기말자료 신청이 완료되었습니다!`);
        })
        .catch(err => {
          console.error("Firebase 신청 저장 오류:", err);
          alert("신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
        });
    } else {
      jpRequestsList.push(newEntry);
      saveJpRequestsLocal(jpRequestsList);
      renderJpList();
      numSelect.value = "";
      nameInput.value = "";
      alert(`${num}번 ${name} 학생의 일본어 기말자료 신청이 완료되었습니다!`);
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // 명단 클립보드 복사 버튼 (관리자 전용)
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (!isArchiveAdmin()) {
        alert("관리자만 명단을 복사할 수 있습니다.");
        return;
      }

      const list = [...jpRequestsList];
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

  // 초기 렌더링 및 모듈 등록
  renderJpList();
  window._renderJpList = renderJpList;
}

/**
 * ========================================================
 * [박스 2] 자유 익명 자료 요청 로직
 * - 100% 익명 보장 피드 (이름 없이 자유 글 작성)
 * - 과목 선택 및 상세 요청 내용 입력
 * - 실시간 피드 렌더링, 공감(좋아요)
 * - 관리자 전용: 익명 요청 글 삭제 기능
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
  const submitBtn = document.getElementById("anonSubmitBtn");

  if (!form || !subjSelect || !contentInput || !feedContainer) return;

  const STORAGE_KEY_LIKED = "daeryun_anon_liked_ids";

  function getLikedIds() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LIKED);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function setLikedId(id, isLiked) {
    try {
      let ids = getLikedIds();
      if (isLiked) {
        if (!ids.includes(id)) ids.push(id);
      } else {
        ids = ids.filter(it => it !== id);
      }
      localStorage.setItem(STORAGE_KEY_LIKED, JSON.stringify(ids));
    } catch (e) {}
  }

  function getDefaultAnonSample() {
    return [
      {
        id: "anon-demo-1",
        subject: "일본어",
        content: "기말고사 시험범위 주요 단어랑 본문 필수 문형 정리 유인물도 혹시 올려주실 수 있나요?",
        createdAt: "10.13",
        timestamp: 1728800000000,
        likes: 3
      }
    ];
  }

  function loadAnonRequestsLocal() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ANON);
      if (data) return JSON.parse(data);
      return getDefaultAnonSample();
    } catch (e) {
      console.error("익명 요청 로컬 데이터 불러오기 오류:", e);
      return getDefaultAnonSample();
    }
  }

  function saveAnonRequestsLocal(list) {
    try {
      localStorage.setItem(STORAGE_KEY_ANON, JSON.stringify(list));
    } catch (e) {
      console.error("익명 요청 로컬 데이터 저장 오류:", e);
    }
  }

  let anonRequestsList = loadAnonRequestsLocal();

  // Firebase 실시간 동기화
  if (firebaseDb) {
    firebaseDb.ref("anon_requests").on("value", (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        anonRequestsList = list;
        saveAnonRequestsLocal(list);
      } else {
        anonRequestsList = getDefaultAnonSample();
        saveAnonRequestsLocal(anonRequestsList);
      }
      renderAnonFeed();
    }, (error) => {
      console.warn("Firebase anon_requests 수신 알림:", error);
    });
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
    const list = [...anonRequestsList];
    const isAdmin = isArchiveAdmin();
    const likedIds = getLikedIds();

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
        ${list.map(item => {
          const isLiked = likedIds.includes(item.id);
          return `
            <div class="anon-feed-item" data-id="${item.id}">
              <div class="anon-item-header">
                <div class="anon-meta-left">
                  <span class="anon-subj-pill subj-${getSubjectColorClass(item.subject)}">${escapeHtml(item.subject)}</span>
                  <span class="anon-author"><i class="fa-solid fa-user-secret"></i> 익명의 학우</span>
                </div>
                <div class="anon-meta-right">
                  <span class="anon-time">${item.createdAt || ""}</span>
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
                <button type="button" class="btn-anon-like ${isLiked ? 'active' : ''}" data-id="${item.id}">
                  <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
                  <span>나도 필요해요</span>
                  <strong class="like-count">${item.likes || 0}</strong>
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    // 공감(좋아요) 버튼 이벤트
    const likeBtns = feedContainer.querySelectorAll(".btn-anon-like");
    likeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const currentLikedIds = getLikedIds();
        const hasLiked = currentLikedIds.includes(id);

        if (hasLiked) {
          setLikedId(id, false);
          if (firebaseDb && !id.startsWith("anon-demo-")) {
            firebaseDb.ref("anon_requests/" + id + "/likes").transaction(cur => Math.max(0, (cur || 1) - 1));
          } else {
            const target = anonRequestsList.find(it => it.id === id);
            if (target) target.likes = Math.max(0, (target.likes || 1) - 1);
            saveAnonRequestsLocal(anonRequestsList);
            renderAnonFeed();
          }
        } else {
          setLikedId(id, true);
          if (firebaseDb && !id.startsWith("anon-demo-")) {
            firebaseDb.ref("anon_requests/" + id + "/likes").transaction(cur => (cur || 0) + 1);
          } else {
            const target = anonRequestsList.find(it => it.id === id);
            if (target) target.likes = (target.likes || 0) + 1;
            saveAnonRequestsLocal(anonRequestsList);
            renderAnonFeed();
          }
        }
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
            if (firebaseDb && !id.startsWith("anon-demo-")) {
              firebaseDb.ref("anon_requests/" + id).remove()
                .then(() => {
                  alert("요청 글이 삭제되었습니다.");
                })
                .catch(err => {
                  console.error("Firebase 글 삭제 오류:", err);
                  alert("삭제 처리 중 오류가 발생했습니다.");
                });
            } else {
              anonRequestsList = anonRequestsList.filter(it => it.id !== id);
              saveAnonRequestsLocal(anonRequestsList);
              renderAnonFeed();
            }
          }
        });
      });
    }
  }

  // 관리자 인증 토글 버튼 이벤트
  if (adminAuthBtn) {
    adminAuthBtn.addEventListener("click", handleArchiveAdminToggle);
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

    const newItem = {
      subject: subject,
      content: content,
      createdAt: formatSimpleDate(new Date()),
      timestamp: Date.now(),
      likes: 0
    };

    if (submitBtn) submitBtn.disabled = true;

    if (firebaseDb) {
      const newRef = firebaseDb.ref("anon_requests").push();
      newItem.id = newRef.key;
      newRef.set(newItem)
        .then(() => {
          contentInput.value = "";
          alert("익명 자료 요청이 성공적으로 등록되었습니다!");
        })
        .catch(err => {
          console.error("Firebase 익명요청 등록 실패:", err);
          alert("등록 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.");
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
        });
    } else {
      newItem.id = "anon_" + Date.now();
      anonRequestsList.unshift(newItem);
      saveAnonRequestsLocal(anonRequestsList);
      renderAnonFeed();
      contentInput.value = "";
      alert("익명 자료 요청이 성공적으로 등록되었습니다!");
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // 초기 렌더링 및 모듈 등록
  renderAnonFeed();
  window._renderAnonFeed = renderAnonFeed;

  // 전체 리프레시 콜백 연결
  refreshArchiveModules = () => {
    if (window._renderJpList) window._renderJpList();
    if (window._renderAnonFeed) window._renderAnonFeed();
  };
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

