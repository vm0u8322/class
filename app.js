const defaultSchedule = [];

const demoFiles = [
  { name: "統計學_ch3_抽樣分配講義.pdf", size: 1480000, lastModified: makeDate("2026-05-18", "10:04") },
  { name: "IMG_統計學白板_20260518_1112.jpg", size: 3260000, lastModified: makeDate("2026-05-18", "11:12") },
  { name: "機器學習_決策樹錄音.m4a", size: 18400000, lastModified: makeDate("2026-05-19", "14:22") },
  { name: "ml_week8_notes.md", size: 21000, lastModified: makeDate("2026-05-19", "15:48") },
  { name: "英文簡報_peer_review.docx", size: 840000, lastModified: makeDate("2026-05-20", "10:55") },
  { name: "網路安全_firewall_lab_photo.png", size: 2940000, lastModified: makeDate("2026-05-22", "15:18") },
];

const state = {
  schedule: defaultSchedule,
  files: [],
  selectedCourseId: null,
  activeType: "all",
  apiReady: false,
  chatHistories: {}, // 每個課程的連續對話歷史
  chatIds: {},       // 每個課程的對話 sessionId (chat_id)
};

const scheduleGrid = document.querySelector("#scheduleGrid");
const fileList = document.querySelector("#fileList");
const courseFiles = document.querySelector("#courseFiles");
const courseTitle = document.querySelector("#courseTitle");
const courseMeta = document.querySelector("#courseMeta");
const fileCount = document.querySelector("#fileCount");
const matchCount = document.querySelector("#matchCount");
const fileInput = document.querySelector("#fileInput");
const scheduleTextInput = document.querySelector("#scheduleTextInput");
const scheduleStatus = document.querySelector("#scheduleStatus");
const answerBox = document.querySelector("#answerBox");
const apiStatus = document.querySelector("#apiStatus");
const workStatus = document.querySelector("#workStatus");
const apiPanelStatus = document.querySelector("#apiPanelStatus");
const checkApiButton = document.querySelector("#checkApiButton");
const previewModal = document.querySelector("#previewModal");
const previewImage = document.querySelector("#previewImage");
const previewTitle = document.querySelector("#previewTitle");
const previewCloseButton = document.querySelector("#previewCloseButton");
const viewButtons = document.querySelectorAll(".view-button");
const appViews = document.querySelectorAll(".app-view");

const STORAGE_KEY = "mochiclass-state-v1";
const SCHEDULE_CACHE_KEY = "mochiclass-schedule-cache-v1";
const DB_NAME = "mochiclass-local-files";
const DB_VERSION = 1;
const FILE_STORE = "files";
let persistTimer = null;
let dbPromise = null;
let isRestoring = false;
let activeView = "schedule";
let textProcessingPromise = Promise.resolve();

const defaultScheduleText = "";
const LANG_KEY = "mochiclass-lang";
const translations = {
  zh: {
    tagline: "課表驅動的智慧課堂文件管理工具",
    reset: "重新開始",
    scheduleView: "課表",
    filesView: "上傳與佇列",
    courseView: "課程內容",
    scheduleTitle: "課表",
    parseSchedule: "AI 解析課表",
    scheduleReady: "可直接貼上整段課表，按「AI 解析課表」。",
    apiTitle: "VaultSage API 主連線",
    checkApi: "重新檢查",
    apiPanelDefault: "正式部署模式：API key 由後端環境變數提供，前端不保存 key。",
    uploadTitle: "拖曳或點擊此處上傳講義、照片、錄音、筆記",
    uploadDesc: "API 連線後，上傳檔案會先依課表分類，再建立課程資料夾並送進 VaultSage；本機分類只是斷線時的備援。",
    pickFiles: "選擇檔案",
    queueTitle: "檔案佇列",
    clear: "清空",
    currentCourse: "目前課程",
    noCourseTitle: "請點一堂課",
    noCourseMeta: "選擇課表中的課程後，這裡會整理相關講義、照片、錄音與筆記。",
    downloadZip: "下載所有檔案 ZIP",
    syncCourse: "同步到 VaultSage",
    questionPlaceholder: "問這堂課：期中重點是什麼？",
    ask: "整理",
    copy: "複製",
    answerDefault: "主流程是 API：課表負責分類，VaultSage 負責保存、檢索與問答；本機只保留分類狀態和展示備援。",
    all: "全部",
    document: "講義",
    image: "照片",
    audio: "錄音",
    note: "筆記",
    apiDisconnected: "API 未連線",
    apiConnected: "API 已連線",
    workIdle: "背景待命",
    files: "files",
    matched: "matched",
    noSchedule: "請先貼上或輸入課表，再按「AI 解析課表」。",
    noFiles: "還沒有檔案。請上傳你的講義、照片、錄音或筆記。",
    previewHint: " / 點擊預覽",
    matchedTo: "配到",
    confidence: "信心",
    unmatched: "尚未配到課程",
    noClue: "沒有明顯關鍵字或時間線索",
    noSelectedCourse: "目前沒有選取課程。",
    emptyCategory: "這個分類目前沒有資料。",
    dataCount: "份資料",
    progressEmpty: "尚未上傳資料",
    progressWorking: "辨識進度",
    progressDone: "辨識完成",
    textReady: "已讀到文字",
    textMissing: "未讀到文字",
    waiting: "等待中",
    recognizing: "辨識中",
    reclassifyLabel: "手動分配科：",
    unmatchedOption: "-- 尚未配到課程 --",
    manualReassignReason: "手動重分配：{course}",
    manualReassignUnassigned: "手動重分配：未指定科目",
  },
  en: {
    tagline: "Schedule-driven smart class file manager",
    reset: "Reset",
    scheduleView: "Schedule",
    filesView: "Uploads",
    courseView: "Course",
    scheduleTitle: "Schedule",
    parseSchedule: "AI Parse",
    scheduleReady: "Paste your timetable, then click AI Parse.",
    apiTitle: "VaultSage API",
    checkApi: "Check",
    apiPanelDefault: "Production mode: the API key is provided by backend environment variables.",
    uploadTitle: "Drag or click here to upload handouts, photos, recordings, notes",
    uploadDesc: "After API connection, files are classified by timetable, organized into course folders, and synced to VaultSage.",
    pickFiles: "Choose files",
    queueTitle: "File Queue",
    clear: "Clear",
    currentCourse: "Current Course",
    noCourseTitle: "Select a course",
    noCourseMeta: "After selecting a course, related handouts, photos, recordings, and notes appear here.",
    downloadZip: "Download All Files ZIP",
    syncCourse: "Sync to VaultSage",
    questionPlaceholder: "Ask this course: What matters for midterm?",
    ask: "Organize",
    copy: "Copy",
    answerDefault: "API-first flow: the timetable classifies files, VaultSage stores, retrieves, and answers; local state is used for fallback.",
    all: "All",
    document: "Handouts",
    image: "Photos",
    audio: "Recordings",
    note: "Notes",
    apiDisconnected: "API offline",
    apiConnected: "API connected",
    workIdle: "Idle",
    files: "files",
    matched: "matched",
    noSchedule: "Paste or type a timetable, then click AI Parse.",
    noFiles: "No files yet. Upload handouts, photos, recordings, or notes.",
    previewHint: " / preview",
    matchedTo: "Matched",
    confidence: "confidence",
    unmatched: "Not matched yet",
    noClue: "No clear keyword or time clue",
    noSelectedCourse: "No course selected.",
    emptyCategory: "No files in this category.",
    dataCount: "files",
    progressEmpty: "No files yet",
    progressWorking: "Processing",
    progressDone: "Done",
    textReady: "Text extracted",
    textMissing: "No text found",
    waiting: "Waiting",
    recognizing: "Reading",
    reclassifyLabel: "Reassign to: ",
    unmatchedOption: "-- Unassigned --",
    manualReassignReason: "Manual reassign: {course}",
    manualReassignUnassigned: "Manual reassign: Unassigned",
  },
  ko: {
    tagline: "시간표 기반 스마트 수업 파일 관리자",
    reset: "처음부터",
    scheduleView: "시간표",
    filesView: "업로드",
    courseView: "수업 내용",
    scheduleTitle: "시간표",
    parseSchedule: "AI 시간표 분석",
    scheduleReady: "시간표를 붙여넣고 AI 시간표 분석을 누르세요.",
    apiTitle: "VaultSage API 연결",
    checkApi: "다시 확인",
    apiPanelDefault: "배포 모드: API key는 백엔드 환경 변수로 관리됩니다.",
    uploadTitle: "여기로 드래그하거나 클릭하여 자료, 사진, 녹음, 노트 업로드",
    uploadDesc: "API 연결 후 파일은 시간표 기준으로 분류되고 VaultSage의 수업 폴더에 동기화됩니다.",
    pickFiles: "파일 선택",
    queueTitle: "파일 대기열",
    clear: "비우기",
    currentCourse: "현재 수업",
    noCourseTitle: "수업을 선택하세요",
    noCourseMeta: "수업을 선택하면 관련 자료, 사진, 녹음, 노트가 여기에 정리됩니다.",
    downloadZip: "모든 파일 ZIP 다운로드",
    syncCourse: "VaultSage 동기화",
    questionPlaceholder: "이 수업 질문: 중간고사 핵심은?",
    ask: "정리",
    copy: "복사",
    answerDefault: "API 중심 흐름: 시간표로 파일을 분류하고 VaultSage가 저장, 검색, 질의응답을 담당합니다.",
    all: "전체",
    document: "자료",
    image: "사진",
    audio: "녹음",
    note: "노트",
    apiDisconnected: "API 미연결",
    apiConnected: "API 연결됨",
    workIdle: "대기 중",
    files: "files",
    matched: "matched",
    noSchedule: "시간표를 입력한 뒤 AI 시간표 분석을 누르세요.",
    noFiles: "아직 파일이 없습니다. 자료, 사진, 녹음 또는 노트를 업로드하세요.",
    previewHint: " / 미리보기",
    matchedTo: "분류",
    confidence: "신뢰도",
    unmatched: "아직 분류되지 않음",
    noClue: "명확한 키워드나 시간 단서 없음",
    noSelectedCourse: "선택된 수업이 없습니다.",
    emptyCategory: "이 분류에는 자료가 없습니다.",
    dataCount: "개 자료",
    progressEmpty: "자료 없음",
    progressWorking: "처리 중",
    progressDone: "완료",
    textReady: "텍스트 추출됨",
    textMissing: "텍스트 없음",
    waiting: "대기 중",
    recognizing: "인식 중",
    reclassifyLabel: "과목 수동 분류: ",
    unmatchedOption: "-- 지정되지 않음 --",
    manualReassignReason: "수동 분류: {course}",
    manualReassignUnassigned: "수동 분류: 지정되지 않음",
  },
};
let currentLang = localStorage.getItem(LANG_KEY) || "zh";

