/**
 * [meal.js] 나이스(NEIS) 교육정보개방포털 급식식단정보 연동 및 렌더링 모듈
 */

// ==============================================================================
// 🔑 [나이스(NEIS) 오픈 API 설정] - 여기에 인증키를 직접 입력하세요!
// ==============================================================================
const NEIS_CONFIG = {
  // 1. 발급받으신 인증키를 아래 따옴표 안에 넣어주세요!
  //    (인증키가 비어있거나 "YOUR_KEY_HERE"이면 샘플 식단으로 안전하게 자동 동작합니다)
  KEY: "069a5fdb68a14c87930bebba768e0a0b",  

  // 2. 신청 인자 (기본값: 대구 대륜고등학교 중식)
  ATPT_OFCDC_SC_CODE: "D10",      // 시도교육청코드 (대구: D10, 서울: B10, 경기: J10 등)
  SD_SCHUL_CODE: "7240085",       // 학교 행정표준코드 (대륜고등학교: 7240085)
  MMEAL_SC_CODE: "2",             // 식사코드 (1: 조식, 2: 중식, 3: 석식)

  // 3. 기본 인자
  Type: "json",                   // 호출 문서 형식 (json 고정)
  pIndex: 1,                      // 페이지 번호 (기본값 1)
  pSize: 100,                     // 한 번에 가져올 일수 (한 달치 약 20~25일 분량 충분히 수용)

  // 4. API 요청 엔드포인트 URL
  BASE_URL: "https://open.neis.go.kr/hub/mealServiceDietInfo"
};

// 1. 알레르기 번호 매핑 테이블 (식품의약품안전처/교육부 기준)
const ALLERGY_MAP = {
  "1": "난류",
  "2": "우유",
  "3": "메밀",
  "4": "땅콩",
  "5": "대두",
  "6": "밀",
  "7": "고등어",
  "8": "게",
  "9": "새우",
  "10": "돼지고기",
  "11": "복숭아",
  "12": "토마토",
  "13": "아황산염",
  "14": "호두",
  "15": "닭고기",
  "16": "쇠고기",
  "17": "오징어",
  "18": "조개류(굴/전복/홍합)",
  "19": "잣"
};

