/**
 * [schedule.js] 학급일정 카테고리 로직
 * - 2학년 4반 해당 월(10월) 학사일정 관리
 * - 일정 제목에 따른 자동 카테고리 분류 ('모의고사', '수행평가', '학사일정')
 * - 캘린더 날짜 클릭 시 우측 박스에 해당 일자의 상세 수행/시험 정보 카드 렌더링
 * - D-Day 카드 및 카테고리별 색상 닷 인디케이터
 */

// ==============================================================================
// 📅 [2학년 4반 학사일정 목록] - 사용자가 요청한 일정 데이터 ('수행평가' -> '수행')
// ==============================================================================
const calendarEvents = [
  { date: "2026-10-12", title: "영어II 수행 1&2차시" },
  { date: "2026-10-13", title: "영어II 수행 3차시" },
  { date: "2026-10-14", title: "영어II 수행 4차시" },
  { date: "2026-10-15", title: "세포와 물질대사 수행 1차시" },
  { date: "2026-10-16", title: "세포와 물질대사 수행 2차시" },
  { date: "2026-10-19", title: "영어 발표와 토론 수행 1,2차시" },
  { date: "2026-10-20", title: "10월 모의고사" },
  { date: "2026-10-21", title: "영어II 수행 (미발표자)" },
  { date: "2026-10-22", title: "미적분II 수행" },
  { date: "2026-10-22", title: "확률과 통계 수행" },
  { date: "2026-10-23", title: "일본어 수행" },
  { date: "2026-10-23", title: "영어 발표와 토론 수행 3차시" },
  { date: "2026-10-23", title: "화법과 언어 수행 1차시" },
  { date: "2026-10-26", title: "영어 발표와 토론 수행 4차시" },
  { date: "2026-10-28", title: "현장체험학습" },
  { date: "2026-10-30", title: "화법과 언어 수행 2차시" }
];

// 📋 [11월 예정 수행평가 대기 목록] - 11월 학사일정 업데이트 시 자동 반영
const pendingNovemberEvents = [
  { date: "2026-11-06", title: "화법과 언어 수행 3차시" },
  { date: "2026-11-13", title: "화법과 언어 수행 4차시" }
];

// 상단 D-Day 주요 요약 카드 목록
const ddayList = [
  { title: "영어II 수행 (1&2차시)", targetDate: "2026-10-12" },
  { title: "세포와 물질대사 수행 1차시", targetDate: "2026-10-15" },
  { title: "10월 모의고사", targetDate: "2026-10-20" },
  { title: "현장체험학습", targetDate: "2026-10-28" }
];

// 고정된 현재 해당 월 기준 (2026년 10월)
const fixedYear = 2026;
const fixedMonth = 9; // 0-based: 9는 10월

/**
 * ⏰ 당일 일정 및 과거 일정이 만료되었는지 판별하는 함수
 * - 과거 날짜: 만료 (true)
 * - 오늘 날짜: 16시 10분(종례 시간) 이후면 만료 (true), 16시 10분 이전이면 진행중 (false)
 * - 미래 날짜: 미만료 (false)
 */
function isEventExpired(dateStr) {
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const target = new Date(dateStr);
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  // 1) 오늘 이전 날짜는 이미 지난 일정이므로 만료
  if (targetDate.getTime() < todayDate.getTime()) {
    return true;
  }

  // 2) 오늘 날짜인 경우: 16시 10분(종례 시간) 이후면 만료!
  if (targetDate.getTime() === todayDate.getTime()) {
    const curHour = now.getHours();
    const curMin = now.getMinutes();
    if (curHour > 16 || (curHour === 16 && curMin >= 10)) {
      return true;
    }
  }

  return false;
}

/**
 * 현재 시각(종례 16:10 여부)을 고려하여 캘린더 초기 선택 날짜 결정
 * - 16:10 종례 이전: 오늘 날짜
 * - 16:10 종례 이후: 내일 날짜 (종례 후 접속 시 내일 일정부터 즉시 확인)
 */