function t(key) {
  return translations[currentLang]?.[key] || translations.zh[key] || key;
}

function tt(zh, en, ko) {
  return currentLang === "en" ? en : currentLang === "ko" ? ko : zh;
}

function fmt(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function answerLanguageName() {
  return currentLang === "en" ? "English" : currentLang === "ko" ? "Korean" : "繁體中文";
}

function setText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

function applyTranslations() {
  document.documentElement.lang = currentLang === "zh" ? "zh-Hant" : currentLang;
  setText("#appTagline", t("tagline"));
  setText("#resetAllButton", t("reset"));
  setText('[data-view="schedule"]', t("scheduleView"));
  setText('[data-view="files"]', t("filesView"));
  setText('[data-view="course"]', t("courseView"));
  setText(".left-panel .panel-head h2", t("scheduleTitle"));
  setText("#applyScheduleButton", t("parseSchedule"));
  setText(".api-panel h2", t("apiTitle"));
  setText("#checkApiButton", t("checkApi"));
  setText("#dropZone h2", t("uploadTitle"));
  setText("#dropZone p", t("uploadDesc"));
  setText("#pickFilesButton", t("pickFiles"));
  setText(".center-panel .panel-head.compact h2", t("queueTitle"));
  setText("#clearButton", t("clear"));
  setText(".course-card .eyebrow", t("currentCourse"));
  setText("#downloadMediaButton", t("downloadZip"));
  setText("#syncCourseButton", t("syncCourse"));
  setText("#askForm button", t("ask"));
  setText("#copyAnswerButton", `📋 ${t("copy")}`);
  const questionInput = document.querySelector("#questionInput");
  if (questionInput) questionInput.placeholder = t("questionPlaceholder");
  const tabLabels = { all: "all", document: "document", image: "image", audio: "audio", note: "note" };
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.textContent = t(tabLabels[tab.dataset.type] || tab.dataset.type);
  });
  document.querySelectorAll(".lang-switcher button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLang);
  });
  if (!state.schedule.length) scheduleStatus.textContent = t("scheduleReady");
  if (!state.selectedCourseId) {
    courseTitle.textContent = state.schedule.length ? t("noCourseTitle") : t("noCourseTitle");
    courseMeta.textContent = t("noCourseMeta");
  }
  if (answerBox.textContent.includes("主流程是 API") || answerBox.textContent.includes("API-first flow") || answerBox.textContent.includes("API 중심")) {
    answerBox.textContent = t("answerDefault");
  }
  if (workStatus && ["背景待命", "Idle", "대기 중"].includes(workStatus.textContent.trim())) {
    workStatus.textContent = t("workIdle");
  }
  renderStats();
}

function setLanguage(lang) {
  currentLang = translations[lang] ? lang : "zh";
  localStorage.setItem(LANG_KEY, currentLang);
  applyTranslations();
  render();
  checkApiStatus().catch(() => {}); // 🌟 確保 API 狀態與連線文字立刻更新為對應語言！
}

function makeDate(date, time) {
  return new Date(`${date}T${time}:00+08:00`).getTime();
}

function openLocalDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function putFileRecord(record) {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllFileRecords() {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readonly");
    const request = tx.objectStore(FILE_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function clearFileRecords() {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function serializeFileMeta(file) {
  return {
    id: file.id,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    type: file.type,
    courseId: file.courseId,
    confidence: file.confidence,
    reasons: file.reasons,
    vaultFileId: file.vaultFileId,
    uploadStatus: file.uploadStatus,
    sourceText: file.sourceText || "",
  };
}

function persistStateSoon() {
  if (isRestoring) return;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistState().catch((error) => {
      console.warn("Persist failed:", error);
    });
  }, 250);
}

async function persistState() {
  const appState = {
    schedule: state.schedule,
    selectedCourseId: state.selectedCourseId,
    activeType: state.activeType,
    activeView,
    scheduleText: scheduleTextInput.value,
    files: state.files.map(serializeFileMeta),
    chatHistories: state.chatHistories,
    chatIds: state.chatIds,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));

  for (const file of state.files) {
    await putFileRecord({
      ...serializeFileMeta(file),
      blob: file.sourceFile || null,
      mimeType: file.sourceFile?.type || "",
    });
  }
}

function scheduleCacheKey(text) {
  return String(text || "").trim();
}

function getCachedSchedule(text) {
  try {
    const cache = JSON.parse(localStorage.getItem(SCHEDULE_CACHE_KEY) || "{}");
    return cache[scheduleCacheKey(text)] || null;
  } catch {
    return null;
  }
}

function setCachedSchedule(text, courses) {
  try {
    const key = scheduleCacheKey(text);
    const cache = JSON.parse(localStorage.getItem(SCHEDULE_CACHE_KEY) || "{}");
    cache[key] = courses;
    localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Cache is best effort.
  }
}

async function restoreState() {
  isRestoring = true;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) {
      scheduleTextInput.value = defaultScheduleText;
      return;
    }
    state.schedule = Array.isArray(saved.schedule) ? saved.schedule : defaultSchedule;
    state.selectedCourseId = saved.selectedCourseId || state.schedule[0]?.id || null;
    state.activeType = saved.activeType || "all";
    activeView = saved.activeView || "schedule";
    scheduleTextInput.value = saved.scheduleText ?? defaultScheduleText;
    state.chatHistories = saved.chatHistories || {};
    state.chatIds = saved.chatIds || {};

    const records = await getAllFileRecords();
    const recordById = new Map(records.map((record) => [record.id, record]));
    
    // 載入時去重，自動淨化歷史重複數據，避免 UI 及 Prompt 膨脹
    const seenNames = new Set();
    const uniqueMetas = [];
    for (const meta of (saved.files || [])) {
      if (!seenNames.has(meta.name)) {
        seenNames.add(meta.name);
        uniqueMetas.push(meta);
      }
    }

    state.files = uniqueMetas.map((meta) => {
      const record = recordById.get(meta.id);
      const sourceFile = record?.blob
        ? new File([record.blob], meta.name, { type: record.mimeType || record.blob.type || "application/octet-stream", lastModified: meta.lastModified || Date.now() })
        : null;
      return {
        ...meta,
        sourceFile,
        previewUrl: meta.type === "image" && sourceFile ? URL.createObjectURL(sourceFile) : null,
        sourceText: meta.sourceText || record?.sourceText || "",
      };
    });
    scheduleStatus.textContent = tt(
      "已還原上次的課表與檔案。",
      "Restored the previous timetable and files.",
      "이전 시간표와 파일을 복원했습니다."
    );
    answerBox.textContent = tt(
      "資料已從本機還原；按「重新開始」才會清空。",
      "Local data restored. Use Reset to clear everything.",
      "로컬 데이터를 복원했습니다. 모두 지우려면 처음부터를 누르세요."
    );
  } finally {
    isRestoring = false;
  }
}

function inferType(name) {
  const lower = name.toLowerCase();
  if (/\.(jpg|jpeg|png|webp|heic|gif)$/.test(lower)) return "image";
  if (/\.(mp3|wav|m4a|aac|flac|ogg)$/.test(lower)) return "audio";
  if (/\.(md|txt|rtf)$/.test(lower)) return "note";
  return "document";
}