// 2. 사용자가 제공한 NEIS API 실제 샘플 JSON 데이터
const initialNeisSampleJson = {
  "mealServiceDietInfo": [
    {
      "head": [
        { "list_total_count": 851 },
        { "RESULT": { "CODE": "INFO-000", "MESSAGE": "정상 처리되었습니다." } }
      ]
    },
    {
      "row": [
        {
          "ATPT_OFCDC_SC_CODE": "D10",
          "ATPT_OFCDC_SC_NM": "대구광역시교육청",
          "SD_SCHUL_CODE": "7240085",
          "SCHUL_NM": "대륜고등학교",
          "MMEAL_SC_CODE": "2",
          "MMEAL_SC_NM": "중식",
          "MLSV_YMD": "20210302",
          "MLSV_FGR": 840.00,
          "DDISH_NM": "야채볶음밥(미니)1.2.5.6.10.13.15.16.18.<br/>그릴드직화치킨파스타1.2.5.6.9.10.12.13.15.16.18.<br/>크림스프2.5.6.13.16.<br/>시즈닝웨지감자2.5.6.13.<br/>오이피클13.<br/>플리또13.<br/>그린샐러드 1.5.12.13.",
          "ORPLC_INFO": "쌀 : 국내산<br/>김치류 : 국내산<br/>고춧가루(김치류) : 국내산<br/>쇠고기(종류) : 국내산(한우)<br/>돼지고기 : 국내산<br/>닭고기 : 국내산<br/>오리고기 : 국내산<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 가공품 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>콩 : 국내산",
          "CAL_INFO": "1024.6 Kcal",
          "NTR_INFO": "탄수화물(g) : 184.8<br/>단백질(g) : 44.1<br/>지방(g) : 19.7<br/>비타민A(R.E) : 441.6<br/>티아민(mg) : 1.0<br/>리보플라빈(mg) : 1.0<br/>비타민C(mg) : 183.4<br/>칼슘(mg) : 230.4<br/>철분(mg) : 5.7",
          "MLSV_FROM_YMD": "20210302",
          "MLSV_TO_YMD": "20210302",
          "LOAD_DTM": "20210309040011"
        },
        {
          "ATPT_OFCDC_SC_CODE": "D10",
          "ATPT_OFCDC_SC_NM": "대구광역시교육청",
          "SD_SCHUL_CODE": "7240085",
          "SCHUL_NM": "대륜고등학교",
          "MMEAL_SC_CODE": "2",
          "MMEAL_SC_NM": "중식",
          "MLSV_YMD": "20210303",
          "MLSV_FGR": 1186.00,
          "DDISH_NM": "제육불고기덮밥(feat.눈꽃치즈)13.2.5.6.10.<br/>맑은콩나물국5.6.9.13.<br/>봄동무생채13.<br/>탱글뽀득핫도그1.2.5.6.10.12.13.16.<br/>배추김치9.13.<br/>허쉬초콜렛드링크2.",
          "ORPLC_INFO": "쌀 : 국내산<br/>김치류 : 국내산<br/>고춧가루(김치류) : 국내산<br/>쇠고기(종류) : 국내산(한우)<br/>돼지고기 : 국내산<br/>닭고기 : 국내산<br/>오리고기 : 국내산<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 가공품 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>콩 : 국내산",
          "CAL_INFO": "986.3 Kcal",
          "NTR_INFO": "탄수화물(g) : 139.7<br/>단백질(g) : 52.6<br/>지방(g) : 24.7<br/>비타민A(R.E) : 529.1<br/>티아민(mg) : 1.0<br/>리보플라빈(mg) : 1.0<br/>비타민C(mg) : 18.6<br/>칼슘(mg) : 711.7<br/>철분(mg) : 5.9",
          "MLSV_FROM_YMD": "20210303",
          "MLSV_TO_YMD": "20210303",
          "LOAD_DTM": "20210310040011"
        },
        {
          "ATPT_OFCDC_SC_CODE": "D10",
          "ATPT_OFCDC_SC_NM": "대구광역시교육청",
          "SD_SCHUL_CODE": "7240085",
          "SCHUL_NM": "대륜고등학교",
          "MMEAL_SC_CODE": "2",
          "MMEAL_SC_NM": "중식",
          "MLSV_YMD": "20210304",
          "MLSV_FGR": 1186.00,
          "DDISH_NM": "찰흑미밥<br/>해물볶음우동5.6.9.13.17.18.<br/>뼈없는감자탕2.5.6.9.10.13.16.<br/>오이부추무침5.6.13.<br/>청양마요순살치킨(수제)1.2.5.6.13.15.<br/>배추김치9.13.",
          "ORPLC_INFO": "쌀 : 국내산<br/>김치류 : 국내산<br/>고춧가루(김치류) : 국내산<br/>쇠고기(종류) : 국내산(한우)<br/>돼지고기 : 국내산<br/>닭고기 : 국내산<br/>오리고기 : 국내산<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 가공품 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>콩 : 국내산",
          "CAL_INFO": "988.3 Kcal",
          "NTR_INFO": "탄수화물(g) : 132.6<br/>단백질(g) : 31.8<br/>지방(g) : 38.0<br/>비타민A(R.E) : 272.4<br/>티아민(mg) : 0.5<br/>리보플라빈(mg) : 0.4<br/>비타민C(mg) : 25.8<br/>칼슘(mg) : 212.3<br/>철분(mg) : 4.5",
          "MLSV_FROM_YMD": "20210304",
          "MLSV_TO_YMD": "20210304",
          "LOAD_DTM": "20210311040012"
        },
        {
          "ATPT_OFCDC_SC_CODE": "D10",
          "ATPT_OFCDC_SC_NM": "대구광역시교육청",
          "SD_SCHUL_CODE": "7240085",
          "SCHUL_NM": "대륜고등학교",
          "MMEAL_SC_CODE": "2",
          "MMEAL_SC_NM": "중식",
          "MLSV_YMD": "20210305",
          "MLSV_FGR": 1186.00,
          "DDISH_NM": "찰현미밥<br/>짬뽕수제비국2.5.6.9.10.13.17.18.16.<br/>두부양념조림5.6.13.<br/>파채무침5.6.13.<br/>콘치즈1.2.5.6.13.<br/>언양식반달불고기1.5.6.10.13.16.<br/>깍두기9.13.",
          "ORPLC_INFO": "쌀 : 국내산<br/>김치류 : 국내산<br/>고춧가루(김치류) : 국내산<br/>쇠고기(종류) : 국내산(한우)<br/>돼지고기 : 국내산<br/>닭고기 : 국내산<br/>오리고기 : 국내산<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 가공품 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>콩 : 국내산",
          "CAL_INFO": "863.8 Kcal",
          "NTR_INFO": "탄수화물(g) : 109.9<br/>단백질(g) : 44.3<br/>지방(g) : 28.2<br/>비타민A(R.E) : 259.9<br/>티아민(mg) : 0.8<br/>리보플라빈(mg) : 0.7<br/>비타민C(mg) : 21.3<br/>칼슘(mg) : 526.6<br/>철분(mg) : 8.4",
          "MLSV_FROM_YMD": "20210305",
          "MLSV_TO_YMD": "20210305",
          "LOAD_DTM": "20210312040011"
        },
        {
          "ATPT_OFCDC_SC_CODE": "D10",
          "ATPT_OFCDC_SC_NM": "대구광역시교육청",
          "SD_SCHUL_CODE": "7240085",
          "SCHUL_NM": "대륜고등학교",
          "MMEAL_SC_CODE": "2",
          "MMEAL_SC_NM": "중식",
          "MLSV_YMD": "20210308",
          "MLSV_FGR": 1143.00,
          "DDISH_NM": "치킨마요덮밥(닭다리살)1.5.6.12.13.15.16.<br/>어묵국1.5.6.9.13.16.<br/>열무무침5.6.13.<br/>청년다방불고기떡볶이플레이트1.2.5.6.10.12.13.15.16.18.<br/>배추김치9.13.",
          "ORPLC_INFO": "쌀 : 국내산<br/>김치류 : 국내산<br/>고춧가루(김치류) : 국내산<br/>쇠고기(종류) : 국내산(한우)<br/>돼지고기 : 국내산<br/>닭고기 : 국내산<br/>오리고기 : 국내산<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 가공품 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>콩 : 국내산",
          "CAL_INFO": "1090.6 Kcal",
          "NTR_INFO": "탄수화물(g) : 126.8<br/>단백질(g) : 57.5<br/>지방(g) : 41.1<br/>비타민A(R.E) : 374.4<br/>티아민(mg) : 0.6<br/>리보플라빈(mg) : 0.7<br/>비타민C(mg) : 24.1<br/>칼슘(mg) : 252.8<br/>철분(mg) : 5.4",
          "MLSV_FROM_YMD": "20210308",
          "MLSV_TO_YMD": "20210308",
          "LOAD_DTM": "20210315040012"
        }
      ]
    }
  ]
};

