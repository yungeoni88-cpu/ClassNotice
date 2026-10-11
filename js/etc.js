/**
 * [etc.js] 학급 자료실 (Archive) 카테고리 로직
 * - 자료실 / 자료신청 2대 서브 탭 전환 제어
 * - 사용자가 직접 자료 및 신청 내역을 기재할 수 있도록 내부 컨텐츠는 비워둠
 */

function initEtcModule() {
  setupArchiveSubtabs();
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