function formatDate(ms) {
  if (!ms) return "沒有時間";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

function switchView(viewName, shouldScroll = false) {
  activeView = viewName;
  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  appViews.forEach((view) => {
    view.classList.toggle("active", view.dataset.viewPanel === viewName);
  });
  if (shouldScroll) {
    const target = document.querySelector(`[data-view-panel="${viewName}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function dayIndexFromChinese(day) {
  return ["日", "一", "二", "三", "四", "五", "六"].indexOf(day);
}

function minutesOfDay(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function normalizeDay(text) {
  const source = String(text || "").trim();
  const anchored = source.match(/^(?:週|星期|禮拜)?\s*([一二三四五六日天])(?:\s|[　,，、:：\-－~到至]|\d|$)/);
  const explicit = source.match(/(?:週|星期|禮拜)\s*([一二三四五六日天])/);
  const match = anchored || explicit;
  if (!match) return "";
  return match[1] === "天" ? "日" : match[1];
}

function stripLeadingDay(text) {
  return text
    .replace(/^\s*(?:週|星期|禮拜)?\s*[一二三四五六日天](?:\s|[　,，、:：\-－~到至])?/, " ")
    .replace(/(?:週|星期|禮拜)\s*[一二三四五六日天]/, " ");
}

function normalizeTime(text) {
  const match = text.match(/(\d{1,2})[:：](\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function parseScheduleText(text) {
  const courses = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let currentDay = "";

  lines.forEach((line, index) => {
    const normalizedLine = line.replace(/^\*\s*/, "").trim();
    const dayHeader = normalizedLine.match(/^(?:週|星期|禮拜)\s*([一二三四五六日天])$/);
    if (dayHeader) {
      currentDay = dayHeader[1] === "天" ? "日" : dayHeader[1];
      return;
    }

    const day = normalizeDay(normalizedLine) || currentDay;
    const times = [...line.matchAll(/(\d{1,2}[:：]\d{2})/g)].map((match) => normalizeTime(match[1]));
    if (!day || times.length < 2) return;

    const fields = normalizedLine.split(/[｜|]/).map((part) => part.trim()).filter(Boolean);
    if (fields.length >= 3) {
      const title = fields[1];
      const teacher = fields[2] || "";
      const room = fields[3] || "未填教室";
      courses.push({
        id: `course-${index}-${title}`.replace(/[^\w\u4e00-\u9fa5-]/g, "-"),
        day,
        start: times[0],
        end: times[1],
        title,
        room,
        keywords: [...new Set([title, teacher].filter(Boolean))],
        sessions: [{ day, start: times[0], end: times[1], room }],
      });
      return;
    }

    const keywordMatch = normalizedLine.match(/(?:關鍵字|keywords?)\s*[:：]\s*(.+)$/i);
    const keywordText = keywordMatch ? keywordMatch[1] : "";
    const beforeKeywords = keywordMatch ? normalizedLine.slice(0, keywordMatch.index).trim() : normalizedLine;
    const withoutDayTime = beforeKeywords
      .replace(/^\s*(?:週|星期|禮拜)?\s*[一二三四五六日天](?:\s|[　,，、:：\-－~到至])?/, " ")
      .replace(/(?:週|星期|禮拜)\s*[一二三四五六日天]/, " ")
      .replace(/\d{1,2}[:：]\d{2}\s*[-~－到至]\s*\d{1,2}[:：]\d{2}/, " ")
      .replace(/\d{1,2}[:：]\d{2}/g, " ")
      .trim();

    const parts = withoutDayTime.split(/\s+/).filter(Boolean);
    const title = parts[0] || `課程 ${index + 1}`;
    const room = parts.slice(1).join(" ") || "未填教室";
    const keywords = [
      title,
      ...keywordText.split(/[,，、\s]+/).map((item) => item.trim()).filter(Boolean),
    ];

    courses.push({
      id: `course-${index}-${title}`.replace(/[^\w\u4e00-\u9fa5-]/g, "-"),
      day,
      start: times[0],
      end: times[1],
      title,
      room,
      keywords: [...new Set(keywords)],
      sessions: [{ day, start: times[0], end: times[1], room }],
    });
  });

  return courses;
}

function courseKey(title) {
  return String(title || "").trim().replace(/\s+/g, "").toLowerCase();
}

function mergeSameTitleCourses(courses) {
  const merged = new Map();
  for (const course of courses) {
    const key = courseKey(course.title);
    if (!key) continue;
    const sessions = course.sessions?.length
      ? course.sessions
      : [{ day: course.day, start: course.start, end: course.end, room: course.room || "未填教室" }];
    if (!merged.has(key)) {
      merged.set(key, {
        ...course,
        id: `course-${key}`.replace(/[^\w\u4e00-\u9fa5-]/g, "-"),
        sessions: [],
        keywords: [],
      });
    }
    const target = merged.get(key);
    target.sessions.push(...sessions);
    target.keywords.push(...(course.keywords || []), course.title);
  }

  return Array.from(merged.values()).map((course) => {
    const firstSession = course.sessions[0];
    return {
      ...course,
      day: firstSession.day,
      start: firstSession.start,
      end: firstSession.end,
      room: firstSession.room || course.room || "未填教室",
      keywords: [...new Set(course.keywords.map((item) => String(item).trim()).filter(Boolean))],
    };
  });
}

function formatSessions(course) {
  const sessions = course.sessions?.length
    ? course.sessions
    : [{ day: course.day, start: course.start, end: course.end, room: course.room }];
  return sessions.map((session) => `${session.day} ${session.start}-${session.end}${session.room ? ` ${session.room}` : ""}`).join(" / ");
}

function extractJson(text) {
  try {
    let clean = String(text || "").trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    }
    const firstBracket = clean.indexOf("[");
    const lastBracket = clean.lastIndexOf("]");
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      clean = clean.slice(firstBracket, lastBracket + 1);
    } else {
      const firstBrace = clean.indexOf("{");
      const lastBrace = clean.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        clean = clean.slice(firstBrace, lastBrace + 1);
      }
    }
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function normalizeParsedCourses(parsed, sourceText = "") {
  if (!Array.isArray(parsed)) return [];
  const localCourses = parseScheduleText(sourceText);
  return parsed.map((course, index) => {
    const local = localCourses[index];
    const title = String(course.title || course.course || course.name || `課程 ${index + 1}`).trim();
    const day = local?.day || normalizeDay(String(course.day || course.weekday || ""));
    const start = local?.start || normalizeTime(String(course.start || course.start_time || ""));
    const end = local?.end || normalizeTime(String(course.end || course.end_time || ""));
    const rawKeywords = Array.isArray(course.keywords) ? course.keywords : String(course.keywords || "").split(/[,，、\s]+/);
    if (!title || !day || !start || !end) return null;
    return {
      id: String(course.id || `course-${index}-${title}`).replace(/[^\w\u4e00-\u9fa5-]/g, "-"),
      day,
      start,
      end,
      title,
      room: String(course.room || course.location || local?.room || "未填教室").trim(),
      keywords: [...new Set([title, ...(local?.keywords || []), ...rawKeywords.map((item) => String(item).trim()).filter(Boolean)])],
      sessions: [{ day, start, end, room: String(course.room || course.location || local?.room || "未填教室").trim() }],
    };
  }).filter(Boolean);
}

function setSchedule(courses, message) {
  const mergedCourses = mergeSameTitleCourses(courses);
  state.schedule = mergedCourses;
  state.selectedCourseId = mergedCourses[0]?.id || null;
  state.files = state.files.map(classifyFile);
  const mergedCount = courses.length - mergedCourses.length;
  const finalMessage = mergedCount > 0 ? `${message} 同名科目已合併 ${mergedCount} 個分時段。` : message;
  answerBox.textContent = finalMessage;
  scheduleStatus.textContent = finalMessage;
  render();
  setCachedSchedule(scheduleTextInput.value, mergedCourses);
  persistStateSoon();
}

function applyLocalScheduleText() {
  const text = scheduleTextInput.value.trim();
  if (!text) {
    const message = tt("請先貼上或打字輸入課表。", "Paste or type a timetable first.", "먼저 시간표를 붙여넣거나 입력하세요.");
    answerBox.textContent = message;
    scheduleStatus.textContent = message;
    return;
  }
  const parsed = parseScheduleText(text);
  if (!parsed.length) {
    answerBox.textContent = tt(
      "本機備援看不懂這份課表。請用類似「週一 09:10-12:00 統計學 B302 關鍵字: 回歸, anova」的格式。",
      "The local fallback could not understand this timetable. Try: Mon 09:10-12:00 Statistics B302 keywords: regression, anova.",
      "로컬 보조 분석으로 이 시간표를 이해하지 못했습니다. 예: 월 09:10-12:00 통계학 B302 키워드: 회귀, anova"
    );
    scheduleStatus.textContent = tt("本機備援解析失敗。", "Local fallback parsing failed.", "로컬 보조 분석에 실패했습니다.");
    return;
  }
  setSchedule(parsed, fmt(tt(
    "已用本機規則讀懂 {count} 堂課，並重新配對目前檔案。",
    "Local rules parsed {count} course(s) and rematched current files.",
    "로컬 규칙으로 {count}개 과목을 읽고 현재 파일을 다시 매칭했습니다."
  ), { count: parsed.length }));
}

async function applyScheduleText() {
  const button = document.querySelector("#applyScheduleButton");
  const text = scheduleTextInput.value.trim();
  if (!text) {
    const message = tt("請先貼上或打字輸入課表。", "Paste or type a timetable first.", "먼저 시간표를 붙여넣거나 입력하세요.");
    answerBox.textContent = message;
    scheduleStatus.textContent = message;
    return;
  }
  if (!state.apiReady) {
    answerBox.textContent = tt(
      "API 尚未連線，所以這次沒有用 AI。請確認後端 .env 或部署平台環境變數已設定 VAULTSAGE_API_KEY。",
      "API is not connected, so AI parsing did not run. Check the backend .env or deployment variable VAULTSAGE_API_KEY.",
      "API가 연결되지 않아 AI 분석을 실행하지 않았습니다. 백엔드 .env 또는 배포 환경 변수 VAULTSAGE_API_KEY를 확인하세요."
    );
    scheduleStatus.textContent = tt("API 未連線：AI 解析沒有執行。", "API offline: AI parsing did not run.", "API 오프라인: AI 분석을 실행하지 않았습니다.");
    return;
  }

  const cached = getCachedSchedule(text);
  if (cached?.length) {
    setSchedule(cached, fmt(tt(
      "已使用快取課表，讀懂 {count} 堂課。",
      "Used cached timetable and parsed {count} course(s).",
      "캐시된 시간표를 사용해 {count}개 과목을 읽었습니다."
    ), { count: cached.length }));
    return;
  }

  button.disabled = true;
  button.textContent = tt("解析中...", "Parsing...", "분석 중...");
  scheduleStatus.textContent = tt("正在用 VaultSage API 解析課表...", "Parsing timetable with VaultSage API...", "VaultSage API로 시간표를 분석하는 중...");
  answerBox.textContent = tt("正在用 VaultSage API 解析課表文字...", "Reading timetable text with VaultSage API...", "VaultSage API로 시간표 텍스트를 읽는 중...");
  try {
    const result = await apiFetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: `請把以下學生課表文字解析成純 JSON 陣列，不要加 Markdown，不要解釋。每個物件必須包含 id, day, start, end, title, room, keywords。day 必須忠實使用原文中的星期，不能根據日期自行推算，且只能是一、二、三、四、五、六、日。start/end 用 HH:MM。keywords 是字串陣列，至少包含課名與可能出現在檔名中的關鍵字。\n\n課表文字：\n${text}`,
        file_ids: [],
      }),
    });
    const apiCourses = normalizeParsedCourses(extractJson(result.answer), text);
    if (apiCourses.length) {
      setSchedule(apiCourses, fmt(tt(
        "API 已讀懂 {count} 堂課，並重新配對目前檔案。",
        "API parsed {count} course(s) and rematched current files.",
        "API가 {count}개 과목을 읽고 현재 파일을 다시 매칭했습니다."
      ), { count: apiCourses.length }));
      return;
    }
    answerBox.textContent = tt("API 有回覆，但不是可用 JSON；沒有套用本機規則。", "The API responded, but it was not usable JSON. Local rules were not applied.", "API 응답이 있었지만 사용할 수 있는 JSON이 아닙니다. 로컬 규칙은 적용하지 않았습니다.");
    scheduleStatus.textContent = tt("API 回覆無法轉成課表。", "The API response could not be converted into a timetable.", "API 응답을 시간표로 변환할 수 없습니다.");
  } catch (error) {
    answerBox.textContent = fmt(tt("API 課表解析失敗：{error}", "API timetable parsing failed: {error}", "API 시간표 분석 실패: {error}"), { error: error.message });
    scheduleStatus.textContent = tt("API 解析失敗，請檢查 key 或 API 狀態。", "API parsing failed. Check the key or API status.", "API 분석 실패. key 또는 API 상태를 확인하세요.");
  } finally {
    button.disabled = false;
    button.textContent = t("parseSchedule");
  }
}

function scoreFileForCourse(file, course) {
  const name = file.name.toLowerCase();
  const content = String(file.sourceText || "").toLowerCase();
  let score = 0;
  const reasons = [];

  const isTimePrimary = file.type === "image" || file.type === "audio";

  // 1. 檔名關鍵字比對 (僅限講義和筆記比對檔名，圖片與錄音檔名是亂的不比對)
  if (!isTimePrimary) {
    for (const keyword of [course.title, ...(course.keywords || [])]) {
      if (keyword && name.includes(keyword.toLowerCase())) {
        score += 10;
        reasons.push(`檔名含「${keyword}」`);
        break;
      }
    }
  }

  // 2. 內容關鍵字比對
  for (const keyword of [course.title, ...(course.keywords || [])]) {
    if (keyword && content.includes(keyword.toLowerCase())) {
      const contentScore = isTimePrimary ? 2 : 15;
      score += contentScore;
      reasons.push(`內容提到「${keyword}」`);
      break;
    }
  }

  // 3. 時間比對
  if (file.lastModified) {
    const date = new Date(file.lastModified);
    const minute = date.getHours() * 60 + date.getMinutes();
    const sessions = course.sessions?.length
      ? course.sessions
      : [{ day: course.day, start: course.start, end: course.end }];
    const sameDaySession = sessions.find((session) => date.getDay() === dayIndexFromChinese(session.day));
    const inWindowSession = sessions.find((session) => (
      date.getDay() === dayIndexFromChinese(session.day)
      && minute >= minutesOfDay(session.start) - 20
      && minute <= minutesOfDay(session.end) + 20
    ));
    if (inWindowSession) {
      const timeScore = isTimePrimary ? 20 : 3;
      score += timeScore;
      const timeLabel = file.type === "audio" ? "錄音時間" : "拍攝/建立時間";
      reasons.push(`${timeLabel}落在 ${inWindowSession.day} ${inWindowSession.start}-${inWindowSession.end}`);
    } else if (sameDaySession) {
      const sameDayScore = isTimePrimary ? 5 : 1;
      score += sameDayScore;
      const sameDayLabel = file.type === "audio" ? "錄音日期與課程同一天" : "同一天建立/拍攝";
      reasons.push(sameDayLabel);
    }
  }

  return { score, reasons };
}

function courseOptionsForAi() {
  return state.schedule.map((course) => ({
    id: course.id,
    title: course.title,
    time: formatSessions(course),
    room: course.room,
    keywords: course.keywords || [],
  }));
}

async function classifyTextFilesByApi(files) {
  const targets = files.filter((file) => (
    file.sourceText
    && !file.vaultFileId
    && !(file.type === "audio" && file.courseId && file.confidence >= 90)
  ));
  if (!targets.length) return;

  showBackgroundStatus(`正在用 API 讀取 ${targets.length} 份文字講義內容並判斷科目...`);
  for (const file of targets) {
    const excerpt = file.sourceText.slice(0, 2600);
    const result = await apiFetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: `你是學生課堂檔案分類器。請閱讀一份講義內容，從候選課程中選出最適合的一門課。不要只靠檔名，也不要要求內容必須完整出現課名；請根據主題、術語、老師、作業內容、技術詞彙推斷。\n\n請只回傳純 JSON 物件，不要 Markdown：\n{\"course_id\":\"候選課程 id\", \"confidence\":0-100, \"reason\":\"一句繁體中文理由\"}\n\n候選課程：\n${JSON.stringify(courseOptionsForAi(), null, 2)}\n\n檔名：${file.name}\n講義內容：\n${excerpt}`,
        file_ids: [],
      }),
    });
    const parsed = extractJson(result.answer);
    const matchedCourse = parsed?.course_id ? courseById(parsed.course_id) : null;
    if (matchedCourse) {
      file.courseId = matchedCourse.id;
      file.confidence = Number(parsed.confidence) || file.confidence || 70;
      file.reasons = [`API 內容判斷：${parsed.reason || matchedCourse.title}`];
    }
  }
}