// 3. 파싱된 데이터 저장소
// 구조: { "2021-03-02": { ymd, schoolName, mealName, calories, dishes: [{name, allergies}], macros, nutritionList, origins, targetCount } }
let parsedMealStore = {};
let availableDates = []; // 정렬된 날짜 키 목록 ["2021-03-02", "2021-03-03", ...]
let selectedDateKey = ""; // 현재 선택된 날짜 키

/**
 * 샘플 JSON 데이터의 과거 날짜(2021년)를 '현재 주간(월~금)'으로 자동 변환해주는 유틸 함수
 */
function adjustSampleDatesToCurrentWeek(sampleJson) {
  const cloned = JSON.parse(JSON.stringify(sampleJson));
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0(일), 1(월), ... 6(토)

  // 기준 월요일 계산
  let monday = new Date(today);
  if (dayOfWeek === 0) {
    // 일요일이면 바로 내일(월요일)부터
    monday.setDate(today.getDate() + 1);
  } else if (dayOfWeek === 6) {
    // 토요일이면 다음 주 월요일부터
    monday.setDate(today.getDate() + 2);
  } else {
    // 평일(월~금)이면 이번 주의 월요일
    monday.setDate(today.getDate() - (dayOfWeek - 1));
  }

  // 월~금 5일치 YYYYMMDD 생성
  const weekYmds = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    weekYmds.push(`${y}${m}${day}`);
  }

  if (cloned.mealServiceDietInfo && cloned.mealServiceDietInfo[1] && cloned.mealServiceDietInfo[1].row) {
    cloned.mealServiceDietInfo[1].row.forEach((row, idx) => {
      if (weekYmds[idx]) {
        row.MLSV_YMD = weekYmds[idx];
        row.MLSV_FROM_YMD = weekYmds[idx];
        row.MLSV_TO_YMD = weekYmds[idx];
      }
    });
  }

  return cloned;
}

/**
 * 나이스 오픈 API에 실제 급식 데이터를 요청하는 함수
 * @param {string} [fromYmd] 조회 시작일 (YYYYMMDD) - 생략 시 이번 달 1일
 * @param {string} [toYmd]   조회 종료일 (YYYYMMDD) - 생략 시 이번 달 말일
 */
