/**
 * [schedule.js] 학급일정 카테고리 로직
 * - D-Day 자동 계산 및 렌더링
 * - 미니 캘린더 생성 및 월 이동
 * - 주요 일정 타임라인 리스트
 */

// 학급 주요 D-Day 데이터 목록
const ddayList = [
  { title: "2학기 중간고사", targetDate: "2026-10-22", urgent: true },
  { title: "가을 현장체험학습", targetDate: "2026-10-16", urgent: false },
  { title: "수학 수행평가 마감", targetDate: "2026-10-14", urgent: true },
  { title: "겨울방학식", targetDate: "2026-12-28", urgent: false },
];

// 일정 캘린더 이벤트 데이터
const calendarEvents = [
  { date: "2026-10-12", title: "주간 학급회의 (7교시)", important: false },
  { date: "2026-10-14", title: "수학 수행평가 제출 마감", important: true },
  { date: "2026-10-16", title: "현장체험학습 (에버랜드)", important: true },
  { date: "2026-10-20", title: "교내 독서골든벨 신청 마감", important: false },
  { date: "2026-10-22", title: "2학기 중간고사 1일차", important: true },
  { date: "2026-10-23", title: "2학기 중간고사 2일차", important: true },
];

let calendarDate = new Date(); // 현재 캘린더 기준 날짜

// 학급일정 모듈 초기화
function initScheduleModule() {
  renderDdayCards();
  renderCalendar();
  renderTimeline();
  setupCalendarEvents();
}

// D-Day 계산 함수
function calculateDday(targetDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "D-DAY";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

// D-Day 카드 그리드 렌더링
function renderDdayCards() {
  const container = document.getElementById("ddayCardGrid");
  if (!container) return;

  container.innerHTML = ddayList.map(item => {
    const ddayText = calculateDday(item.targetDate);
    return `
      <div class="dday-card ${item.urgent ? 'urgent' : ''}">
        <div class="dday-info">
          <h4>${item.title}</h4>
          <p><i class="fa-regular fa-calendar"></i> ${item.targetDate}</p>
        </div>
        <div class="dday-number">${ddayText}</div>
      </div>
    `;
  }).join("");
}

// 미니 캘린더 렌더링
function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth(); // 0-based

  // 캘린더 제목 업데이트
  const titleEl = document.getElementById("calendarMonthTitle");
  if (titleEl) {
    titleEl.textContent = `${year}. ${String(month + 1).padStart(2, "0")}`;
  }

  const daysGrid = document.getElementById("calendarDaysGrid");
  if (!daysGrid) return;
  daysGrid.innerHTML = "";

  // 이번 달 1일과 마지막 날 정보
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0(일)~6(토)
  const lastDay = new Date(year, month + 1, 0).getDate();
  const prevLastDay = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // 이전 달 날짜 채우기
  for (let i = firstDayIndex; i > 0; i--) {
    const dayNum = prevLastDay - i + 1;
    daysGrid.innerHTML += `<div class="cal-day-cell other-month">${dayNum}</div>`;
  }

  // 이번 달 날짜 채우기
  for (let i = 1; i <= lastDay; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const isToday = isCurrentMonth && today.getDate() === i;
    const hasEvent = calendarEvents.some(ev => ev.date === dateStr);

    const cell = document.createElement("div");
    cell.className = `cal-day-cell ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`;
    cell.textContent = i;
    cell.title = hasEvent ? calendarEvents.filter(ev => ev.date === dateStr).map(e => e.title).join(", ") : "";

    cell.addEventListener("click", () => {
      const dayEvents = calendarEvents.filter(ev => ev.date === dateStr);
      if (dayEvents.length > 0) {
        alert(`[${dateStr} 일정]\n• ` + dayEvents.map(e => e.title).join("\n• "));
      } else {
        alert(`${dateStr}에는 등록된 일정이 없습니다.`);
      }
    });

    daysGrid.appendChild(cell);
  }
}

// 캘린더 버튼 이벤트 등록
function setupCalendarEvents() {
  const prevBtn = document.getElementById("prevMonthBtn");
  const nextBtn = document.getElementById("nextMonthBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      renderCalendar();
    });
  }
}

// 다가오는 일정 타임라인 렌더링
function renderTimeline() {
  const listEl = document.getElementById("scheduleTimeline");
  if (!listEl) return;

  listEl.innerHTML = calendarEvents.map(item => `
    <li class="timeline-item ${item.important ? 'important' : ''}">
      <span class="timeline-date-badge">${item.date.slice(5)}</span>
      <div class="timeline-content">
        <h4>${item.title}</h4>
        <p>${item.important ? '🚨 중요 학급 일정' : '일반 학급 일정'}</p>
      </div>
    </li>
  `).join("");
}