function classifyFile(fileLike) {
  const type = inferType(fileLike.name);
  const sourceFile = fileLike.sourceFile || (fileLike instanceof File ? fileLike : null);
  // 優先沿用已存在的 previewUrl，避免重複創建 Blob URL 造成 ERR_FILE_NOT_FOUND
  const previewUrl = fileLike.previewUrl || (type === "image" && sourceFile ? URL.createObjectURL(sourceFile) : null);
  let best = { course: null, score: 0, reasons: [] };
  for (const course of state.schedule) {
    const result = scoreFileForCourse(fileLike, course);
    if (result.score > best.score) {
      best = { course, score: result.score, reasons: result.reasons };
    }
  }
  return {
    id: crypto.randomUUID(),
    name: fileLike.name,
    size: fileLike.size || 0,
    lastModified: fileLike.lastModified || 0,
    type,
    courseId: best.score > 0 ? best.course.id : null,
    confidence: Math.min(99, best.score * 18),
    reasons: best.reasons,
    sourceFile,
    previewUrl,
    sourceText: fileLike.sourceText || "",
    vaultFileId: fileLike.vaultFileId || null,
    uploadStatus: fileLike.uploadStatus || "local",
  };
}

function fileCardHtml(file) {
  const preview = file.type === "image" && file.previewUrl
    ? `<img class="file-thumb" src="${file.previewUrl}" alt="${file.name}">`
    : "";
  const previewHint = file.type === "image" && file.previewUrl ? t("previewHint") : "";
  
  // 🌟 手動重新配對科目的下拉選單
  const selectHtml = `
    <div class="reclassify-selector" style="margin-top: 8px; display: flex; align-items: center; gap: 6px;">
      <span style="font-size: 0.8rem; opacity: 0.8; color: var(--ink);">${t("reclassifyLabel")}</span>
      <select class="move-course-select" data-file-id="${file.id}" style="padding: 2px 6px; font-size: 0.8rem; border-radius: 4px; border: 1px solid var(--line); background: #fff; cursor: pointer; color: var(--ink);">
        <option value="" ${!file.courseId ? "selected" : ""}>${t("unmatchedOption")}</option>
        ${state.schedule.map(c => `
          <option value="${c.id}" ${file.courseId === c.id ? "selected" : ""}>${c.title}</option>
        `).join("")}
      </select>
    </div>
  `;

  return `
    <article class="file-item type-${file.type} ${file.previewUrl ? "is-previewable" : ""}" data-file-id="${file.id}">
      ${preview}
      <strong>${file.name}</strong>
      <small>${typeLabel(file.type)} / ${formatDate(file.lastModified)}${previewHint}</small>
      <div class="match">${file.vaultFileId ? `VaultSage: ${file.vaultFileId.slice(0, 8)}` : (file.reasons.join("、") || t("noClue"))}</div>
      ${selectHtml}
      <small style="margin-top: 4px; display: block;">${extractionLabel(file)}</small>
    </article>
  `;
}

function bindPreviewClicks(container) {
  // 1. 預覽點擊事件
  container.querySelectorAll(".file-item.is-previewable").forEach((item) => {
    item.addEventListener("click", (e) => {
      // 如果點擊的是下拉選單或手動分類區域，不要開啟預覽
      if (e.target.closest(".reclassify-selector") || e.target.tagName === "SELECT" || e.target.tagName === "OPTION") {
        return;
      }
      const file = state.files.find((candidate) => candidate.id === item.dataset.fileId);
      if (file?.previewUrl) {
        openPreview(file);
      }
    });
  });

  // 2. 綁定手動重新分配科目的 change 事件
  container.querySelectorAll(".move-course-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const fileId = select.dataset.fileId;
      const newCourseId = select.value || null;
      const file = state.files.find((f) => f.id === fileId);
      if (file) {
        file.courseId = newCourseId;
        file.confidence = 100;
        const matchedCourse = courseById(newCourseId);
        
        // 取得翻譯後的原因說明
        if (matchedCourse) {
          file.reasons = [fmt(t("manualReassignReason"), { course: matchedCourse.title })];
        } else {
          file.reasons = [t("manualReassignUnassigned")];
        }
        
        // 🌟 獲取該卡片 DOM 元素並加上動畫類別
        const cardDom = select.closest(".file-item");
        if (cardDom) {
          cardDom.classList.add("just-reassigned");
        }
        
        // 延遲更新以完整展示動畫
        setTimeout(() => {
          render();
          persistStateSoon();
          if (state.selectedCourseId) {
            renderCourseDetail();
          }
        }, 800);
      }
    });
  });
}

function openPreview(file) {
  previewTitle.textContent = file.name;
  previewImage.src = file.previewUrl;
  previewImage.alt = file.name;
  previewModal.classList.add("is-open");
  previewModal.setAttribute("aria-hidden", "false");
}

function closePreview() {
  previewModal.classList.remove("is-open");
  previewModal.setAttribute("aria-hidden", "true");
  previewImage.removeAttribute("src");
}