async function fetchNeisMealData(fromYmd, toYmd) {
  // 인증키가 아직 입력되지 않은 경우 기본 샘플 데이터 사용
  if (!NEIS_CONFIG.KEY || NEIS_CONFIG.KEY === "YOUR_KEY_HERE" || NEIS_CONFIG.KEY.trim() === "") {
    console.log("ℹ️ [NEIS API] js/meal.js 상단의 NEIS_CONFIG.KEY에 발급받은 인증키를 입력하시면 실시간 급식 데이터가 자동 동기화됩니다.");
    return null;
  }

  // 날짜 범위 기본값: 이번 달 1일 ~ 말일
  if (!fromYmd || !toYmd) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    fromYmd = `${y}${m}01`;
    toYmd = `${y}${m}${String(lastDay).padStart(2, "0")}`;
  }

  // API 파라미터 조합
  const params = new URLSearchParams({
    KEY: NEIS_CONFIG.KEY,
    Type: NEIS_CONFIG.Type,
    pIndex: NEIS_CONFIG.pIndex,
    pSize: NEIS_CONFIG.pSize,
    ATPT_OFCDC_SC_CODE: NEIS_CONFIG.ATPT_OFCDC_SC_CODE,
    SD_SCHUL_CODE: NEIS_CONFIG.SD_SCHUL_CODE,
    MMEAL_SC_CODE: NEIS_CONFIG.MMEAL_SC_CODE,
    MLSV_FROM_YMD: fromYmd,
    MLSV_TO_YMD: toYmd
  });

  const requestUrl = `${NEIS_CONFIG.BASE_URL}?${params.toString()}`;
  console.log(`🌐 [NEIS API] 실시간 급식 데이터 요청 중: ${fromYmd} ~ ${toYmd}`);

  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      throw new Error(`HTTP 요청 오류 (상태코드: ${response.status})`);
    }

    const data = await response.json();

    // 에러 응답 처리 (예: RESULT 객체가 단독 반환되는 경우)
    if (data.RESULT) {
      console.warn(`⚠️ [NEIS API 결과 메시지]: [${data.RESULT.CODE}] ${data.RESULT.MESSAGE}`);
      return null;
    }

    if (data.mealServiceDietInfo && data.mealServiceDietInfo[1] && data.mealServiceDietInfo[1].row) {
      console.log(`✅ [NEIS API] 급식 데이터 ${data.mealServiceDietInfo[1].row.length}건 수신 성공!`);
      return data;
    }

    return null;
  } catch (error) {
    console.error("❌ [NEIS API] 급식 데이터 호출 중 오류 발생:", error);
    return null;
  }
}

// 전역 호출 가능하도록 window 객체에 등록
window.fetchNeisMealData = fetchNeisMealData;

/**
 * 급식 모듈 초기화
 */
async function initMealModule() {
  setupSubtabEvents();
  setupMealDateControls();
  renderAllergyGuide();
  setupMealCollapseToggle();

  // 1. NEIS_CONFIG.KEY가 설정되어 있다면 실시간 API 호출 시도
  let liveApiData = null;
  if (NEIS_CONFIG.KEY && NEIS_CONFIG.KEY !== "YOUR_KEY_HERE" && NEIS_CONFIG.KEY.trim() !== "") {
    liveApiData = await fetchNeisMealData();
  }

  // 2. 실시간 데이터가 오면 파싱 렌더링, 실패하거나 미설정 시 이번 주 샘플 데이터로 렌더링
  if (liveApiData) {
    parseAndLoadMealData(liveApiData);
  } else {
    const currentWeekSample = adjustSampleDatesToCurrentWeek(initialNeisSampleJson);
    parseAndLoadMealData(currentWeekSample);
  }

  console.log("🍱 [MealModule] 급식 모듈 초기화 완료! (API 연동 및 수동 동기화 지원)");
}

/**
 * 나이스(NEIS) 오픈 API 응답 JSON 파서
 */