function getInitialSelectedDate() {
  const now = new Date();
  const curHour = now.getHours();
  const curMin = now.getMinutes();
  const isAfterDismissal = curHour > 16 || (curHour === 16 && curMin >= 10);

  const target = new Date(now);
  if (isAfterDismissal) {
    target.setDate(target.getDate() + 1);
  }

  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  const targetDateStr = `${y}-${m}-${d}`;

  // 만약 10월(해당 학사일정 월) 범위 내에 있다면 그 날짜 반환
  if (target.getFullYear() === fixedYear && target.getMonth() === fixedMonth) {
    return targetDateStr;
  }

  // 그 외의 경우 기본값: 만료되지 않은 첫 번째 일정 날짜 또는 10월 12일
  const sorted = [...calendarEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstUpcoming = sorted.find(e => !isEventExpired(e.date));
  return firstUpcoming ? firstUpcoming.date : "2026-10-12";
}

// 초기 선택 날짜 (16:10 이후 내일 날짜 자동 선택)
let selectedCalendarDate = getInitialSelectedDate();

/**
 * 🏷️ 제목 기반 자동 카테고리 분류 함수
 * - '모의고사' 포함 시 -> [모의고사]
 * - '수행' 포함 시 -> [수행]
 * - 그 외 -> [학사일정]
 */
function getEventCategory(title) {
  const safeTitle = typeof title === 'string' ? title : '';

  if (safeTitle.includes("모의고사")) {
    return {
      key: "mock-exam",
      name: "모의고사",
      icon: "fa-solid fa-file-pen",
      badgeClass: "badge-mock-exam",
      itemClass: "cat-mock-exam",
      dotClass: "dot-mock-exam",
      themeColor: "#dc2626"
    };
  }

  if (safeTitle.includes("수행")) {
    return {
      key: "performance",
      name: "수행",
      icon: "fa-solid fa-clipboard-check",
      badgeClass: "badge-performance",
      itemClass: "cat-performance",
      dotClass: "dot-performance",
      themeColor: "#2563eb"
    };
  }

  return {
    key: "school-event",
    name: "학사일정",
    icon: "fa-regular fa-calendar-days",
    badgeClass: "badge-school-event",
    itemClass: "cat-school-event",
    dotClass: "dot-school-event",
    themeColor: "#64748b"
  };
}

// 상단 D-Day 페이지네이션 상태
let currentDdayPage = 0;
const DDAY_PAGE_SIZE = 3;
let isDdayNavBound = false;

// 학급일정 모듈 초기화
function initScheduleModule() {
  renderDdayCards();
  bindDdayNavEvents();
  renderFixedMonthCalendar();
  renderSelectedDateDetails(selectedCalendarDate);
}

/**
 * D-Day 계산 함수
 * - 16:10 종례 이후 당일 일정은 '만료'로 표시
 * - 지난 일정은 '만료'로 표시
 * - 당일 16:10 이전은 'D-DAY'
 * - 미래 일정은 'D-N'
 */
function calculateDday(targetDateStr) {
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const target = new Date(targetDateStr);
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffTime = targetDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // 당일(오늘)인 경우
  if (diffDays === 0) {
    if (isEventExpired(targetDateStr)) {
      return "만료";
    }
    return "D-DAY";
  }

  // 미래 일정
  if (diffDays > 0) {
    return `D-${diffDays}`;
  }

  // 과거 일정
  return "만료";
}

/**
 * 날짜순으로 정렬된 전체 학사일정 반환
 */
function getSortedCalendarEvents() {
  return [...calendarEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * 상단 D-Day 카드용 일정 목록 반환
 * - 16:10 종례 이후에는 당일 만료 일정을 제외하고 내일 일정부터 즉시 노출
 */
function getDdayDisplayEvents() {
  const allEvents = getSortedCalendarEvents();
  const upcomingEvents = allEvents.filter(item => !isEventExpired(item.date));

  // 앞으로 남은 일정이 있다면 내일(또는 다음 다가오는 날) 일정부터 표시
  if (upcomingEvents.length > 0) {
    return upcomingEvents;
  }

  // 모든 일정이 만료되었을 경우 전체 일정 표시
  return allEvents;
}

/**
 * D-Day 카드 그리드 렌더링 (가장 가까운 3개씩 표시)
 */
function renderDdayCards() {
  const container = document.getElementById("ddayCardGrid");
  const prevBtn = document.getElementById("ddayPrevBtn");
  const nextBtn = document.getElementById("ddayNextBtn");
  if (!container) return;

  const displayEvents = getDdayDisplayEvents();
  const totalPages = Math.ceil(displayEvents.length / DDAY_PAGE_SIZE) || 1;

  // 인덱스 범위 보정
  if (currentDdayPage >= totalPages) currentDdayPage = totalPages - 1;
  if (currentDdayPage < 0) currentDdayPage = 0;

  const startIdx = currentDdayPage * DDAY_PAGE_SIZE;
  const pageEvents = displayEvents.slice(startIdx, startIdx + DDAY_PAGE_SIZE);

  // 1페이지에서는 '<' 버튼 숨김, 2페이지부터 노출
  if (prevBtn) {
    prevBtn.style.display = currentDdayPage > 0 ? "flex" : "none";
  }

  // 마지막 페이지에서는 '>' 버튼 숨김, 뒤에 일정이 더 있으면 노출
  if (nextBtn) {
    nextBtn.style.display = currentDdayPage < totalPages - 1 ? "flex" : "none";
  }

  container.innerHTML = pageEvents.map(item => {
    const ddayText = calculateDday(item.date);
    const cat = getEventCategory(item.title);
    const isExpired = ddayText === "만료";
    return `
      <div class="dday-card ${cat.itemClass} ${isExpired ? 'is-expired' : ''}">
        <div class="dday-info">
          <div class="dday-cat-row">
            <span class="sched-cat-tag ${cat.badgeClass}">
              <i class="${cat.icon}"></i> ${cat.name}
            </span>
          </div>
          <h4>${item.title}</h4>
          <p><i class="fa-regular fa-calendar"></i> ${item.date}</p>
        </div>
        <div class="dday-number ${isExpired ? 'is-expired' : ''}">${ddayText}</div>
      </div>
    `;
  }).join("");
}

/**
 * D-Day 네비게이션 버튼 이벤트 바인딩
 */
function bindDdayNavEvents() {
  if (isDdayNavBound) return;

  const prevBtn = document.getElementById("ddayPrevBtn");
  const nextBtn = document.getElementById("ddayNextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentDdayPage > 0) {
        currentDdayPage--;
        renderDdayCards();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const displayEvents = getDdayDisplayEvents();
      const totalPages = Math.ceil(displayEvents.length / DDAY_PAGE_SIZE) || 1;
      if (currentDdayPage < totalPages - 1) {
        currentDdayPage++;
        renderDdayCards();
      }
    });
  }

  isDdayNavBound = true;
}

/**
 * 달력 넘김 없이 해당 월(10월)만 고정 렌더링
 * - 날짜 클릭 시 우측 정보 박스 갱신 및 선택 셀 하이라이트
 */
function renderFixedMonthCalendar() {
  const year = fixedYear;
  const month = fixedMonth; // 10월 (index 9)

  const titleEl = document.getElementById("calendarMonthTitle");
  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-regular fa-calendar"></i> ${year}년 ${month + 1}월 학사일정`;
  }

  const daysGrid = document.getElementById("calendarDaysGrid");
  if (!daysGrid) return;
  daysGrid.innerHTML = "";

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0(일)~6(토)
  const lastDay = new Date(year, month + 1, 0).getDate();
  const prevLastDay = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // 이전 달 빈칸 채우기
  for (let i = firstDayIndex; i > 0; i--) {
    const dayNum = prevLastDay - i + 1;
    daysGrid.innerHTML += `<div class="cal-day-cell other-month">${dayNum}</div>`;
  }

  // 이번 달(10월) 날짜 채우기
  for (let i = 1; i <= lastDay; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const isToday = isCurrentMonth && today.getDate() === i;
    const isSelected = selectedCalendarDate === dateStr;
    const eventsOnDay = calendarEvents.filter(ev => ev.date === dateStr);
    const hasEvent = eventsOnDay.length > 0;

    const cell = document.createElement("div");
    cell.className = `cal-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}`;
    cell.setAttribute("data-date", dateStr);
    
    // 날짜 숫자
    const dayNumSpan = document.createElement("span");
    dayNumSpan.className = "cal-day-number";
    dayNumSpan.textContent = i;
    cell.appendChild(dayNumSpan);

    if (hasEvent) {
      // 카테고리별 이벤트 점(dot)
      const dotsContainer = document.createElement("div");
      dotsContainer.className = "cal-event-dots";

      const categoriesOnDay = [...new Set(eventsOnDay.map(e => getEventCategory(e.title).key))];
      categoriesOnDay.forEach(catKey => {
        const sampleEvent = eventsOnDay.find(e => getEventCategory(e.title).key === catKey);
        const catInfo = getEventCategory(sampleEvent.title);
        const dot = document.createElement("span");
        dot.className = `cal-cat-dot ${catInfo.dotClass}`;
        dot.title = catInfo.name;
        dotsContainer.appendChild(dot);
      });

      cell.appendChild(dotsContainer);

      const tooltipTexts = eventsOnDay.map(e => `[${getEventCategory(e.title).name}] ${e.title}`).join(", ");
      cell.title = tooltipTexts;
    }

    // 날짜 클릭 이벤트: 우측 박스에 즉시 렌더링
    cell.addEventListener("click", () => {
      // 모든 셀에서 selected 제거 후 현재 셀에 추가
      const allCells = daysGrid.querySelectorAll(".cal-day-cell");
      allCells.forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");

      selectedCalendarDate = dateStr;
      renderSelectedDateDetails(dateStr);
    });

    daysGrid.appendChild(cell);
  }
}