function crc32(bytes) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function dosDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function writeU16(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeU32(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function sanitizeZipName(name) {
  return String(name || "file").replace(/[\\/:*?"<>|]/g, "_");
}

async function createZipBlob(entries) {
  const encoder = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const data = new Uint8Array(await entry.file.arrayBuffer());
    const crc = crc32(data);
    const { time, day } = dosDateTime(new Date(entry.file.lastModified || Date.now()));

    const local = new Uint8Array(30 + nameBytes.length);
    writeU32(local, 0, 0x04034b50);
    writeU16(local, 4, 20);
    writeU16(local, 8, 0);
    writeU16(local, 10, time);
    writeU16(local, 12, day);
    writeU32(local, 14, crc);
    writeU32(local, 18, data.length);
    writeU32(local, 22, data.length);
    writeU16(local, 26, nameBytes.length);
    local.set(nameBytes, 30);
    chunks.push(local, data);

    const header = new Uint8Array(46 + nameBytes.length);
    writeU32(header, 0, 0x02014b50);
    writeU16(header, 4, 20);
    writeU16(header, 6, 20);
    writeU16(header, 10, 0);
    writeU16(header, 12, time);
    writeU16(header, 14, day);
    writeU32(header, 16, crc);
    writeU32(header, 20, data.length);
    writeU32(header, 24, data.length);
    writeU16(header, 28, nameBytes.length);
    writeU32(header, 42, offset);
    header.set(nameBytes, 46);
    central.push(header);
    offset += local.length + data.length;
  }

  const centralSize = central.reduce((sum, item) => sum + item.length, 0);
  const centralOffset = offset;
  const end = new Uint8Array(22);
  writeU32(end, 0, 0x06054b50);
  writeU16(end, 8, entries.length);
  writeU16(end, 10, entries.length);
  writeU32(end, 12, centralSize);
  writeU32(end, 16, centralOffset);
  return new Blob([...chunks, ...central, end], { type: "application/zip" });
}

async function downloadSelectedCourseMediaZip() {
  const course = courseById(state.selectedCourseId);
  if (!course) {
    answerBox.textContent = "請先建立課表並選擇一門課，再下載該課程的檔案。";
    return;
  }
  const courseFilesList = state.files.filter((file) => (
    file.courseId === course.id
    && file.sourceFile
  ));
  if (!courseFilesList.length) {
    answerBox.textContent = "這堂課目前沒有本機檔案可以打包。請上傳真實檔案後再下載。";
    return;
  }

  answerBox.textContent = `正在打包「${course.title}」的 ${courseFilesList.length} 個檔案...`;
  
  // 建立分類資料夾對照：講義(handouts), 圖片(photos), 錄音(audio), 筆記(notes)
  const typeSubfolders = {
    document: "handouts",
    image: "photos",
    audio: "audio",
    note: "notes"
  };

  const entries = courseFilesList.map((file) => {
    const subfolder = typeSubfolders[file.type] || "others";
    return {
      path: `${subfolder}/${sanitizeZipName(file.name)}`,
      file: file.sourceFile,
    };
  });
  const zip = await createZipBlob(entries);
  const url = URL.createObjectURL(zip);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeZipName(course.title)}_all_files.zip`;
  link.click();
  URL.revokeObjectURL(url);
  answerBox.textContent = `已下載「${course.title}」所有檔案 ZIP。`;
}

function releaseFilePreviews(files = state.files) {
  files.forEach((file) => {
    if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
  });
}

async function enrichFileLike(fileLike) {
  if (!(fileLike instanceof File)) return fileLike;
  const lower = fileLike.name.toLowerCase();
  const shouldReadText = fileLike.type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(lower);
  const isImage = /\.(jpg|jpeg|png|webp|heic|gif)$/i.test(lower) || fileLike.type.startsWith("image/");
  const isAudio = /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(lower) || fileLike.type.startsWith("audio/");
  const isPdf = lower.endsWith(".pdf") || fileLike.type === "application/pdf";

  try {
    if (shouldReadText) {
      fileLike.sourceText = await fileLike.text();
    } else if (isPdf || isImage || isAudio) {
      const form = new FormData();
      form.append("file", fileLike);
      const result = await apiFetch("/api/extract-text", { method: "POST", body: form });
      fileLike.sourceText = result.text || "";
    }
  } catch {
    fileLike.sourceText = "";
  }
  return fileLike;
}

async function processFileTextBatch(filesToProcess, { syncAfter = true } = {}) {
  const targets = filesToProcess.filter((file) => file.sourceFile);
  if (!targets.length) return;

  showBackgroundStatus(fmt(tt(
    "已加入 {total} 個檔案，正在立即進行 OCR / 文字抽取...",
    "Added {total} file(s). OCR / text extraction is starting now...",
    "{total}개 파일을 추가했습니다. OCR / 텍스트 추출을 바로 시작합니다..."
  ), { total: targets.length }));

  for (const file of targets) {
    try {
      file.uploadStatus = "processing";
      showBackgroundStatus(fmt(tt(
        "正在辨識 {file}...",
        "Reading {file}...",
        "{file} 인식 중..."
      ), { file: file.name }));
      render();

      await enrichFileLike(file.sourceFile);
      file.sourceText = file.sourceFile.sourceText || "";

      const reClassified = classifyFile({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        sourceFile: file.sourceFile,
        sourceText: file.sourceText,
      });

      file.courseId = reClassified.courseId;
      file.confidence = reClassified.confidence;
      file.reasons = reClassified.reasons;
      file.uploadStatus = file.sourceText ? "local" : "failed";
      render();
    } catch (err) {
      console.error(`處理檔案失敗: ${file.name}`, err);
      file.uploadStatus = "failed";
      render();
    }
  }

  const extractedCount = targets.filter((file) => file.sourceText).length;
  const missingTextCount = targets.filter((file) => !file.sourceText).length;
  showBackgroundStatus(fmt(tt(
    "OCR / 文字抽取完成：{total} 個檔案跑完，{extracted} 個讀到文字，{missing} 個未讀到文字。",
    "OCR / text extraction finished: {total} file(s) processed, {extracted} with text, {missing} without text.",
    "OCR / 텍스트 추출 완료: {total}개 처리, {extracted}개 텍스트 추출, {missing}개 텍스트 없음."
  ), { total: targets.length, extracted: extractedCount, missing: missingTextCount }));

  if (syncAfter && state.apiReady) {
    (async () => {
      try {
        await classifyTextFilesByApi(targets);
        render();
      } catch (err) {
        console.warn("API classification failed for batch:", err);
      }
      try {
        await syncFilesToApi(targets);
        render();
      } catch (err) {
        console.warn("API sync failed for batch:", err);
      }
    })();
  }
}

function queueTextProcessing(filesToProcess, options) {
  textProcessingPromise = textProcessingPromise
    .catch(() => {})
    .then(() => processFileTextBatch(filesToProcess, options));
  return textProcessingPromise;
}

async function addFiles(files) {
  const rawListArray = Array.from(files);
  if (!rawListArray.length) return;

  // 加入去重過濾，防止佇列重複與 Prompt 膨脹
  const fileListArray = rawListArray.filter(f => {
    const isDup = state.files.some(existing => existing.name === f.name);
    if (isDup) {
      console.log(`檔案重複已跳過: ${f.name}`);
    }
    return !isDup;
  });

  if (!fileListArray.length) {
    answerBox.textContent = "上傳的檔案都已經存在於佇列中，已自動跳過重複檔案。";
    return;
  }

  // 1. 瞬間將所有檔案加入佇列，更新 UI 並切換分頁，給使用者即時的反饋！
  const newFiles = fileListArray.map((f) => classifyFile(f));
  newFiles.forEach((file) => {
    file.uploadStatus = "pending";
  });
  state.files.push(...newFiles);
  render();
  switchView("files", true);
  queueTextProcessing(newFiles, { syncAfter: true });
  return;
  
  showBackgroundStatus(`已加入 ${newFiles.length} 個檔案，正在背景排隊進行文字辨識與 AI 分析...`);

  // 2. 逐一在背景處理每個檔案，使介面保持完美響應，不卡死！
  for (const file of newFiles) {
    if (file.sourceFile) {
      try {
        file.uploadStatus = "processing";
        render();

        // 呼叫後端 API 進行 OCR / 語音轉文字
        await enrichFileLike(file.sourceFile);
        file.sourceText = file.sourceFile.sourceText || "";

        // 根據提取出的文字重新進行本機分類與評分
        const reClassified = classifyFile({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          sourceFile: file.sourceFile,
          sourceText: file.sourceText
        });
        
        file.courseId = reClassified.courseId;
        file.confidence = reClassified.confidence;
        file.reasons = reClassified.reasons;
        file.uploadStatus = file.sourceText ? "local" : "failed";
        render();

      } catch (err) {
        console.error(`處理檔案失敗: ${file.name}`, err);
        file.uploadStatus = "failed";
        render();
      }
    }
  }

  const extractedCount = newFiles.filter((file) => file.sourceText).length;
  const missingTextCount = newFiles.filter((file) => (
    ["image", "document", "audio", "note"].includes(file.type) && !file.sourceText
  )).length;
  showBackgroundStatus(fmt(tt(
    "背景處理完成：{total} 個檔案跑完，{extracted} 個讀到文字，{missing} 個未讀到文字。",
    "Background processing finished: {total} file(s) processed, {extracted} with extracted text, {missing} without text.",
    "백그라운드 처리 완료: {total}개 파일 처리, {extracted}개 텍스트 추출, {missing}개 텍스트 없음."
  ), { total: newFiles.length, extracted: extractedCount, missing: missingTextCount }));

  if (state.apiReady) {
    (async () => {
      try {
        await classifyTextFilesByApi(newFiles);
        render();
      } catch (err) {
        console.warn("API classification failed for batch:", err);
      }
      try {
        await syncFilesToApi(newFiles);
        render();
      } catch (err) {
        console.warn("API sync failed for batch:", err);
      }
    })();
  }
}

async function loadSampleCourseDocs() {
  try {
    const docs = await apiFetch("/api/sample-docs");
    if (!docs.length) {
      answerBox.textContent = "找不到亂碼講義範例。";
      return;
    }
    const files = docs.map((doc) => {
      const binary = atob(doc.data_base64 || "");
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const file = new File([bytes], doc.name, { type: doc.content_type || "application/pdf", lastModified: Date.now() });
      file.sourceText = doc.content || "";
      return file;
    });
    await addFiles(files);
    answerBox.textContent = `已載入 ${files.length} 份亂碼檔名 PDF 講義。檔名不含課名，適合測 API 內容分析分類。`;
  } catch (error) {
    answerBox.textContent = `載入亂碼講義失敗：${error.message}`;
  }
}

function courseById(id) {
  return state.schedule.find((course) => course.id === id);
}

function typeLabel(type) {
  return {
    document: t("document"),
    image: t("image"),
    audio: t("audio"),
    note: t("note"),
  }[type] || "File";
}

function extractionLabel(file) {
  if (file.sourceText) return t("textReady");
  if (file.uploadStatus === "processing") return t("recognizing");
  if (file.uploadStatus === "pending") return t("waiting");
  if (["image", "document", "audio", "note"].includes(file.type)) return t("textMissing");
  return file.uploadStatus || "";
}

function courseProgress(files) {
  if (!files.length) {
    return { total: 0, done: 0, percent: 0, label: t("progressEmpty"), state: "empty" };
  }
  // 核心邏輯優化：將 "uploading" 也視為辨識完成，避免進度條因進入上傳階段而往回跳 (regression)
  const doneStatuses = new Set(["local", "uploading", "api", "failed"]);
  const done = files.filter((file) => doneStatuses.has(file.uploadStatus)).length;
  const percent = Math.round((done / files.length) * 100);
  const hasWorking = files.some((file) => ["pending", "processing", "uploading"].includes(file.uploadStatus));
  const label = hasWorking
    ? `${t("progressWorking")} ${done}/${files.length}`
    : `${t("progressDone")} ${done}/${files.length}`;
  return {
    total: files.length,
    done,
    percent,
    label,
    state: hasWorking ? "working" : "done",
  };
}

function renderSchedule() {
  if (!state.schedule.length) {
    scheduleGrid.innerHTML = `<div class="empty">${t("noSchedule")}</div>`;
    return;
  }

  scheduleGrid.innerHTML = state.schedule.map((course) => {
    const files = state.files.filter((file) => file.courseId === course.id);
    const progress = courseProgress(files);
    const active = state.selectedCourseId === course.id ? "active" : "";
    return `
      <article class="course-slot ${active}" data-course="${course.id}">
        <strong>${course.title}</strong>
        <small>${formatSessions(course)} / ${files.length} ${t("dataCount")}</small>
        <div class="badge-row">
          <span class="badge">${t("document")} ${files.filter((f) => f.type === "document").length}</span>
          <span class="badge">${t("image")} ${files.filter((f) => f.type === "image").length}</span>
          <span class="badge">${t("audio")} ${files.filter((f) => f.type === "audio").length}</span>
          <span class="badge">${t("note")} ${files.filter((f) => f.type === "note").length}</span>
        </div>
        <div class="course-progress is-${progress.state}" aria-label="${progress.label}">
          <div class="course-progress-meta">
            <span>${progress.label}</span>
            <span>${progress.percent}%</span>
          </div>
          <div class="course-progress-track">
            <div class="course-progress-fill" style="width:${progress.percent}%"></div>
          </div>
        </div>
      </article>
    `;
  }).join("");

  scheduleGrid.querySelectorAll(".course-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      state.selectedCourseId = slot.dataset.course;
      
      // 切換課程時，重設問答輸入框與提示，給使用者更清晰引導與直覺的體驗！
      const course = courseById(state.selectedCourseId);
      if (course) {
        const qInput = document.querySelector("#questionInput");
        if (qInput) qInput.value = "";
        const switchedText = currentLang === "zh"
          ? `已切換至「${course.title}」。您可以於上方輸入問題並點選「整理」，我將根據本課堂上傳的講義、白板照片 OCR 文字或錄音逐字稿，為您快速梳理重點！`
          : currentLang === "ko"
            ? `「${course.title}」 수업으로 전환했습니다. 질문을 입력하면 업로드된 자료, 사진 OCR, 녹음 내용을 바탕으로 정리합니다.`
            : `Switched to "${course.title}". Ask a question and I will organize answers from uploaded handouts, photo OCR, and recordings.`;
        showAnswer(switchedText, false);
      }
      
      render();
    });
  });
}

function renderFiles() {
  if (!state.files.length) {
    fileList.innerHTML = `<div class="empty">${t("noFiles")}</div>`;
    return;
  }

  fileList.innerHTML = state.files.map((file) => {
    const course = courseById(file.courseId);
    const selectHtml = `
      <div class="reclassify-selector" style="margin-top: 8px; display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 0.8rem; opacity: 0.8; color: var(--ink);">${t("reclassifyLabel")}</span>
        <select class="move-course-select" data-file-id="${file.id}" style="padding: 2px 6px; font-size: 0.8rem; border-radius: 4px; border: 1px solid var(--line); background: #fff; cursor: pointer; color: var(--ink);">
          <option value="" ${!file.courseId ? "selected" : ""}>${t("unmatchedOption")}</option>
          ${state.schedule.map(c => `
            <option value="${c.id}" ${file.courseId === c.id ? "selected" : ""}>${c.title}</option>
          `).join("")}
        </select>
      </div>
    `;

    return `
      <article class="file-item type-${file.type} ${file.previewUrl ? "is-previewable" : ""}" data-file-id="${file.id}">
        ${file.type === "image" && file.previewUrl ? `<img class="file-thumb" src="${file.previewUrl}" alt="${file.name}">` : ""}
        <strong>${file.name}</strong>
        <small>${typeLabel(file.type)} / ${formatDate(file.lastModified)}${file.previewUrl ? t("previewHint") : ""}</small>
        <div class="match">${course ? `${t("matchedTo")}：${course.title}，${t("confidence")} ${file.confidence}%` : t("unmatched")}</div>
        ${selectHtml}
        <small style="margin-top: 4px; display: block;">${file.reasons.join("、") || t("noClue")} / ${file.vaultFileId ? `API: ${file.vaultFileId.slice(0, 8)}` : extractionLabel(file)}</small>
      </article>
    `;
  }).join("");
  bindPreviewClicks(fileList);
}

function renderCourseDetail() {
  const course = courseById(state.selectedCourseId);
  if (!course) {
    courseTitle.textContent = t("noCourseTitle");
    courseMeta.textContent = t("noCourseMeta");
    courseFiles.innerHTML = `<div class="empty">${t("noSelectedCourse")}</div>`;
    return;
  }

  const files = state.files.filter((file) => file.courseId === course.id);
  const visible = state.activeType === "all" ? files : files.filter((file) => file.type === state.activeType);
  courseTitle.textContent = course.title;
  courseMeta.textContent = `${formatSessions(course)} / 關鍵字：${course.keywords.join("、")}`;
  renderChatHistory(course.id);

  if (!visible.length) {
    courseFiles.innerHTML = `<div class="empty">${t("emptyCategory")}</div>`;
    return;
  }

  courseFiles.innerHTML = visible.map(fileCardHtml).join("");
  bindPreviewClicks(courseFiles);
}

// 🌟 連續對話 CSS 動態注入（打造 Premium 的聊天室體驗，靠右為 user 泡泡，靠左為 assistant 泡泡）
const chatStyles = `
  .chat-thread {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 420px;
    overflow-y: auto;
    padding: 10px;
    background: #fafbfc;
    border-radius: 6px;
    border: 1px solid var(--line);
    margin-top: 10px;
  }
  .chat-bubble {
    max-width: 85%;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 0.92rem;
    line-height: 1.6;
    word-break: break-word;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .chat-bubble.user {
    align-self: flex-end;
    background: var(--accent);
    color: #fff;
    border-bottom-right-radius: 2px;
  }
  .chat-bubble.assistant {
    align-self: flex-start;
    background: #ffffff;
    color: var(--ink);
    border-bottom-left-radius: 2px;
    border: 1px solid var(--line);
  }
  .chat-bubble.loading {
    align-self: flex-start;
    background: #f1f4f8;
    color: var(--muted);
    font-style: italic;
    box-shadow: none;
    border: 1px dashed var(--line);
  }
  .chat-bubble.assistant p {
    margin-top: 0;
    margin-bottom: 8px;
  }
  .chat-bubble.assistant p:last-child {
    margin-bottom: 0;
  }
  .chat-bubble.assistant h1, 
  .chat-bubble.assistant h2, 
  .chat-bubble.assistant h3 {
    margin-top: 12px;
    margin-bottom: 6px;
    font-size: 1.05rem;
    color: var(--ink);
  }
  .chat-bubble.assistant ul {
    margin-top: 0;
    margin-bottom: 8px;
    padding-left: 20px;
  }
`;
const styleEl = document.createElement("style");
styleEl.textContent = chatStyles;
document.head.appendChild(styleEl);

function renderChatHistory(courseId) {
  const course = courseById(courseId);
  if (!course) return;

  const history = state.chatHistories[courseId] || [];
  const copyBtn = document.querySelector("#copyAnswerButton");
  
  if (history.length === 0) {
    if (copyBtn) copyBtn.style.display = "none";
    const greeting = currentLang === "zh"
      ? `已切換至「${course.title}」。您可以於上方輸入問題並點選「整理」，我將根據本課堂上傳的講義、白板照片 OCR 文字或錄音逐字稿，為您快速梳理重點！`
      : currentLang === "ko"
        ? `「${course.title}」 수업으로 전환했습니다. 질문을 입력하면 업로드된 자료, 사진 OCR, 녹음 내용을 바탕으로 정리합니다.`
        : `Switched to "${course.title}". Ask a question and I will organize answers from uploaded handouts, photo OCR, and recordings.`;
    answerBox.innerHTML = `<div class="chat-thread"><div class="chat-bubble assistant">${greeting}</div></div>`;
    return;
  }

  // 渲染整條聊天對話歷史
  let html = `<div class="chat-thread" id="chatThread">`;
  history.forEach((msg) => {
    if (msg.role === "user") {
      html += `<div class="chat-bubble user">${msg.content}</div>`;
    } else {
      if (msg.isLoading) {
        html += `<div class="chat-bubble assistant loading">${msg.content || "正在辨識圖片與整理課堂內容，請稍候..."}</div>`;
      } else {
        html += `<div class="chat-bubble assistant">${parseMarkdown(msg.content)}</div>`;
      }
    }
  });
  html += `</div>`;
  
  answerBox.innerHTML = html;
  
  // 當最後一條是 assistant 回覆且載入完畢時，顯示複製按鈕，並儲存複製內容
  const lastMsg = history[history.length - 1];
  if (copyBtn) {
    if (lastMsg && lastMsg.role === "assistant" && !lastMsg.isLoading) {
      copyBtn.style.display = "flex";
      currentAnswerText = lastMsg.content;
    } else {
      copyBtn.style.display = "none";
    }
  }

  // 自動滾動聊天室到最底部
  setTimeout(() => {
    const thread = document.querySelector("#chatThread");
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, 50);
}

function renderStats() {
  fileCount.textContent = `${state.files.length} ${t("files")}`;
  matchCount.textContent = `${state.files.filter((file) => file.courseId).length} ${t("matched")}`;
}

function render() {
  renderStats();
  renderSchedule();
  renderFiles();
  renderCourseDetail();
  persistStateSoon();
}

function loadDemo() {
  releaseFilePreviews();
  state.files = demoFiles.map(classifyFile);
  state.selectedCourseId = "stats";
  answerBox.textContent = "已載入示範資料。點課表上的課，就能看到被配進那堂課的講義、照片、錄音與筆記。";
  render();
}

function summarizeSelectedCourse(question) {
  const course = courseById(state.selectedCourseId);
  const files = state.files.filter((file) => file.courseId === course.id);
  if (!files.length) return `「${course.title}」目前沒有可整理的資料。`;

  const textFiles = files.filter((file) => file.sourceText);
  const images = files.filter((file) => file.type === "image");
  if (textFiles.length) {
    const excerpts = textFiles.map((file) => {
      const text = String(file.sourceText || "").trim();
      const excerpt = text.length > 700 ? `${text.slice(0, 700)}...` : text;
      return `【${file.name}】\n${excerpt}`;
    }).join("\n\n");
    const missingImages = images.filter((file) => !file.sourceText).map((file) => file.name);
    const missingNote = missingImages.length
      ? `\n\n以下圖片目前沒有 OCR 文字，不能假裝有讀到：\n${missingImages.map((name) => `- ${name}`).join("\n")}`
      : "";
    return `你問：「${question}」\n\n以下只根據目前已辨識出的課堂檔案內容整理「${course.title}」：\n\n${excerpts}${missingNote}`;
  }

  const groups = ["document", "image", "audio", "note"].map((type) => {
    const names = files.filter((file) => file.type === type).map((file) => file.name);
    return names.length ? `${typeLabel(type)}：${names.join("、")}` : "";
  }).filter(Boolean);

  return `你問：「${question}」\n\n「${course.title}」目前有配對檔案，但沒有可用的 OCR 文字或逐字稿，所以不能根據圖片內容回答。\n${groups.join("\n")}\n\n請重新上傳檔案，或確認後端 OCR 服務已正常啟動。`;
}

async function ensureCourseFileText(courseFiles, courseId) {
  const needsText = courseFiles.filter((file) => (
    file.sourceFile
    && !file.sourceText
    && ["image", "document", "audio", "note"].includes(file.type)
  ));
  if (!needsText.length) return;

  const history = state.chatHistories[courseId] || [];
  const loadingMsg = history.find((msg) => msg.role === "assistant" && msg.isLoading);
  if (loadingMsg) {
    loadingMsg.content = `正在重新辨識這堂課 ${needsText.length} 個尚未讀到內容的檔案...`;
    renderChatHistory(courseId);
  }
  for (const file of needsText) {
    try {
      if (loadingMsg) {
        loadingMsg.content = `正在辨識 ${file.name}...`;
        renderChatHistory(courseId);
      }
      await enrichFileLike(file.sourceFile);
      file.sourceText = file.sourceFile.sourceText || "";
      file.uploadStatus = file.sourceText ? "local" : "failed";
      renderSchedule();
    } catch (error) {
      console.warn("Re-OCR failed:", file.name, error);
      file.uploadStatus = "failed";
    }
  }
  render();
  persistStateSoon();
}

async function apiFetch(path, options = {}, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(path, options);
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json") ? await response.json() : await response.text();
      
      if (!response.ok) {
        // 如果遇到暫時性伺服器錯誤（5xx），在重試次數內進行自動重試
        if (response.status >= 500 && i < retries - 1) {
          console.warn(`API 返回 ${response.status} 錯誤，正在進行第 ${i + 1} 次自動重試...`);
          await new Promise(res => setTimeout(res, delay * (i + 1)));
          continue;
        }
        const detail = typeof payload === "string" ? payload : payload.detail || payload.error || payload;
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
      }
      return payload;
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      console.warn(`API 請求連線失敗 (${error.message})，正在進行第 ${i + 1} 次自動重試...`);
      await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
  }
}

async function checkApiStatus() {
  try {
    const status = await apiFetch("/api/status");
    state.apiReady = Boolean(status.api_ready);
    apiStatus.textContent = state.apiReady ? t("apiConnected") : status.api_key_configured ? `API ${status.auth_status}` : t("apiDisconnected");
    apiPanelStatus.classList.toggle("is-live", state.apiReady);
    apiPanelStatus.classList.toggle("is-error", !state.apiReady && Boolean(status.api_key_configured));
    apiPanelStatus.textContent = state.apiReady
      ? (currentLang === "zh" ? "API 已連線，可以用 AI 解析課表並同步檔案。" : currentLang === "ko" ? "API가 연결되었습니다. AI 시간표 분석과 파일 동기화를 사용할 수 있습니다." : "API connected. AI schedule parsing and file sync are ready.")
      : status.api_key_configured
        ? `API key: ${status.auth_status}`
        : (currentLang === "zh" ? "後端尚未設定 API key。請在 .env 或部署平台環境變數設定 VAULTSAGE_API_KEY。" : currentLang === "ko" ? "백엔드에 API key가 설정되지 않았습니다." : "Backend API key is not configured.");
  } catch {
    state.apiReady = false;
    apiStatus.textContent = currentLang === "zh" ? "請用 server.py 開啟" : currentLang === "ko" ? "server.py로 실행하세요" : "Run server.py";
    apiPanelStatus.classList.remove("is-live");
    apiPanelStatus.classList.add("is-error");
    apiPanelStatus.textContent = currentLang === "zh" ? "連不到本機 server，請確認 http://127.0.0.1:4180 有開。" : currentLang === "ko" ? "로컬 서버에 연결할 수 없습니다." : "Cannot reach the local server.";
  }
}

async function ensureCourseDirectory(course) {
  const result = await apiFetch("/api/directories/ensure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ directory_name: `MochiClass - ${course.title}` }),
  });
  return result.directory_id;
}

async function syncFilesToApi(files) {
  if (!state.apiReady) {
    answerBox.textContent = "API 尚未連線。請確認後端 .env 或部署平台環境變數已設定 VAULTSAGE_API_KEY。";
    return;
  }

  const realFiles = files.filter((file) => file.courseId && file.sourceFile && !file.vaultFileId);
  if (!realFiles.length) {
    const alreadySynced = files.filter((file) => file.vaultFileId).length;
    const hasSourceFiles = files.some((file) => file.sourceFile);
    if (alreadySynced) {
      showBackgroundStatus(`這堂課已有 ${alreadySynced} 份檔案同步到 VaultSage。`);
    } else if (!hasSourceFiles) {
      answerBox.textContent = "目前這堂課沒有可上傳的原始檔案。請重新上傳真實檔案後再同步到 VaultSage。";
    } else {
      answerBox.textContent = "目前檔案尚未配對到課程，請先確認課表與檔案時間/內容配對成功。";
    }
    return;
  }

  showBackgroundStatus(`API 主流程：正在依課表建立資料夾並上傳 ${realFiles.length} 份檔案...`);
  const uploadedNames = [];
  try {
    const grouped = new Map();
    for (const file of realFiles) {
      const list = grouped.get(file.courseId) || [];
      list.push(file);
      grouped.set(file.courseId, list);
    }

    for (const [courseId, courseFiles] of grouped.entries()) {
      const course = courseById(courseId);
      const directoryId = await ensureCourseDirectory(course);
      for (const file of courseFiles) {
        file.uploadStatus = "uploading";
        render();
        
        let fileToUpload = file.sourceFile;
        let isFallback = false;
        
        // 🌟 核心相容性優化：由於 VaultSage 不支援音訊檔案（如 .wav、.mp3），
        // 我們會自動將背景識別出的「逐字稿內容」封裝成一個語意豐富的 .md 檔案進行上傳！
        if (file.type === "audio") {
          const mdContent = `# 課堂錄音逐字稿大綱\n\n* **原始音訊檔名**: \`${file.name}\`\n* **錄音時間**: ${formatDate(file.lastModified)}\n\n---\n\n### 錄音逐字稿內容：\n${file.sourceText || "（無逐字稿文字）"}`;
          const mdFilename = file.name.replace(/\.[^/.]+$/, "") + "_錄音逐字稿.md";
          fileToUpload = new File([mdContent], mdFilename, { type: "text/markdown; charset=utf-8" });
        } else if (fileToUpload) {
          // 對於其他真實檔案，我們試圖將其讀入記憶體重新封裝，避免 Chrome 還原 Blob 遺失 Bug
          try {
            const buf = await fileToUpload.arrayBuffer();
            fileToUpload = new File([buf], fileToUpload.name, { type: fileToUpload.type, lastModified: fileToUpload.lastModified });
          } catch (readErr) {
            console.warn("實體檔案讀取失敗（可能因本機 C: 碟空間不足導致 Blob 損毀），將自動啟用 AI 文字降級 Fallback 方案！", readErr);
            isFallback = true;
          }
        } else {
          isFallback = true;
        }

        // 🌟 空間不足/二進位損毀時的 AI 文字降級傳輸機制！
        if (isFallback) {
          if (file.sourceText) {
            const fileTypeLabel = { image: "白板照片 OCR 文字", document: "講義提取文字", note: "本機筆記內容" }[file.type] || "檔案文字";
            const mdContent = `# MochiClass 本機文字備援傳輸大綱\n\n* **原始檔名**: \`${file.name}\`\n* **檔案類型**: ${fileTypeLabel}\n* **建立時間**: ${formatDate(file.lastModified)}\n\n---\n\n### 內容大綱：\n${file.sourceText}`;
            const mdFilename = file.name.replace(/\.[^/.]+$/, "") + "_文字備援.md";
            fileToUpload = new File([mdContent], mdFilename, { type: "text/markdown; charset=utf-8" });
            console.log(`成功將已損毀或缺損的檔案 [${file.name}] 降級為 MD 文字檔 [${mdFilename}] 上傳！`);
          } else {
            // 如果既損毀又沒有提取出任何文字，我們就上傳一個提示檔，以免整個同步流程卡住崩潰
            const mdContent = `# MochiClass 損毀檔案提示\n\n* **原始檔名**: \`${file.name}\`\n* **提示**: 該檔案因使用者本機 C: 碟空間嚴重不足（低於 53MB），導致 Chrome 的 IndexedDB 二進位實體 Blob 寫入失敗而損毀，且背景文字識別未完成。`;
            const mdFilename = file.name.replace(/\.[^/.]+$/, "") + "_無法讀取提示.md";
            fileToUpload = new File([mdContent], mdFilename, { type: "text/markdown; charset=utf-8" });
          }
        }
        
        const form = new FormData();
        form.append("file", fileToUpload);
        const uploaded = await apiFetch(`/api/upload?directory_id=${encodeURIComponent(directoryId)}`, { method: "POST", body: form });
        file.vaultFileId = uploaded.file_id;
        file.uploadStatus = "api";
        uploadedNames.push(`${file.name} (${uploaded.file_id.slice(0, 8)})`);
        showBackgroundStatus(`已上傳到 VaultSage：${file.name} (${uploaded.file_id.slice(0, 8)})`);
      }
    }
    showBackgroundStatus(`已完成 VaultSage 同步：${uploadedNames.length} 份檔案。`);
  } catch (error) {
    showBackgroundStatus(`同步失敗：${error.message}`);
    answerBox.textContent = `VaultSage 同步失敗：${error.message}`;
  }
  render();
}