function parseAndLoadMealData(neisJson) {
  parsedMealStore = {};
  availableDates = [];

  try {
    if (!neisJson || !neisJson.mealServiceDietInfo || !neisJson.mealServiceDietInfo[1] || !neisJson.mealServiceDietInfo[1].row) {
      console.warn("⚠️ [MealModule] 나이스 급식 데이터 포맷이 올바르지 않습니다.");
      renderEmptyState();
      return;
    }

    const rows = neisJson.mealServiceDietInfo[1].row;

    rows.forEach(row => {
      // YYYYMMDD -> YYYY-MM-DD
      const rawYmd = String(row.MLSV_YMD);
      const dateKey = `${rawYmd.slice(0, 4)}-${rawYmd.slice(4, 6)}-${rawYmd.slice(6, 8)}`;

      // 1) 메뉴 & 알레르기 파싱 (DDISH_NM)
      const dishes = parseDishesString(row.DDISH_NM || "");

      // 2) 영양정보 파싱 (NTR_INFO)
      const { macros, fullList: nutritionList } = parseNutritionString(row.NTR_INFO || "");

      // 3) 원산지 정보 파싱 (ORPLC_INFO)
      const origins = parseOriginString(row.ORPLC_INFO || "");

      parsedMealStore[dateKey] = {
        dateKey: dateKey,
        rawYmd: rawYmd,
        schoolName: row.SCHUL_NM || "학교 급식",
        officeName: row.ATPT_OFCDC_SC_NM || "",
        mealName: row.MMEAL_SC_NM || "중식",
        targetCount: row.MLSV_FGR ? Math.round(row.MLSV_FGR) : 0,
        calories: row.CAL_INFO || "0 Kcal",
        dishes: dishes,
        macros: macros,
        nutritionList: nutritionList,
        origins: origins
      };

      availableDates.push(dateKey);
    });

    availableDates.sort();

    // 기본 선택 날짜 결정:
    // - 평일(월~금): 오늘 날짜
    // - 주말(토/일): 가장 가까운 미래의 평일(다가오는 월요일)
    const targetDateKey = getInitialTargetDateKey();
    if (availableDates.includes(targetDateKey)) {
      selectedDateKey = targetDateKey;
    } else {
      // 해당 날짜 이후 가장 가까운 미래 평일 데이터 탐색
      const closestFuture = availableDates.find(d => d >= targetDateKey);
      if (closestFuture) {
        selectedDateKey = closestFuture;
      } else {
        selectedDateKey = availableDates[availableDates.length - 1] || availableDates[0] || "";
      }
    }

    // 화면 갱신
    renderQuickDateChips();
    renderMealCard(selectedDateKey);

  } catch (error) {
    console.error("❌ [MealModule] 급식 데이터 파싱 중 오류 발생:", error);
    renderEmptyState();
  }
}

/**
 * 외부에서 호출 가능한 동적 데이터 동기화 함수
 * 사용 예시:
 *   fetch('https://open.neis.go.kr/...').then(r => r.json()).then(data => window.updateMealData(data));
 */
window.updateMealData = function(apiJsonResponse) {
  console.log("🔄 [MealModule] 외부 API 데이터를 수신하여 급식표를 동기화합니다.", apiJsonResponse);
  parseAndLoadMealData(apiJsonResponse);
};

/**
 * 메뉴 문자열 파싱 (DDISH_NM)
 * 예: "야채볶음밥(미니)1.2.5.6.10.<br/>크림스프2.5.6.<br/>그린샐러드 1.5.12."
 */
function parseDishesString(rawHtml) {
  if (!rawHtml) return [];

  // <br/> 또는 <br> 태그로 분리
  const lines = rawHtml.split(/<br\s*[\/]?>/gi);
  const result = [];

  // 맨 끝에 붙은 알레르기 번호 패턴 (. 또는 공백으로 연결된 숫자들)
  const allergyRegex = /[\d\.\s]+$/;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let dishName = trimmed;
    let allergyNums = [];

    const match = trimmed.match(allergyRegex);
    if (match && match[0].trim().length > 0) {
      dishName = trimmed.replace(allergyRegex, "").trim();
      allergyNums = match[0].match(/\d+/g) || [];
    }

    result.push({
      name: dishName,
      allergies: allergyNums.map(num => ({
        code: num,
        label: ALLERGY_MAP[num] || `알레르기 ${num}`
      }))
    });
  });

  return result;
}

/**
 * 영양정보 파싱 (NTR_INFO)
 */
function parseNutritionString(rawHtml) {
  const macros = { carb: "-", protein: "-", fat: "-" };
  const fullList = [];

  if (!rawHtml) return { macros, fullList };

  const lines = rawHtml.split(/<br\s*[\/]?>/gi);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const parts = trimmed.split(":");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join(":").trim();

      // 3대 영양소 추출
      if (key.includes("탄수화물")) macros.carb = val;
      else if (key.includes("단백질")) macros.protein = val;
      else if (key.includes("지방") && !key.includes("비타민")) macros.fat = val;

      fullList.push({ name: key, val: val });
    }
  });

  return { macros, fullList };
}

