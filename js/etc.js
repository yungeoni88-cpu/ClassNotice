/**
 * [etc.js] 기타 & 생활 카테고리 로직
 * - 우리반 요일별 시간표 렌더링 (월~금 + 전체 주간표)
 * - 현재 시간에 맞춰 N교시 박스 배경이 왼쪽에서 오른쪽으로 실시간 차오르는 기능
 * - 학급 건의함 / 분실물 제보 로컬스토리지 저장 및 렌더링
 */

// 1. 사용자 제공 우리반 요일별 시간표 데이터
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

// 과목별 분류 태그 매핑 (시각적 구분)
function getSubjectTag(subject) {
  if (["역학과 에너지", "물질과 에너지", "세포와 물질대사"].includes(subject)) return "과학";
  if (["미적분II", "확률과 통계"].includes(subject)) return "수학";
  if (["화법과 언어"].includes(subject)) return "국어";
  if (["영어II", "영어 발표와 토론"].includes(subject)) return "영어";
  if (["일본어"].includes(subject)) return "외국어";
  if (["스포츠 문화"].includes(subject)) return "체육";
  if (["진로", "동아리", "자율"].includes(subject)) return "창체";
  return "교과";
}

let currentSelectedDay = "월"; // 기본 선택 요일
let timetableTimer = null; // 실시간 프로그레스 타이머

// 기타 모듈 초기화
function initEtcModule() {
  initTimetableModule();
  initFeedbackSystem();
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
    // 초기 활성화 상태 반영
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
    titleEl.textContent = `${dayKey}요일 시간표 ${isToday ? '(오늘)' : ''}`;
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

    const tag = getSubjectTag(subject);

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
          <span class="subject-tag">${tag}</span>
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

  // 오늘 요일이 아니거나 전체 뷰일 때는 게이지 초기화
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
      // 다른 요일 보기 중일 때는 진행률 효과 미적용
      row.classList.remove("is-current", "is-past");
      if (fillEl) fillEl.style.width = "0%";
      if (liveContainer) liveContainer.innerHTML = "";
      return;
    }

    const startMin = timeStrToMinutes(startStr);
    const endMin = timeStrToMinutes(endStr);

    if (currentMin >= startMin && currentMin < endMin) {
      // 1) 현재 진행 중인 교시!
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

        // 접힌 미니 프리뷰 텍스트 업데이트
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
  const maxPeriods = 7;
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
    // 점심시간 행
    if (item.periodNum === "lunch") {
      tableHtml += `
        <tr style="background-color: #fffbeb;">
          <td class="period-col" style="color:#b45309; font-size:0.75rem;">12:20~13:20</td>
          <td colspan="5" style="color:#92400e; font-weight:700; padding: 0.5rem;">점심시간</td>
        </tr>
      `;
      return;
    }

    const p = item.periodNum;
    tableHtml += `
      <tr>
        <td class="period-col">
          <div>${p}교시</div>
          <div style="font-size:0.7rem; color:var(--text-light); font-weight:normal;">${item.start}~${item.end}</div>
        </td>
    `;

    days.forEach(d => {
      const list = weeklyTimetable[d] || [];
      const sub = list[p - 1] || "-";
      tableHtml += `<td class="${d === todayName ? 'today-col' : ''}">${sub}</td>`;
    });

    tableHtml += `</tr>`;
  });

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHtml;
}

// --------------------------------------------------------
// 건의함 및 분실물 게시판 로직
// --------------------------------------------------------
const defaultFeedbacks = [
  { text: "체육관 앞 벤치에서 파란색 필통 분실했어요. 발견하신 분 반장에게 전해주세요!", time: "10-10 16:30" },
  { text: "에어컨 온도가 너무 낮아요. 24도로 유지해 주시면 감사하겠습니다.", time: "10-09 11:20" }
];

function initFeedbackSystem() {
  const form = document.getElementById("suggestionForm");
  const input = document.getElementById("feedbackInput");
  const list = document.getElementById("feedbackList");

  // LocalStorage에서 피드백 불러오기
  const storageKey = "class_notice_feedbacks";
  let feedbacks = [];
  try {
    const saved = localStorage.getItem(storageKey);
    feedbacks = saved ? JSON.parse(saved) : defaultFeedbacks;
  } catch (e) {
    feedbacks = defaultFeedbacks;
  }

  const renderFeedbacks = () => {
    if (!list) return;
    if (feedbacks.length === 0) {
      list.innerHTML = `<p style="font-size:0.85rem; color:var(--text-light); text-align:center; padding:1rem;">등록된 메시지가 없습니다.</p>`;
      return;
    }
    list.innerHTML = feedbacks.map(item => `
      <div class="feedback-bubble">
        <span>${escapeHtml(item.text)}</span>
        <span class="feedback-time">${item.time}</span>
      </div>
    `).join("");
  };

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;

      const now = new Date();
      const timeStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      feedbacks.unshift({ text: val, time: timeStr });
      if (feedbacks.length > 20) feedbacks.pop(); // 최근 20개 유지

      try {
        localStorage.setItem(storageKey, JSON.stringify(feedbacks));
      } catch (err) {}

      input.value = "";
      renderFeedbacks();
      alert("의견이 등록되었습니다!");
    });
  }

  renderFeedbacks();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