async function syncSelectedCourseToApi() {
  const course = courseById(state.selectedCourseId);
  if (!course) {
    answerBox.textContent = "請先建立課表並選擇一門課，再同步到 API。";
    return;
  }
  const files = state.files.filter((file) => file.courseId === course.id);
  if (!files.length) {
    answerBox.textContent = "這堂課目前沒有檔案可以同步。";
    return;
  }
  await syncFilesToApi(files);
}

// 🌟 點擊整個上傳區域（含 + 號與文字空白處）都能觸發選擇檔案
document.querySelector("#dropZone").addEventListener("click", (e) => {
  // 避免重複點擊按鈕觸發二次
  if (e.target.id === "pickFilesButton") return;
  fileInput.click();
});
document.querySelectorAll(".lang-switcher button").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});
viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchView(button.dataset.view, true);
    persistStateSoon();
  });
});
checkApiButton.addEventListener("click", () => {
  checkApiStatus().then(() => {
    answerBox.textContent = state.apiReady ? "API 已連線。" : "API 尚未連線，請檢查後端環境變數。";
  });
});
document.querySelector("#syncCourseButton").addEventListener("click", () => {
  syncSelectedCourseToApi().catch((error) => {
    answerBox.textContent = `同步失敗：${error.message}`;
  });
});
document.querySelector("#downloadMediaButton").addEventListener("click", () => {
  downloadSelectedCourseMediaZip().catch((error) => {
    answerBox.textContent = `ZIP 打包失敗：${error.message}`;
  });
});
document.querySelector("#clearButton").addEventListener("click", () => {
  releaseFilePreviews();
  state.files = [];
  answerBox.textContent = "已清空。";
  render();
  persistStateSoon();
});