/**
 * 원산지 정보 파싱 (ORPLC_INFO)
 */
function parseOriginString(rawHtml) {
  if (!rawHtml) return [];

  const lines = rawHtml.split(/<br\s*[\/]?>/gi);
  const list = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const parts = trimmed.split(":");
    if (parts.length >= 2) {
      list.push({
        item: parts[0].trim(),
        origin: parts.slice(1).join(":").trim()
      });
    }
  });

  return list;
}

/**
 * 빠른 날짜 이동 칩 렌더링
 */
function renderQuickDateChips() {
  const container = document.getElementById("mealQuickDates");
  if (!container) return;

  if (availableDates.length === 0) {
    container.innerHTML = "";
    return;
  }

  const days = ["일", "월", "화", "수", "목", "금", "토"];

  container.innerHTML = availableDates.map(dateKey => {
    const d = new Date(dateKey);
    const dayOfWeek = days[d.getDay()];
    const shortLabel = `${dateKey.slice(5)} (${dayOfWeek})`;
    const isActive = dateKey === selectedDateKey;

    return `
      <button class="quick-date-chip ${isActive ? 'active' : ''}" data-date="${dateKey}">
        ${shortLabel}
      </button>
    `;
  }).join("");

  // 칩 클릭 이벤트
  container.querySelectorAll(".quick-date-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      selectedDateKey = chip.dataset.date;
      renderQuickDateChips();
      renderMealCard(selectedDateKey);
    });
  });
}

/**
 * 특정 날짜의 급식 카드 렌더링
 */