/**
 * 캘린더 우측 박스에 선택한 날짜의 상세 수행/일정 정보 카드 렌더링
 */
function renderSelectedDateDetails(dateStr) {
  const titleEl = document.getElementById("detailDateText");
  const ddayEl = document.getElementById("detailDdayBadge");
  const captionEl = document.getElementById("detailCaptionText");
  const container = document.getElementById("detailEventsContainer");

  if (!container) return;

  const dateObj = new Date(dateStr);
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const dayName = daysOfWeek[dateObj.getDay()];

  const formattedDateTitle = `${month}월 ${day}일 (${dayName})`;
  const ddayText = calculateDday(dateStr);

  if (titleEl) titleEl.textContent = formattedDateTitle;
  if (ddayEl) {
    ddayEl.textContent = ddayText;
    ddayEl.className = `detail-dday-badge ${ddayText === 'D-DAY' ? 'is-today' : ''} ${ddayText === '만료' ? 'is-expired' : ''}`;
  }

  // 해당 일자 일정 필터링
  const eventsOnDay = calendarEvents.filter(ev => ev.date === dateStr);

  if (eventsOnDay.length === 0) {
    if (captionEl) captionEl.textContent = "해당 날짜에는 등록된 시험 및 수행 일정이 없습니다.";
    container.innerHTML = `
      <div class="selected-detail-empty">
        <div class="empty-icon-wrap">
          <i class="fa-regular fa-calendar-check"></i>
        </div>
        <h4>예정된 평가 일정이 없습니다</h4>
        <p>${month}월 ${day}일에는 모의고사 및 수행 일정이 없습니다.<br>정규 수업에 집중하고 편안한 하루를 보내세요! 🌿</p>
      </div>
    `;
    return;
  }

  if (captionEl) captionEl.textContent = `총 ${eventsOnDay.length}건의 학사 및 수행 일정이 있습니다.`;

  container.innerHTML = eventsOnDay.map(item => {
    const cat = getEventCategory(item.title);
    return `
      <div class="selected-detail-card ${cat.itemClass}">
        <div class="detail-card-header">
          <div class="detail-badge-group">
            <span class="sched-cat-tag ${cat.badgeClass}">
              <i class="${cat.icon}"></i> ${cat.name}
            </span>
          </div>
          <span class="detail-item-dday ${ddayText === '만료' ? 'is-expired' : ''}">${ddayText}</span>
        </div>
        <h4 class="detail-card-title">${item.title}</h4>
        <div class="detail-card-info">
          <span class="info-row"><i class="fa-regular fa-calendar"></i> 날짜: ${item.date} (${dayName})</span>
          <span class="info-row"><i class="fa-solid fa-bookmark"></i> 분류: <strong>${cat.name}</strong></span>
        </div>
      </div>
    `;
  }).join("");
}
