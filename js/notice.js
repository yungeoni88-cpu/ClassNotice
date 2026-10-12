/**
 * [notice.js] 공지사항 카테고리 로직
 * - 2학년 4반 오늘의 시간표 (1~7교시 및 점심시간 60분)
 * - 현재 시간에 맞춰 N교시 배경이 왼쪽에서 오른쪽으로 실시간 차오르는 게이지 기능
 * - 요일별 시간표 전환 및 아코디언 접기/펼치기
 * - 학급 급훈&약속 및 자주 찾는 링크
 */

// ==============================================================================
// 1. 대륜고 2학년 4반 요일별 정규 시간표 데이터
// ==============================================================================
const weeklyTimetable = {
  "월": [
    "역학과 에너지",
    "물질과 에너지",
    "스포츠 문화",
    "세포와 물질대사",
    "화법과 언어",
    "미적분II",
    "영어 발표와 토론"
  ],
  "화": [
    "영어II",
    "일본어",
    "확률과 통계",
    "영어 발표와 토론",
    "역학과 에너지",
    "화법과 언어",
    "미적분II"
  ],
  "수": [
    "진로",
    "영어II",
    "확률과 통계",
    "화법과 언어",
    "동아리",
    "자율"
  ],
  "목": [
    "세포와 물질대사",
    "역학과 에너지",
    "미적분II",
    "물질과 에너지",
    "확률과 통계",
    "영어II",
    "일본어"
  ],
  "금": [
    "일본어",
    "화법과 언어",
    "영어 발표와 토론",
    "영어II",
    "물질과 에너지",
    "확률과 통계",
    "세포와 물질대사"
  ]
};

// 2. 정확한 교시별 시간표 스케줄 (쉬는시간 10분, 점심시간 60분)
const periodSchedule = [
  { id: "p1", periodNum: 1, label: "1교시", start: "08:30", end: "09:20" },
  { id: "p2", periodNum: 2, label: "2교시", start: "09:30", end: "10:20" },
  { id: "p3", periodNum: 3, label: "3교시", start: "10:30", end: "11:20" },
  { id: "p4", periodNum: 4, label: "4교시", start: "11:30", end: "12:20" },
  { id: "lunch", periodNum: "lunch", label: "점심시간", start: "12:20", end: "13:20" },
  { id: "p5", periodNum: 5, label: "5교시", start: "13:20", end: "14:10" },
  { id: "p6", periodNum: 6, label: "6교시", start: "14:20", end: "15:10" },
  { id: "p7", periodNum: 7, label: "7교시", start: "15:20", end: "16:10" },
];


let currentSelectedDay = "월"; // 기본 선택 요일
let timetableTimer = null; // 실시간 프로그레스 타이머

// 공지사항 모듈 초기화
function initNoticeModule() {
  initTimetableModule();
}

/**
 * 시간표 모듈 초기화
 */
function initTimetableModule() {
  // 오늘 요일 감지 (월~금이 아니면 월요일로 기본 설정)
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const todayDayName = days[new Date().getDay()];

  if (weeklyTimetable[todayDayName]) {
    currentSelectedDay = todayDayName;
  } else {
    currentSelectedDay = "월";
  }

  setupTimetableDayButtons();
  setupTimetableCollapseToggle();
  renderTimetable(currentSelectedDay);

  // 1초마다 실시간 시간표 배경 프로그레스 갱신
  if (timetableTimer) clearInterval(timetableTimer);
  timetableTimer = setInterval(updateTimetableLiveProgress, 1000);
}

/**
 * 시간표 카드 접기/펼치기 토글 이벤트 설정
 */
function setupTimetableCollapseToggle() {
  const toggleBtn = document.getElementById("toggleTimetableBtn");
  const miniPreview = document.getElementById("timetableMiniPreview");
  const bodyEl = document.getElementById("timetableCollapsibleBody");
  if (!toggleBtn || !bodyEl) return;

  const toggleCard = () => {
    const isCollapsed = bodyEl.classList.toggle("is-collapsed");
    toggleBtn.classList.toggle("is-collapsed", isCollapsed);

    const btnText = toggleBtn.querySelector(".btn-text");
    if (btnText) btnText.textContent = isCollapsed ? "펼치기" : "접기";

    if (miniPreview) {
      miniPreview.style.display = isCollapsed ? "flex" : "none";
    }
  };

  toggleBtn.addEventListener("click", toggleCard);
  if (miniPreview) miniPreview.addEventListener("click", toggleCard);
}