document.querySelector("#resetAllButton").addEventListener("click", async () => {
  releaseFilePreviews();
  state.schedule = defaultSchedule;
  state.files = [];
  state.selectedCourseId = null;
  state.activeType = "all";
  activeView = "schedule";
  scheduleTextInput.value = defaultScheduleText;
  state.chatHistories = {};
  state.chatIds = {};
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SCHEDULE_CACHE_KEY);
  await clearFileRecords();
  answerBox.textContent = "已重新開始，課表、檔案與本機快取都已清除。API key 由後端環境變數管理，不會存在前端。";
  scheduleStatus.textContent = "可直接貼上整段課表，按「AI 解析課表」。";
  render();
  switchView("schedule", false);
  await checkApiStatus();
});

previewCloseButton.addEventListener("click", closePreview);
previewModal.querySelector("[data-close-preview]").addEventListener("click", closePreview);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && previewModal.classList.contains("is-open")) {
    closePreview();
  }
});

fileInput.addEventListener("change", () => {
  addFiles(fileInput.files).catch((error) => {
    answerBox.textContent = `加入檔案失敗：${error.message}`;
  });
});

const dropZone = document.querySelector("#dropZone");
dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragging");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragging");
  addFiles(event.dataTransfer.files).catch((error) => {
    answerBox.textContent = `加入檔案失敗：${error.message}`;
  });
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    state.activeType = tab.dataset.type;
    renderCourseDetail();
  });
});

