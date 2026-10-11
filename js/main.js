/**
 * [main.js] 메인 통합 컨트롤러
 * - 4개 카테고리 탭 네비게이션 전환 (SPA 방식 + URL 해시 지원)
 * - 상단 헤더 실시간 날짜 & 시계 업데이트
 * - 카테고리별 서브 모듈 일괄 초기화
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 헤더 실시간 시계 & 날짜 설정
  initHeaderClock();

  // 2. 카테고리별 기능 모듈 초기화
  if (typeof initNoticeModule === "function") initNoticeModule();
  if (typeof initScheduleModule === "function") initScheduleModule();
  if (typeof initMealModule === "function") initMealModule();
  if (typeof initEtcModule === "function") initEtcModule();

  // 3. 탭 네비게이션 이벤트 설정
  initTabNavigation();
});

/**
 * 상단 헤더 실시간 날짜 및 시계 업데이트
 */
function initHeaderClock() {
  const dateEl = document.getElementById("currentDateDisplay");
  const timeEl = document.getElementById("currentTimeDisplay");

  const days = ["일", "월", "화", "수", "목", "금", "토"];

  function updateClock() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayName = days[now.getDay()];

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    if (dateEl) {
      dateEl.textContent = `${year}년 ${month}월 ${date}일 (${dayName})`;
    }
    if (timeEl) {
      timeEl.textContent = `${hours}:${minutes}`;
    }
  }

  updateClock();
  setInterval(updateClock, 1000 * 60); // 1분마다 갱신
}

/**
 * 탭 네비게이션 전환
 */
function initTabNavigation() {
  const navTabs = document.querySelectorAll(".nav-tab");
  const sections = document.querySelectorAll(".content-section");

  function switchTab(tabName) {
    // 탭 버튼 활성화 상태 변경
    navTabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // 섹션 표시 상태 변경
    sections.forEach(section => {
      if (section.id === `${tabName}Section`) {
        section.classList.add("active");
      } else {
        section.classList.remove("active");
      }
    });

    // URL 해시 업데이트 (사용자가 링크 복사나 공유 시 해당 탭으로 바로 접근 가능)
    window.location.hash = tabName;
  }

  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });

  // URL 해시가 있는 경우 초기 탭 선택 (예: #meal, #schedule)
  const hash = window.location.hash.replace("#", "");
  const validTabs = ["notice", "schedule", "meal", "etc"];
  if (hash && validTabs.includes(hash)) {
    switchTab(hash);
  }
}
