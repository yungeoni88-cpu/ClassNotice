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

function initEtcModule() {
  setupArchiveSubtabs();
  renderArchiveMaterials();
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