function renderMealCard(dateKey) {
  const meal = parsedMealStore[dateKey];
  if (!meal) {
    renderEmptyDate(dateKey);
    return;
  }

  // 1. 학교 메타 정보 업데이트
  const schoolNameEl = document.getElementById("mealSchoolName");
  const feedCountEl = document.getElementById("mealFeedCount");
  if (schoolNameEl) schoolNameEl.innerHTML = `<i class="fa-solid fa-school"></i> ${meal.schoolName}`;
  if (feedCountEl) feedCountEl.innerHTML = `<i class="fa-solid fa-users"></i> ${meal.targetCount ? meal.targetCount.toLocaleString() + '명 배식' : '배식 정보 없음'}`;

  // 2. 날짜 표시 바 업데이트
  const dateTextEl = document.getElementById("mealDateText");
  const todayBadgeEl = document.getElementById("mealTodayBadge");
  if (dateTextEl) dateTextEl.textContent = formatKoreanDate(dateKey);
  if (todayBadgeEl) {
    const isToday = getTodayDateKey() === dateKey;
    const isWeekend = (new Date().getDay() === 0 || new Date().getDay() === 6);
    const targetKey = getInitialTargetDateKey();

    if (isToday) {
      todayBadgeEl.style.display = "inline-block";
      todayBadgeEl.textContent = "오늘";
      todayBadgeEl.style.backgroundColor = "var(--accent-green)";
    } else if (isWeekend && dateKey === targetKey) {
      todayBadgeEl.style.display = "inline-block";
      todayBadgeEl.textContent = "다가오는 평일";
      todayBadgeEl.style.backgroundColor = "var(--primary-color)";
    } else {
      todayBadgeEl.style.display = "none";
    }
  }

  // 3. 메인 카드 헤더 (식사 구분, YMD, 칼로리)
  const mealTypeNameEl = document.getElementById("mealTypeName");
  const mealYmdBadgeEl = document.getElementById("mealYmdBadge");
  const mealKcalTextEl = document.getElementById("mealKcalText");
  const mealPreviewTextEl = document.getElementById("mealPreviewDishes");

  if (mealTypeNameEl) mealTypeNameEl.innerHTML = `<i class="fa-solid fa-bowl-rice"></i> ${meal.mealName}`;
  if (mealYmdBadgeEl) mealYmdBadgeEl.textContent = dateKey;
  if (mealKcalTextEl) mealKcalTextEl.textContent = meal.calories;

  // 접혔을 때 보일 미니 요약 텍스트
  if (mealPreviewTextEl) {
    if (meal.dishes.length > 0) {
      const topDishes = meal.dishes.slice(0, 3).map(d => d.name).join(", ");
      mealPreviewTextEl.textContent = `오늘의 식단: ${topDishes} 외... (${meal.calories})`;
    } else {
      mealPreviewTextEl.textContent = "등록된 식단 메뉴가 없습니다.";
    }
  }

  // 4. 3대 영양소 미니 요약 카드
  const macroSummaryEl = document.getElementById("macroNutrientsSummary");
  if (macroSummaryEl) {
    macroSummaryEl.innerHTML = `
      <div class="macro-box">
        <span class="macro-title">탄수화물</span>
        <span class="macro-amount">${meal.macros.carb}</span>
      </div>
      <div class="macro-box">
        <span class="macro-title">단백질</span>
        <span class="macro-amount">${meal.macros.protein}</span>
      </div>
      <div class="macro-box">
        <span class="macro-title">지방</span>
        <span class="macro-amount">${meal.macros.fat}</span>
      </div>
    `;
  }

  // 5. 메뉴 리스트 렌더링 (알레르기 툴팁 태그 포함)
  const menuListEl = document.getElementById("mealMenuList");
  if (menuListEl) {
    if (meal.dishes.length === 0) {
      menuListEl.innerHTML = `<p class="empty-state">등록된 메뉴가 없습니다.</p>`;
    } else {
      menuListEl.innerHTML = meal.dishes.map(dish => `
        <div class="meal-item">
          <span class="meal-dish-name">${dish.name}</span>
          <div class="meal-allergies-wrap">
            ${dish.allergies.map(a => `
              <span class="allergy-num-tag" title="알레르기 유발: ${a.label}">
                ${a.code}
              </span>
            `).join("")}
          </div>
        </div>
      `).join("");
    }
  }

  // 6. 상세 탭 1: 영양 성분 그리드
  const nutritionGridEl = document.getElementById("nutritionGrid");
  if (nutritionGridEl) {
    if (meal.nutritionList.length === 0) {
      nutritionGridEl.innerHTML = `<p style="grid-column: 1/-1; color:var(--text-muted); text-align:center;">영양 정보가 제공되지 않았습니다.</p>`;
    } else {
      nutritionGridEl.innerHTML = meal.nutritionList.map(n => `
        <div class="nutrition-chip">
          <span class="nutri-name">${n.name}</span>
          <span class="nutri-val">${n.val}</span>
        </div>
      `).join("");
    }
  }

  // 7. 상세 탭 2: 원산지 정보 뱃지
  const originContainerEl = document.getElementById("originTagsContainer");
  if (originContainerEl) {
    if (meal.origins.length === 0) {
      originContainerEl.innerHTML = `<p style="color:var(--text-muted);">원산지 정보가 제공되지 않았습니다.</p>`;
    } else {
      originContainerEl.innerHTML = meal.origins.map(o => `
        <span class="origin-badge">
          <strong>${o.item}</strong> : ${o.origin}
        </span>
      `).join("");
    }
  }
}

/**
 * 선택된 날짜에 데이터가 없을 때의 UI
 */
function renderEmptyDate(dateKey) {
  const dateTextEl = document.getElementById("mealDateText");
  const todayBadgeEl = document.getElementById("mealTodayBadge");
  const mealKcalTextEl = document.getElementById("mealKcalText");
  const menuListEl = document.getElementById("mealMenuList");
  const macroSummaryEl = document.getElementById("macroNutrientsSummary");
  const mealYmdBadgeEl = document.getElementById("mealYmdBadge");

  if (dateTextEl) dateTextEl.textContent = formatKoreanDate(dateKey);
  if (todayBadgeEl) todayBadgeEl.style.display = "none";
  if (mealYmdBadgeEl) mealYmdBadgeEl.textContent = dateKey;
  if (mealKcalTextEl) mealKcalTextEl.textContent = "- Kcal";

  if (macroSummaryEl) {
    macroSummaryEl.innerHTML = `
      <div class="macro-box"><span class="macro-title">탄수화물</span><span class="macro-amount">-</span></div>
      <div class="macro-box"><span class="macro-title">단백질</span><span class="macro-amount">-</span></div>
      <div class="macro-box"><span class="macro-title">지방</span><span class="macro-amount">-</span></div>
    `;
  }

  if (menuListEl) {
    menuListEl.innerHTML = `
      <div class="empty-state" style="padding: 2.5rem 1rem;">
        <i class="fa-solid fa-utensils"></i>
        <p><strong>${dateKey}</strong> 에는 등록된 급식 식단 정보가 없습니다.</p>
        <p style="font-size: 0.85rem; margin-top: 0.35rem; color:var(--text-light);">주말이거나 급식이 운영되지 않는 날일 수 있습니다.</p>
      </div>
    `;
  }
}