document.querySelector("#applyScheduleButton").addEventListener("click", applyScheduleText);
document.querySelector("#askForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#questionInput");
  const question = input.value.trim();
  if (!question) return;
  
  const course = courseById(state.selectedCourseId);
  if (!course) {
    answerBox.textContent = "請先貼上課表並解析，選擇一門課後再開始問答。";
    return;
  }
  const courseFilesRaw = state.files.filter((file) => file.courseId === course.id);
  
  // 問答前做最後防線去重，杜絕發送給 AI 的 Context 出現任何重複檔
  const courseFiles = [];
  const seenCourseFileNames = new Set();
  for (const file of courseFilesRaw) {
    if (!seenCourseFileNames.has(file.name)) {
      seenCourseFileNames.add(file.name);
      courseFiles.push(file);
    }
  }

  if (!state.chatHistories[course.id]) {
    state.chatHistories[course.id] = [];
  }
  state.chatHistories[course.id].push({ role: "user", content: question });
  state.chatHistories[course.id].push({ role: "assistant", content: "正在檢查這堂課的圖片 OCR 與檔案內容，請稍候...", isLoading: true });
  renderChatHistory(course.id);
  input.value = "";

  await ensureCourseFileText(courseFiles, course.id);
  const vaultFileIds = courseFiles.filter((file) => file.vaultFileId).map((file) => file.vaultFileId);
  
  // 對單一檔案的識別內容/逐字稿進行安全截斷，防止 Token 膨脹
  const localTexts = courseFiles.filter((file) => file.sourceText).map((file) => {
    const text = file.sourceText || "";
    const truncatedText = text.length > 2000
      ? text.slice(0, 2000) + "\n... (內容過長已安全截斷) ..."
      : text;
    return `【${file.name} 的識別內容/逐字稿】：\n${truncatedText}`;
  });
  const filesWithoutText = courseFiles
    .filter((file) => file.type === "image" && !file.sourceText)
    .map((file) => file.name);
  
  if (state.apiReady) {
    let payload = {
      question: `問題：${question}`,
      file_ids: vaultFileIds
    };
    
    // 如果存在連續對話 sessionId (chat_id)，在 payload 中帶上，使 AI 自動關聯前文！
    if (state.chatIds[course.id]) {
      payload.chat_id = state.chatIds[course.id];
    }
    
    // 對總體 Context 進行 8000 字的安全長度限制，徹底避免 AI 返回空值 EMPTY_AI_OUTPUT
    const missingTextBlock = filesWithoutText.length
      ? `【尚未取得 OCR 文字的圖片，不能推測內容】：\n${filesWithoutText.map((name) => `- ${name}`).join("\n")}`
      : "";
    let contextStr = [...localTexts, missingTextBlock].filter(Boolean).join("\n\n");
    if (contextStr.length > 8000) {
      contextStr = contextStr.slice(0, 8000) + "\n\n... (為維護 AI 回答效能，剩餘資料內容已安全截斷) ...";
    }
    
    const responseLanguage = answerLanguageName();
    const strictGroundingRule = `回答規則：
1. 只能根據下方提供的課堂資料內容、OCR 文字、逐字稿或已上傳檔案回答。
2. 不可以自行補充沒有出現在資料中的內容，也不可以用一般學科知識瞎猜。
3. 如果資料不足、OCR 沒有辨識到、或問題要求的內容不在資料內，請直接說「目前資料不足，無法根據上傳檔案判斷」。
4. 回答時請簡短說明你依據了哪些檔案。
5. 請使用 ${responseLanguage} 回答。`;

    // 如果檔案還沒有同步上傳至 VaultSage，我們直接將本機提取的真實 OCR 文字與語音轉文字逐字稿做為 Context 併入 Prompt 傳給 LLM 進行問答！
    if (contextStr && !vaultFileIds.length) {
      payload.question = `請使用 ${responseLanguage} 回答「${course.title}」這堂課的問題。\n\n${strictGroundingRule}\n\n=== 課堂資料內容 ===\n${contextStr}\n\n=== 使用者發問 ===\n問題：${question}`;
    } else if (contextStr && vaultFileIds.length) {
      payload.question = `請使用 ${responseLanguage} 回答「${course.title}」這堂課的問題。\n\n${strictGroundingRule}\n\n=== 本機已辨識出的課堂資料內容 ===\n${contextStr}\n\n=== 使用者發問 ===\n問題：${question}`;
    } else {
      payload.question = `請使用 ${responseLanguage} 回答「${course.title}」這堂課的問題。\n\n${strictGroundingRule}\n\n目前前端沒有可用的 OCR 文字或逐字稿，只能依據已上傳到 VaultSage 的檔案檢索結果回答。若檢索不到明確內容，請回答資料不足。\n\n問題：${question}`;
    }
    
    apiFetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((result) => {
      // 儲存最新的 chat_id，讓下一輪問答自動關聯！
      if (result.chat_id) {
        state.chatIds[course.id] = result.chat_id;
      }
      
      const history = state.chatHistories[course.id];
      const loadingMsg = history.find((msg) => msg.role === "assistant" && msg.isLoading);
      if (loadingMsg) {
        loadingMsg.content = result.answer || "API 沒有回傳答案。";
        loadingMsg.isLoading = false;
      }
      renderChatHistory(course.id);
      persistStateSoon();
    }).catch((error) => {
      const history = state.chatHistories[course.id];
      const loadingMsg = history.find((msg) => msg.role === "assistant" && msg.isLoading);
      if (loadingMsg) {
        loadingMsg.content = `API 問答失敗，先用本機整理：\n\n${summarizeSelectedCourse(question)}\n\n錯誤：${error.message}`;
        loadingMsg.isLoading = false;
      }
      renderChatHistory(course.id);
      persistStateSoon();
    });
  } else {
    // API 未連線，落入本機備援 Q&A
    const history = state.chatHistories[course.id];
    const loadingMsg = history.find((msg) => msg.role === "assistant" && msg.isLoading);
    if (loadingMsg) {
      loadingMsg.content = summarizeSelectedCourse(question);
      loadingMsg.isLoading = false;
    }
    renderChatHistory(course.id);
    persistStateSoon();
  }
});

// 🌟 Markdown 簡易解析器
function parseMarkdown(text) {
  if (!text) return "";
  let html = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Headers ###, ##, #
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

  // Bullet lists
  html = html.replace(/^[-\*] (.*?)$/gm, "<li>$1</li>");
  
  // Wrap list items in <ul>
  html = html.replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>");
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  // Paragraph splits
  html = html.split(/\n\n+/).map(p => {
    p = p.trim();
    if (!p) return "";
    if (p.startsWith("<h") || p.startsWith("<ul") || p.startsWith("<li")) return p;
    return `<p>${p.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");

  return html;
}

let currentAnswerText = "";
function showAnswer(text, isMarkdown = true) {
  currentAnswerText = text;
  const copyBtn = document.querySelector("#copyAnswerButton");
  if (!text || !isMarkdown) {
    if (copyBtn) copyBtn.style.display = "none";
    answerBox.textContent = text || "";
  } else {
    if (copyBtn) copyBtn.style.display = "flex";
    answerBox.innerHTML = parseMarkdown(text);
  }
}

function showBackgroundStatus(text) {
  if (workStatus) {
    workStatus.textContent = text;
  }
}

// 複製按鈕事件綁定
document.querySelector("#copyAnswerButton").addEventListener("click", () => {
  if (!currentAnswerText) return;
  navigator.clipboard.writeText(currentAnswerText).then(() => {
    const btn = document.querySelector("#copyAnswerButton");
    btn.classList.add("copied");
    btn.innerHTML = `<span>✓</span> 已複製`;
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.innerHTML = `<span class="copy-icon">📋</span> 複製`;
    }, 2000);
  }).catch((err) => {
    console.error("Clipboard copy failed:", err);
  });
});

async function boot() {
  await restoreState();
  applyTranslations();
  render();
  switchView(activeView, false);
  await checkApiStatus();
  const restoredWithoutText = state.files.filter((file) => (
    file.sourceFile
    && !file.sourceText
    && ["image", "document", "audio", "note"].includes(file.type)
  ));
  if (restoredWithoutText.length) {
    queueTextProcessing(restoredWithoutText, { syncAfter: true });
  }
  applyTranslations();
}

boot().catch((error) => {
  scheduleTextInput.value = defaultScheduleText;
  answerBox.textContent = `初始化失敗：${error.message}`;
  render();
  checkApiStatus();
});