/**
 * 요일 선택 버튼 이벤트
 */
function setupTimetableDayButtons() {
  const buttons = document.querySelectorAll("#timetableDaySelector .day-chip-btn");

  buttons.forEach(btn => {
    if (btn.dataset.day === currentSelectedDay) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }

    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      currentSelectedDay = btn.dataset.day;
      renderTimetable(currentSelectedDay);
    });
  });
}

/**
 * 시간 문자열(HH:MM)을 분 단위 실수로 변환
 */
function timeStrToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * 현재 시간을 분 단위 실수(초 포함)로 계산
 */
function getCurrentTimeMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

/**
 * 시간표 렌더링 (단일 요일 카드 리스트 or 전체 주간 테이블)
 */
function renderTimetable(dayKey) {
  const container = document.getElementById("timetableList");
  const titleEl = document.getElementById("timetableTitleText");
  if (!container) return;

  // 1) 전체 주간 테이블 뷰인 경우
  if (dayKey === "all") {
    if (titleEl) titleEl.textContent = "주간 전체 시간표 (월~금)";
    renderWeeklyTableView(container);
    return;
  }

  // 2) 특정 요일 뷰인 경우
  const todayName = ["일", "월", "화", "수", "목", "금", "토"][new Date().getDay()];
  const isToday = todayName === dayKey;
  if (titleEl) {
    titleEl.textContent = isToday ? `오늘의 시간표 (${dayKey})` : `${dayKey}요일 시간표`;
  }

  const subjects = weeklyTimetable[dayKey] || [];
  if (subjects.length === 0) {
    container.innerHTML = `<p class="empty-state">시간표 정보가 없습니다.</p>`;
    return;
  }

  let html = "";
  let subjectIdx = 0;

  periodSchedule.forEach((item) => {
    // 점심시간 행
    if (item.periodNum === "lunch") {
      html += `
        <div class="period-row lunch-row" data-period-id="lunch" data-start="${item.start}" data-end="${item.end}">
          <div class="period-progress-fill" style="width: 0%;"></div>
          <div class="period-left-group">
            <div class="period-col-info">
              <span class="period-num"><i class="fa-solid fa-utensils"></i></span>
              <span class="period-time-range">${item.start}~${item.end}</span>
            </div>
            <span class="subject-name">점심시간</span>
          </div>
          <div class="period-right-group">
            <span class="live-status-container"></span>
            <span class="subject-tag" style="background:#fef3c7; color:#92400e;">60분</span>
          </div>
        </div>
      `;
      return;
    }

    // 과목 행 (수요일은 6교시까지만 있으므로 7교시는 제외)
    const subject = subjects[subjectIdx];
    subjectIdx++;

    if (!subject) return;

    html += `
      <div class="period-row" data-period-id="p${item.periodNum}" data-start="${item.start}" data-end="${item.end}">
        <div class="period-progress-fill" style="width: 0%;"></div>
        <div class="period-left-group">
          <div class="period-col-info">
            <span class="period-num">${item.label}</span>
            <span class="period-time-range">${item.start}~${item.end}</span>
          </div>
          <span class="subject-name">${subject}</span>
        </div>
        <div class="period-right-group">
          <span class="live-status-container"></span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // 렌더링 즉시 실시간 프로그레스 적용
  updateTimetableLiveProgress();
}

/**
 * 실시간 N교시 박스 배경 프로그레스(차오름) 갱신 함수
 */
function updateTimetableLiveProgress() {
  const container = document.getElementById("timetableList");
  if (!container) return;

  const todayName = ["일", "월", "화", "수", "목", "금", "토"][new Date().getDay()];
  const isViewingToday = currentSelectedDay === todayName;

  const rows = container.querySelectorAll(".period-row[data-start]");
  if (!rows || rows.length === 0) return;

  const currentMin = getCurrentTimeMinutes();

  rows.forEach(row => {
    const startStr = row.dataset.start;
    const endStr = row.dataset.end;
    const fillEl = row.querySelector(".period-progress-fill");
    const liveContainer = row.querySelector(".live-status-container");

    if (!isViewingToday) {
      row.classList.remove("is-current", "is-past");
      if (fillEl) fillEl.style.width = "0%";
      if (liveContainer) liveContainer.innerHTML = "";
      return;
    }

    const startMin = timeStrToMinutes(startStr);
    const endMin = timeStrToMinutes(endStr);

    if (currentMin >= startMin && currentMin < endMin) {
      // 1) 현재 진행 중인 교시
      const progress = ((currentMin - startMin) / (endMin - startMin)) * 100;
      const remainMin = Math.ceil(endMin - currentMin);

      row.classList.add("is-current");
      row.classList.remove("is-past");
      if (fillEl) fillEl.style.width = `${progress.toFixed(2)}%`;

      if (liveContainer) {
        const isLunch = row.dataset.periodId === "lunch";
        liveContainer.innerHTML = `
          <span class="live-status-pill">
            <span class="live-dot"></span> ${isLunch ? '점심시간' : '수업 중'} (${remainMin}분 남음)
          </span>
        `;

        const previewTextEl = document.getElementById("timetablePreviewText");
        const subjectName = row.querySelector(".subject-name")?.textContent || "";
        if (previewTextEl) {
          previewTextEl.textContent = isLunch 
            ? `현재 점심시간 진행 중 (${remainMin}분 남음)`
            : `현재 수업 진행 중: ${subjectName} (${remainMin}분 남음)`;
        }
      }
    } else if (currentMin >= endMin) {
      // 2) 이미 지난 교시
      row.classList.remove("is-current");
      row.classList.add("is-past");
      if (fillEl) fillEl.style.width = "100%";
      if (liveContainer) liveContainer.innerHTML = "";
    } else {
      // 3) 아직 시작 전인 교시
      row.classList.remove("is-current", "is-past");
      if (fillEl) fillEl.style.width = "0%";
      if (liveContainer) liveContainer.innerHTML = "";
    }
  });
}

/**
 * 주간 전체 시간표 테이블 렌더링
 */
function renderWeeklyTableView(container) {
  const days = ["월", "화", "수", "목", "금"];
  const todayName = ["일", "월", "화", "수", "목", "금", "토"][new Date().getDay()];

  let tableHtml = `
    <div class="weekly-table-wrap">
      <table class="weekly-table">
        <thead>
          <tr>
            <th>교시 / 시간</th>
            ${days.map(d => `<th class="${d === todayName ? 'today-col' : ''}">${d}${d === todayName ? ' (오늘)' : ''}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
  `;

  periodSchedule.forEach(item => {
    if (item.periodNum === "lunch") {
      tableHtml += `
        <tr style="background-color: #fffbeb;">
          <td style="font-weight:700; color:#b45309;"><i class="fa-solid fa-utensils"></i> 점심시간<br><span style="font-size:0.75rem; font-weight:normal;">${item.start}~${item.end}</span></td>
          <td colspan="5" style="text-align:center; font-weight:700; color:#b45309; letter-spacing:0.05em;">
            🍱 점심시간 (60분)
          </td>
        </tr>
      `;
      return;
    }

    const pIdx = item.periodNum - 1;
    tableHtml += `
      <tr>
        <td><strong>${item.label}</strong><br><span style="font-size:0.75rem; color:var(--text-light);">${item.start}~${item.end}</span></td>
        ${days.map(d => {
          const subj = (weeklyTimetable[d] && weeklyTimetable[d][pIdx]) ? weeklyTimetable[d][pIdx] : "-";
          const isTodayCol = d === todayName;
          return `
            <td class="${isTodayCol ? 'today-col-cell' : ''}">
              ${subj !== "-" ? `<span class="weekly-subj">${subj}</span>` : `<span style="color:#cbd5e1;">-</span>`}
            </td>
          `;
        }).join("")}
      </tr>
    `;
  });

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHtml;
}