function renderEmptyState() {
  const menuListEl = document.getElementById("mealMenuList");
  if (menuListEl) {
    menuListEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>급식 데이터를 불러올 수 없습니다. API 설정을 확인해주세요.</p>
      </div>
    `;
  }
}

/**
 * 1~19번 알레르기 가이드 번호표 렌더링
 */
function renderAllergyGuide() {
  const gridEl = document.getElementById("allergyGuideGrid");
  if (!gridEl) return;

  gridEl.innerHTML = Object.entries(ALLERGY_MAP).map(([code, name]) => `
    <div class="allergy-guide-item">
      <span>${code}</span>
      <strong>${name}</strong>
    </div>
  `).join("");
}

/**
 * 날짜 컨트롤 버튼 (이전 날 / 다음 날)
 */
function setupMealDateControls() {
  const prevBtn = document.getElementById("prevMealDayBtn");
  const nextBtn = document.getElementById("nextMealDayBtn");

  const navigateDate = (step) => {
    if (!selectedDateKey) return;

    // 만약 availableDates에 현재 날짜가 있다면 그 인덱스를 기준으로 전/후 이동
    const curIdx = availableDates.indexOf(selectedDateKey);
    if (curIdx !== -1 && curIdx + step >= 0 && curIdx + step < availableDates.length) {
      selectedDateKey = availableDates[curIdx + step];
    } else {
      // 일반 날짜 기준 하루 증감
      const curDate = new Date(selectedDateKey);
      curDate.setDate(curDate.getDate() + step);
      const y = curDate.getFullYear();
      const m = String(curDate.getMonth() + 1).padStart(2, "0");
      const d = String(curDate.getDate()).padStart(2, "0");
      selectedDateKey = `${y}-${m}-${d}`;
    }

    renderQuickDateChips();
    renderMealCard(selectedDateKey);
  };

  if (prevBtn) prevBtn.addEventListener("click", () => navigateDate(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => navigateDate(1));
}

/**
 * 세부 정보 서브탭 (영양 성분 / 식재료 원산지 / 알레르기 안내)
 */
function setupSubtabEvents() {
  const tabBtns = document.querySelectorAll(".meal-subtab-btn");
  const panels = {
    nutrition: document.getElementById("subtabNutritionPanel"),
    origin: document.getElementById("subtabOriginPanel"),
    allergy: document.getElementById("subtabAllergyPanel")
  };

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.subtab;
      Object.keys(panels).forEach(key => {
        if (panels[key]) {
          if (key === target) {
            panels[key].classList.add("active");
          } else {
            panels[key].classList.remove("active");
          }
        }
      });
    });
  });
}

/**
 * 급식 카드 접기/펼치기 토글 이벤트 설정
 */
function setupMealCollapseToggle() {
  const toggleBtn = document.getElementById("toggleMealBtn");
  const miniPreview = document.getElementById("mealMiniPreview");
  const bodyEl = document.getElementById("mealCollapsibleBody");
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
 * 유틸: 기본 표시할 급식 날짜 계산 (YYYY-MM-DD)
 * - 평일(월~금): 오늘 날짜
 * - 주말(토/일): 가장 가까운 미래의 평일 (다가오는 월요일)
 */
function getInitialTargetDateKey() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0(일), 1(월), ... 5(금), 6(토)

  const target = new Date(today);
  if (dayOfWeek === 6) {
    // 토요일 -> 2일 뒤 월요일
    target.setDate(today.getDate() + 2);
  } else if (dayOfWeek === 0) {
    // 일요일 -> 1일 뒤 월요일
    target.setDate(today.getDate() + 1);
  }
  // 평일(월~금)이면 오늘 날짜 유지

  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const date = String(target.getDate()).padStart(2, "0");
  return `${y}-${m}-${date}`;
}

/**
 * 유틸: 오늘 날짜 YYYY-MM-DD
 */
function getTodayDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${date}`;
}

/**
 * 유틸: 한국어 날짜 포맷 (YYYY년 M월 D일 (요일))
 */
function formatKoreanDate(dateKey) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(dateKey);
  if (isNaN(d.getTime())) return dateKey;

  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const date = d.getDate();
  const dayName = days[d.getDay()];

  return `${y}년 ${String(m).padStart(2, '0')}월 ${String(date).padStart(2, '0')}일 (${dayName})`;
}
