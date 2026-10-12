const services = window.services || [];
const announcements = window.announcements || [];
const fixedAnnouncements = window.fixedAnnouncements || [];
const galleryItems = window.galleryItems || [];
const cairoHealthOffices = window.cairoHealthOffices || [];
const cairoHospitals = window.cairoHospitals || {};
const vaccinationSchedule = window.vaccinationSchedule || [];

const serviceByName = new Map(services.map(service => [service.name, service]));
const cairoHealthOfficeById = new Map();
const cairoHospitalById = new Map();
const globalSearchTargets = new Map();
const splash = document.getElementById("splash");
const readerApp = document.getElementById("readerApp");
const menuPanel = document.getElementById("menuPanel");
const assistantPanel = document.getElementById("assistantPanel");
const servicesGrid = document.getElementById("servicesGrid");
const globalServiceSearch = document.getElementById("globalServiceSearch");
const globalSearchResults = document.getElementById("globalSearchResults");
const globalSearchClear = document.getElementById("globalSearchClear");
const chatArea = document.getElementById("chatArea");
const inputGroup = document.getElementById("inputGroup");
const userInput = document.getElementById("userInput");
const assistantInputGroup = document.getElementById("assistantInputGroup");
const assistantUserInput = document.getElementById("assistantUserInput");
const assistantSendBtn = document.getElementById("assistantSendBtn");
const assistantFab = document.getElementById("assistantFab");
const ticker = document.getElementById("ticker");
const galleryStrip = document.getElementById("galleryStrip");
const galleryTrack = document.getElementById("galleryTrack");
const clockTime = document.getElementById("clockTime");
const clockDate = document.getElementById("clockDate");
const onlineNowCount = document.getElementById("onlineNowCount");
const todayUsersCount = document.getElementById("todayUsersCount");
const totalUsersCount = document.getElementById("totalUsersCount");
const homeButton = document.getElementById("homeButton");
const seniorModeToggle = document.getElementById("seniorModeToggle");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const modalImageTitle = document.getElementById("modalImageTitle");
const imageStage = document.getElementById("imageStage");
const installPrompt = document.getElementById("installPrompt");
const installNowBtn = document.getElementById("installNowBtn");
const installLaterBtn = document.getElementById("installLaterBtn");
const introAudioFab = document.getElementById("introAudioFab");
const introAudioFabIcon = introAudioFab?.querySelector(".intro-audio-fab-icon");
const introAudioFabLabel = introAudioFab?.querySelector(".intro-audio-fab-label");
const officeModal = document.getElementById("officeModal");
const officeModalName = document.getElementById("officeModalName");
const officeModalArea = document.getElementById("officeModalArea");
const officeModalAddress = document.getElementById("officeModalAddress");
const officeModalMap = document.getElementById("officeModalMap");
const officeModalHeading = document.getElementById("officeModalHeading");
const officeModalIcon = document.getElementById("officeModalIcon");
const officeModalKicker = document.getElementById("officeModalKicker");
const officeModalPhoneWrap = document.getElementById("officeModalPhoneWrap");
const officeModalPhone = document.getElementById("officeModalPhone");
const officeModalNote = document.querySelector(".office-modal-note");
const officeFavoriteBtn = document.getElementById("officeFavoriteBtn");
const vaccineModal = document.getElementById("vaccineModal");
const vaccineModalIcon = document.getElementById("vaccineModalIcon");
const vaccineModalLabel = document.getElementById("vaccineModalLabel");
const vaccineModalAge = document.getElementById("vaccineModalAge");
const vaccineModalList = document.getElementById("vaccineModalList");
const assistantToolModal = document.getElementById("assistantToolModal");
const assistantToolContent = document.getElementById("assistantToolContent");
const personalAssistantStatus = document.getElementById("personalAssistantStatus");
const voiceInputButtons = [...document.querySelectorAll("[data-voice-input]")];

let imageScale = 1;
let imageRotation = 0;
let imageOffset = { x: 0, y: 0 };
let imageDrag = null;
let imageSwipe = null;
let currentGalleryIndex = 0;
let modalPointers = new Map();
let pinchStart = null;
let galleryDrag = null;
let galleryAutoFrame = null;
let galleryPausedUntil = 0;
let tickerAutoFrame = null;
let deferredInstallPrompt = null;
let currentAudio = null;
let currentAudioTarget = null;
let currentSpeechTarget = null;
let assistantHistoryActive = false;
let imageHistoryActive = false;
let ignoreNextPopState = false;
let introAudioPlaying = false;
let selectedOffice = null;
let backTransitionTimer = 0;

const INSTALL_PROMPT_DELAY = 12000;
const INTRO_AUDIO_SRC = "assets/audio/00 المقدمة.mp3";
const STATS_START_DATE = new Date("2026-06-20T00:00:00");
const STATS_STEP_MS = 60 * 60 * 1000;
const STATS_STEP_VALUE = 3;
const arabicNumberFormatter = new Intl.NumberFormat("ar-EG");
const STORAGE_KEYS = {
    favoriteOffice: "healthAssistantFavoriteOffice",
    vaccineBirthDate: "healthAssistantVaccineBirthDate",
    vaccineHistory: "healthAssistantVaccineHistory",
    feedback: "healthAssistantFeedback",
    missingRequests: "healthAssistantMissingRequests",
    seniorMode: "healthAssistantSeniorMode",
    customAnnouncements: "healthAssistantCustomAnnouncements",
    journeys: "healthAssistantJourneys",
    legacyJourney: "healthAssistantActiveJourney",
    documentChecklist: "healthAssistantDocumentChecklist"
};
const documentChecklists = {
    "تسجيل المواليد": ["أصل إخطار المولود", "بطاقة الرقم القومي للأب والأم", "قسيمة الزواج أو قسيمة كمبيوتر حديثة", "صورتان من كل بطاقة ومستند"],
    "تسجيل الوفيات": ["إخطار الوفاة من المستشفى أو الجهة الطبية", "بطاقة المتوفى أو شهادة ميلاد مميكنة", "بطاقة الرقم القومي للمُبلّغ", "ما يثبت صلة القرابة عند استلام الشهادة"],
    "التطعيمات": ["شهادة التطعيم أو شهادة الميلاد إن وُجدت", "معرفة عمر الطفل أو تاريخ ميلاده", "إحضار أي تقارير طبية مهمة عند الحاجة"],
    "تنمية الأسرة": ["بطاقة الرقم القومي", "استشارة الطبيبة لاختيار الوسيلة المناسبة", "أي تقارير أو وصفات طبية مرتبطة بالحالة إن وُجدت"]
};

function renderMainMenu() {
    servicesGrid.innerHTML = "";

    services
        .filter(service => service.main)
        .forEach((service, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `service-btn ${service.special ? `service-${service.special}` : ""}`.trim();
            button.dataset.service = service.name;
            button.style.setProperty("--delay", `${index * 70}ms`);
            button.innerHTML = `
                ${service.special === "emergency" ? '<span class="badge">طوارئ</span>' : ""}
                ${service.special === "insurance" ? '<span class="badge soft">مهم</span>' : ""}
                <span class="service-icon" aria-hidden="true">${service.icon}</span>
                <span>
                    <span class="service-title">${service.name}</span>
                    <span class="service-desc">${service.desc}</span>
                </span>
            `;
            servicesGrid.appendChild(button);
        });
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function showGlobalSearchResults(query = "") {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
        hideGlobalSearchResults();
        return;
    }

    const matchesQuery = value => normalize(value).includes(normalizedQuery);
    const serviceMatches = services.filter(service => matchesQuery(`${service.name} ${service.desc} ${(service.keywords || []).join(" ")} ${String(service.msg || "").replace(/<[^>]*>/g, " ")}`));
    const officeRecords = cairoHealthOffices.flatMap(area => area.offices.map(([name, address]) => ({ name, address, area: area.area, kind: "office" })));
    const officeMatches = officeRecords.filter(office => matchesQuery(`${office.name} ${office.address} ${office.area}`));
    const hospitalRecords = Object.entries(cairoHospitals).flatMap(([area, hospitals]) => hospitals.map(hospital => ({ ...hospital, area, kind: "hospital" })));
    const hospitalMatches = hospitalRecords.filter(hospital => matchesQuery(`${hospital.name} ${hospital.address} ${hospital.area} ${hospital.category || ""}`));
    const matchingOfficeKeys = new Set(officeMatches.map(office => `${office.area}|${office.name}`));
    const relatedOfficeKeys = new Set();
    const relatedOffices = hospitalMatches.flatMap(hospital => officeRecords.filter(office => {
        const key = `${office.area}|${office.name}`;
        if (office.area !== hospital.area || matchingOfficeKeys.has(key) || relatedOfficeKeys.has(key)) return false;
        relatedOfficeKeys.add(key);
        return true;
    }).map(office => ({ ...office, relatedToHospital: hospital.name })));
    const preferOffices = /مكتب|صحة|دمرداش/.test(normalizedQuery);
    const searchResults = [
        ...(preferOffices ? officeMatches : hospitalMatches),
        ...serviceMatches,
        ...(preferOffices ? hospitalMatches : officeMatches),
        ...relatedOffices
    ].slice(0, 14);

    globalSearchTargets.clear();
    const resultMarkup = searchResults.map((result, index) => {
        const id = `result-${index}`;
        globalSearchTargets.set(id, result);
        const icon = result.kind === "hospital" ? "🏥" : result.kind === "office" ? "🏢" : result.icon;
        const detail = result.kind === "hospital"
            ? `${result.category || "مستشفى"} · منطقة ${result.area}`
            : result.kind === "office"
                ? `${result.relatedToHospital ? `مكتب صحة بالمنطقة، وليس بالضرورة تابعًا إداريًا لـ${result.relatedToHospital} · ` : "مكتب صحة · "}${result.area}`
                : result.desc;
        return `<button class="global-search-result" type="button" data-global-search-target="${id}"><span aria-hidden="true">${icon}</span><span><strong>${escapeHtml(result.name)}</strong><small>${escapeHtml(detail)}</small></span><span class="global-search-result-arrow" aria-hidden="true">‹</span></button>`;
    }).join("");
    globalSearchResults.innerHTML = searchResults.length
        ? `<p class="global-search-heading">${searchResults.length} نتيجة من الموقع</p>${resultMarkup}`
        : `<p class="global-search-empty">مفيش نتيجة مطابقة. جرّب اسم خدمة أو مكتب أو مستشفى.</p>`;
    globalSearchResults.classList.remove("hidden");
    globalSearchClear.classList.toggle("hidden", !globalServiceSearch.value);
    requestAnimationFrame(() => globalSearchResults.classList.add("is-open"));
}

function hideGlobalSearchResults() {
    globalSearchResults.classList.remove("is-open");
    window.setTimeout(() => {
        if (!globalSearchResults.classList.contains("is-open")) globalSearchResults.classList.add("hidden");
    }, 260);
}

function shuffleItems(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function renderTicker() {
    const customAnnouncements = readStoredJson(STORAGE_KEYS.customAnnouncements, []).map(item => item.text).filter(Boolean);
    const shuffled = shuffleItems(announcements);
    const selected = [...customAnnouncements, ...fixedAnnouncements, ...shuffled.slice(0, Math.min(7, shuffled.length))];
    const items = selected.map((text, index) => `<span class="ticker-item ${index < fixedAnnouncements.length ? "is-fixed" : ""}">${text}</span>`).join("");
    ticker.innerHTML = `<div class="ticker-track">${items}${items}${items}${items}${items}${items}</div>`;
    startTickerAutoScroll();
}

function startTickerAutoScroll() {
    cancelAnimationFrame(tickerAutoFrame);
    const track = ticker.firstElementChild;
    const resetPoint = track ? track.scrollWidth / 2 : 0;
    ticker.scrollLeft = resetPoint;

    const move = () => {
        if (track) {
            ticker.scrollLeft -= 0.75;
            if (ticker.scrollLeft <= 0) ticker.scrollLeft = resetPoint;
        }
        tickerAutoFrame = requestAnimationFrame(move);
    };

    tickerAutoFrame = requestAnimationFrame(move);
}

function renderGallery() {
    if (!galleryItems.length) return;

    const cards = galleryItems.map((item, index) => `
        <button class="gallery-card" type="button" data-gallery-index="${index}" data-gallery-src="${item.src}" data-gallery-title="${item.title}" data-gallery-alt="${item.alt}">
            <img src="${item.src}" alt="${item.alt}">
            <span>${item.title}</span>
        </button>
    `).join("");

    galleryTrack.innerHTML = `${cards}${cards}${cards}${cards}${cards}${cards}`;
    startGalleryAutoScroll();
}

function startGalleryAutoScroll() {
    cancelAnimationFrame(galleryAutoFrame);
    const move = () => {
        if (!galleryStrip.classList.contains("is-dragging") && Date.now() >= galleryPausedUntil) {
            galleryStrip.scrollLeft += 0.55;
            const limit = galleryTrack.scrollWidth / 2;
            if (galleryStrip.scrollLeft >= limit) galleryStrip.scrollLeft = 0;
        }
        galleryAutoFrame = requestAnimationFrame(move);
    };
    galleryAutoFrame = requestAnimationFrame(move);
}

function pauseGalleryAutoScroll(delay = 3000) {
    galleryPausedUntil = Date.now() + delay;
}

function renderHospitalsIntro() {
    const areaButtons = cairoHealthOffices.map(({ area }, index) =>
        `<button class="option-btn area-choice" type="button" data-medical-area="${area}" style="--reveal-delay:${index * 34}ms">${area}</button>`
    ).join("");
    return `
        <span class="response-title">📍 مستشفيات وجهات علاجية حسب المنطقة</span>
        اختار منطقتك لعرض الجهات المتاحة في الدليل. البيانات المنشورة لا تعني بالضرورة تبعية المستشفى لمكتب صحة بعينه.<br><br>
        <div class="hospital-area-grid">${areaButtons}</div>
    `;
}

function renderCairoHealthOffices() {
    cairoHealthOfficeById.clear();
    let officeId = 0;
    const areas = cairoHealthOffices.map(area => {
        const officeButtons = area.offices.map(([name, address]) => {
            const id = String(officeId++);
            cairoHealthOfficeById.set(id, { name, address, area: area.area });
            return `<button class="office-name-button" type="button" data-office-id="${id}">${name}</button>`;
        }).join("");

        return `
            <details class="office-area" data-office-area>
                <summary>${area.area}<span>${area.offices.length} مكاتب</span></summary>
                <div class="office-name-list">${officeButtons}</div>
            </details>
        `;
    }).join("");

    const officeCount = cairoHealthOffices.reduce((total, area) => total + area.offices.length, 0);
    return `
        <span class="response-title">🏢 جميع مكاتب الصحة بالقاهرة</span>
        <p class="office-directory-intro">اكتب اسم المكتب أو المنطقة، أو افتح المنطقة ثم اضغط على اسم المكتب لعرض عنوانه وموقعه.</p>
        <label class="office-search-label" for="officeSearch">ابحث عن مكتب أو منطقة</label>
        <input id="officeSearch" class="office-search-input" type="search" placeholder="مثال: العباسية أو مدينة نصر" autocomplete="off">
        <p id="officeSearchStatus" class="office-search-status">${officeCount} مكتبًا في ${cairoHealthOffices.length} منطقة</p>
        <div id="officeDirectory" class="office-directory">${areas}</div>
        <p class="office-source-note">العناوين مرجعية؛ يُفضّل التأكد من المكتب قبل التوجه إليه.</p>
    `;
}

function filterCairoHealthOffices(query) {
    const normalizedQuery = normalize(query);
    let visibleCount = 0;

    document.querySelectorAll("[data-office-area]").forEach(areaElement => {
        let areaHasMatch = false;
        areaElement.querySelectorAll("[data-office-id]").forEach(button => {
            const office = cairoHealthOfficeById.get(button.dataset.officeId);
            const searchText = normalize(`${office?.name || ""} ${office?.address || ""} ${office?.area || ""}`);
            const isMatch = !normalizedQuery || searchText.includes(normalizedQuery);
            button.classList.toggle("hidden", !isMatch);
            if (isMatch) {
                areaHasMatch = true;
                visibleCount++;
            }
        });
        areaElement.classList.toggle("hidden", !areaHasMatch);
        areaElement.open = Boolean(normalizedQuery && areaHasMatch);
    });

    const status = document.getElementById("officeSearchStatus");
    if (status) {
        status.textContent = normalizedQuery
            ? `${visibleCount} نتيجة مطابقة`
            : `${visibleCount} مكتبًا في ${cairoHealthOffices.length} منطقة`;
    }
}

function getOfficeMapUrl(office) {
    const query = `${office.name}، ${office.address}، ${office.area}، القاهرة`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function openOfficeModal(office) {
    if (!office || !officeModal) return;
    const isHospital = office.kind === "hospital";
    selectedOffice = isHospital ? null : office;
    officeModalHeading.textContent = isHospital ? "دليل الجهات العلاجية" : "دليل مكاتب الصحة";
    officeModalIcon.textContent = isHospital ? "🏥" : "🏢";
    officeModalKicker.textContent = isHospital ? office.category || "جهة علاجية" : "مكتب الصحة";
    officeModalName.textContent = office.name;
    officeModalArea.textContent = office.area;
    officeModalAddress.textContent = office.address;
    officeModalPhoneWrap.classList.toggle("hidden", !isHospital || !office.phone);
    if (isHospital && office.phone) {
        officeModalPhone.textContent = office.phone;
        officeModalPhone.href = `tel:${office.phone.split(/[–-]/)[0].replace(/[^0-9+]/g, "")}`;
    }
    officeModalMap.href = getOfficeMapUrl(office);
    officeFavoriteBtn.classList.toggle("hidden", isHospital);
    officeModalNote.textContent = isHospital ? "بيانات مرجعية من دليل وزارة الصحة؛ يُرجى التأكد من الجهة قبل التوجه." : "يُفضّل التأكد من المكتب قبل التوجه إليه.";
    if (!isHospital) updateOfficeFavoriteButton();
    if (officeModal.classList.contains("hidden")) history.pushState({ appModal: "office" }, "", location.href);
    officeModal.classList.remove("hidden");
    document.body.classList.add("office-modal-open");
    officeModal.querySelector(".office-modal-close")?.focus();
}

function closeOfficeModal(fromHistory = false) {
    const wasOpen = officeModal && !officeModal.classList.contains("hidden");
    officeModal?.classList.add("hidden");
    document.body.classList.remove("office-modal-open");
    if (wasOpen && !fromHistory) { ignoreNextPopState = true; history.back(); }
}

function readStoredJson(key, fallback) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function readJourneys() {
    const journeys = readStoredJson(STORAGE_KEYS.journeys, null);
    if (journeys && typeof journeys === "object" && !Array.isArray(journeys)) return journeys;
    const legacy = readStoredJson(STORAGE_KEYS.legacyJourney, null);
    if (legacy?.service) {
        const migrated = { [legacy.service]: legacy };
        localStorage.setItem(STORAGE_KEYS.journeys, JSON.stringify(migrated));
        localStorage.removeItem(STORAGE_KEYS.legacyJourney);
        return migrated;
    }
    return {};
}
function getFavoriteOffice() { return readStoredJson(STORAGE_KEYS.favoriteOffice, null); }
function sameOffice(first, second) { return Boolean(first && second && first.name === second.name && first.address === second.address); }
function updateOfficeFavoriteButton() {
    if (!officeFavoriteBtn) return;
    const isFavorite = sameOffice(getFavoriteOffice(), selectedOffice);
    officeFavoriteBtn.classList.toggle("is-favorite", isFavorite);
    officeFavoriteBtn.innerHTML = isFavorite ? '<span aria-hidden="true">★</span> مكتبك المعتاد' : '<span aria-hidden="true">☆</span> حفظ كمكتبي المعتاد';
}
function toggleOfficeFavorite() {
    if (!selectedOffice) return;
    if (sameOffice(getFavoriteOffice(), selectedOffice)) localStorage.removeItem(STORAGE_KEYS.favoriteOffice);
    else localStorage.setItem(STORAGE_KEYS.favoriteOffice, JSON.stringify(selectedOffice));
    updateOfficeFavoriteButton(); renderPersonalAssistantStatus();
}

function getChildAgeInMonths(value) {
    const birth = new Date(`${value}T00:00:00`);
    if (Number.isNaN(birth.getTime()) || birth > new Date()) return null;
    const now = new Date(); let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) months--; return Math.max(0, months);
}
function formatArabicDate(value) { return new Intl.DateTimeFormat("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(value); }
function getNextVaccineGroup(value) {
    if (getChildAgeInMonths(value) === null) return null;
    const birth = new Date(`${value}T00:00:00`), today = new Date(); today.setHours(0,0,0,0);
    const milestones = [0,2,4,6,9,12,18];
    const index = milestones.findIndex(month => { const due = new Date(birth); due.setMonth(due.getMonth() + month); return due >= today; });
    if (index === -1) return { group: vaccinationSchedule[vaccinationSchedule.length - 1], complete: true, dueDate: null };
    const dueDate = new Date(birth); dueDate.setMonth(dueDate.getMonth() + milestones[index]);
    return { group: vaccinationSchedule[index], complete: false, dueDate };
}
function renderPersonalAssistantStatus() {
    if (!personalAssistantStatus) return;
    const favorite = getFavoriteOffice(), birthDate = localStorage.getItem(STORAGE_KEYS.vaccineBirthDate), next = birthDate ? getNextVaccineGroup(birthDate) : null;
    const parts = [];
    if (favorite) parts.push(`<button type="button" data-tool="favorite-office">★ مكتبك: ${favorite.name}</button>`);
    if (next?.group) parts.push(`<button type="button" data-tool="reminder">🛡️ ${next.complete ? "آخر جرعة مسجلة" : `التطعيم التالي: ${next.group.age}`}</button>`);
    Object.values(readJourneys()).forEach(journey => {
        if (journey?.service) parts.push(`<button type="button" data-action="resume-journey" data-journey-service="${journey.service}">🧭 استكمل: ${journey.service}</button>`);
    });
    if (!navigator.onLine) parts.push('<span class="offline-status" role="status">أنت غير متصل؛ الخدمات الأساسية المحفوظة متاحة، وقد تحتاج الروابط الخارجية للإنترنت.</span>');
    personalAssistantStatus.innerHTML = parts.join(""); personalAssistantStatus.classList.toggle("hidden", !parts.length);
}
function openAssistantTool(content) { if (!assistantToolModal || !assistantToolContent) return; if (assistantToolModal.classList.contains("hidden")) history.pushState({ appModal: "assistantTool" }, "", location.href); assistantToolContent.innerHTML = content; assistantToolModal.classList.remove("hidden"); document.body.classList.add("assistant-tool-open"); assistantToolModal.querySelector("button, input")?.focus(); }
function closeAssistantTool(fromHistory = false) { const wasOpen = assistantToolModal && !assistantToolModal.classList.contains("hidden"); assistantToolModal?.classList.add("hidden"); document.body.classList.remove("assistant-tool-open"); if (wasOpen && !fromHistory) { ignoreNextPopState = true; history.back(); } }
function getJourneyItems(serviceName) {
    const documents = documentChecklists[serviceName] || [];
    return [
        `راجعت معلومات خدمة ${serviceName}`,
        ...documents.map(document => `جهّزت: ${document}`),
        "حددت مكتب الصحة المختص بمنطقتك",
        "تأكدت من المستندات والمواعيد قبل التوجه"
    ];
}
function renderJourneyTool(serviceName) {
    const journeys = readJourneys();
    const journey = journeys[serviceName] || (!serviceName ? Object.values(journeys)[0] : null);
    if (!journey?.service) return;
    const items = getJourneyItems(journey.service), done = new Set(journey.done || []);
    const completed = items.filter((_, index) => done.has(index)).length;
    const checklist = items.map((item, index) => `<label class="journey-step"><input type="checkbox" data-journey-step="${index}" data-journey-service="${journey.service}" ${done.has(index) ? "checked" : ""}><span>${item}</span></label>`).join("");
    openAssistantTool(`<div class="tool-hero"><span>🧭</span><h2 id="assistantToolModalTitle">رحلتك: ${journey.service}</h2></div><p>كمّل الخطوات براحتك؛ تقدمك محفوظ على هذا الجهاز.</p><div class="journey-progress"><div><span>إنجاز الرحلة</span><strong id="journeyProgressCount" aria-live="polite">${completed} من ${items.length}</strong></div><div class="journey-progress-track"><span id="journeyProgressBar" style="width:${Math.round(completed / items.length * 100)}%"></span></div></div><div class="journey-checklist">${checklist}</div><p class="tool-privacy-note">المعلومات إرشادية وقد تتغير الإجراءات؛ تأكد من المكتب المختص قبل التوجه. تقدمك محفوظ على جهازك فقط.</p><button class="tool-primary-button" type="button" data-action="find-nearby">اعرف أقرب مكتب صحة</button><button class="tool-secondary-button" type="button" data-action="open-office-directory">افتح دليل مكاتب الصحة</button><button class="tool-secondary-button" type="button" data-action="share-journey">مشاركة خطوات الرحلة</button><button class="tool-secondary-button" type="button" data-action="print-checklist">طباعة الخطوات</button><button class="tool-secondary-button journey-clear-button" type="button" data-action="clear-journey">مسح الرحلة المحفوظة</button><button class="tool-secondary-button" type="button" data-action="clear-local-data">مسح البيانات المحفوظة على الجهاز</button>`);
}
function startJourney(serviceName) {
    const journeys = readJourneys();
    const journey = journeys[serviceName] || { service: serviceName, done: [], updatedAt: new Date().toISOString() };
    journeys[serviceName] = journey;
    localStorage.setItem(STORAGE_KEYS.journeys, JSON.stringify(journeys));
    renderPersonalAssistantStatus();
    renderJourneyTool(serviceName);
}
function updateJourneyProgress(input) {
    const journeys = readJourneys();
    const journey = journeys[input.dataset.journeyService];
    if (!journey?.service) return;
    const done = new Set(journey.done || []), index = Number(input.dataset.journeyStep);
    if (input.checked) done.add(index); else done.delete(index);
    journey.done = [...done];
    journey.updatedAt = new Date().toISOString();
    journeys[journey.service] = journey;
    localStorage.setItem(STORAGE_KEYS.journeys, JSON.stringify(journeys));
    const total = getJourneyItems(journey.service).length;
    const completed = journey.done.length;
    const count = document.getElementById("journeyProgressCount"), bar = document.getElementById("journeyProgressBar");
    if (count) count.textContent = `${completed} من ${total}`;
    if (bar) bar.style.width = `${Math.round(completed / total * 100)}%`;
    renderPersonalAssistantStatus();
}
function clearJourney() {
    if (!window.confirm("هل تريد مسح تقدم الرحلة المحفوظ؟")) return;
    const journeys = readJourneys();
    const serviceName = assistantToolContent.querySelector("[data-journey-step]")?.dataset.journeyService;
    if (serviceName) delete journeys[serviceName];
    localStorage.setItem(STORAGE_KEYS.journeys, JSON.stringify(journeys));
    renderPersonalAssistantStatus();
    closeAssistantTool();
}
function clearLocalHealthData() {
    if (!window.confirm("سيتم حذف رحلتك وقوائمك المحفوظة والمكتب المفضل وتذكير التطعيم والطلبات المسجلة على هذا الجهاز. هل تريد المتابعة؟")) return;
    [STORAGE_KEYS.journeys, STORAGE_KEYS.legacyJourney, STORAGE_KEYS.documentChecklist, STORAGE_KEYS.favoriteOffice, STORAGE_KEYS.vaccineBirthDate, STORAGE_KEYS.vaccineHistory, STORAGE_KEYS.feedback, STORAGE_KEYS.missingRequests].forEach(key => localStorage.removeItem(key));
    renderPersonalAssistantStatus();
    openAssistantTool('<div class="tool-hero"><span>✓</span><h2 id="assistantToolModalTitle">تم مسح البيانات المحفوظة</h2></div><p>تم حذف المعلومات المحلية التي حددتها. تفضيلات المظهر ووضع كبار السن لم تتغير.</p><button class="tool-primary-button" type="button" data-tool-close>حسنًا</button>');
}
function saveDocumentChecklist(input) {
    const serviceName = input.dataset.checklistService;
    const saved = readStoredJson(STORAGE_KEYS.documentChecklist, {});
    saved[serviceName] ||= [];
    saved[serviceName][Number(input.dataset.documentItem)] = input.checked;
    localStorage.setItem(STORAGE_KEYS.documentChecklist, JSON.stringify(saved));
}
function printAssistantTool() {
    document.body.classList.add("print-assistant-tool");
    window.print();
}
function renderNearbyTool(message = "") { openAssistantTool(`<div class="tool-hero"><span>📍</span><h2 id="assistantToolModalTitle">ابحث عن أقرب مكتب</h2></div><p>اسمح للموقع باستخدام موقعك لمرة واحدة فقط، وسنفتح بحث الخريطة حولك. لا يتم حفظ موقعك.</p><button class="tool-primary-button" type="button" data-action="find-nearby">تحديد موقعي والبحث</button><p class="tool-privacy-note">يمكنك أيضًا استخدام دليل جميع مكاتب الصحة واختيار منطقتك يدويًا.</p>${message ? `<p class="tool-inline-note">${message}</p>` : ""}`); }
function findNearbyOffice() {
    if (!navigator.geolocation) return renderNearbyTool("الموقع الجغرافي غير متاح على هذا الجهاز.");
    navigator.geolocation.getCurrentPosition(position => {
        const mapUrl = `https://www.google.com/maps/search/مكتب+صحة/@${position.coords.latitude},${position.coords.longitude},14z`;
        openAssistantTool(`<div class="tool-hero"><span>✓</span><h2 id="assistantToolModalTitle">تم تحديد المنطقة</h2></div><p>افتح الخريطة الآن لعرض مكاتب الصحة القريبة من موقعك واختيار الأنسب.</p><a class="tool-primary-button" href="${mapUrl}" target="_blank" rel="noopener noreferrer">فتح المكاتب القريبة على الخريطة</a><button class="tool-secondary-button" type="button" data-action="open-office-directory">تصفح الدليل داخل المنصة</button><p class="tool-privacy-note">لم يتم حفظ موقعك.</p>`);
    }, () => renderNearbyTool("لم يتم السماح بالموقع. يمكنك استخدام الدليل اليدوي بسهولة."), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
}
function renderDocumentsTool(serviceName = "") {
    const selected = documentChecklists[serviceName] ? serviceName : "", choices = Object.keys(documentChecklists).map(name => `<button type="button" class="tool-choice ${name === selected ? "is-selected" : ""}" data-doc-service="${name}">${name}</button>`).join("");
    const savedChecks = readStoredJson(STORAGE_KEYS.documentChecklist, {})[selected] || [];
    const checklist = selected ? `<div class="document-checklist"><h3>المستندات المعتادة لخدمة ${selected}</h3>${documentChecklists[selected].map((item, index) => `<label><input type="checkbox" data-document-item="${index}" data-checklist-service="${selected}" ${savedChecks[index] ? "checked" : ""}><span>${item}</span></label>`).join("")}</div><button class="tool-secondary-button" type="button" data-action="share-checklist" data-checklist-service="${selected}">مشاركة القائمة</button><button class="tool-secondary-button" type="button" data-action="print-checklist">طباعة القائمة</button><p class="tool-privacy-note">قائمة إرشادية؛ قد تختلف بعض المستندات حسب الحالة، فاستفسر من المكتب قبل التوجه. علاماتك محفوظة على هذا الجهاز فقط.</p>` : '<p class="tool-privacy-note">اختر الخدمة لتظهر لك قائمة مختصرة بما تحتاج إليه.</p>';
    openAssistantTool(`<div class="tool-hero"><span>📄</span><h2 id="assistantToolModalTitle">ماذا أحتاج؟</h2></div><p>جهّز أوراقك قبل التوجه للمكتب.</p><div class="tool-choices">${choices}</div>${checklist}<button class="tool-secondary-button" type="button" data-action="clear-local-data">مسح البيانات المحفوظة على الجهاز</button>`);
}
function renderVaccineReminder(message = "") {
    const birth = localStorage.getItem(STORAGE_KEYS.vaccineBirthDate) || "", next = birth ? getNextVaccineGroup(birth) : null;
    const history = readStoredJson(STORAGE_KEYS.vaccineHistory, {});
    const previous = birth ? history[birth] : "";
    const result = next?.group && previous === "yes" ? `<div class="vaccine-reminder-result"><span>${next.group.icon}</span><div><strong>${next.complete ? "آخر مرحلة في الجدول" : "التطعيم التالي"}</strong><p>${next.group.age} — ${next.group.label}</p>${next.dueDate ? `<p class="vaccine-due-date">التاريخ المتوقع: ${formatArabicDate(next.dueDate)}</p>` : ""}</div></div>` : birth && previous === "no" ? '<p class="tool-inline-note">خد شهادة التطعيم لأقرب مكتب صحة علشان يراجع الجرعات ويحدد المناسب لطفلك.</p>' : birth ? '<p class="tool-inline-note">جاوب على السؤال علشان نعرض لك التذكير المناسب.</p>' : "";
    const historyQuestion = birth ? `<fieldset class="vaccine-history"><legend>هل أخد طفلك كل التطعيمات اللي فاتت؟</legend><label><input type="radio" name="vaccineHistory" value="yes" ${previous === "yes" ? "checked" : ""}> أيوه، أخدها كلها</label><label><input type="radio" name="vaccineHistory" value="no" ${previous === "no" ? "checked" : ""}> لأ / مش متأكد</label></fieldset>` : "";
    openAssistantTool(`<div class="tool-hero"><span>🛡️</span><h2 id="assistantToolModalTitle">تذكير تطعيم طفلي</h2></div><p>أدخل تاريخ ميلاد الطفل علشان نعرض لك التطعيم المتوقع.</p><label class="tool-input-label" for="vaccineBirthDate">تاريخ الميلاد</label><input id="vaccineBirthDate" class="tool-date-input" type="date" max="${new Date().toISOString().slice(0,10)}" value="${birth}"><button class="tool-primary-button" type="button" data-action="save-vaccine-date">عرض التذكير</button>${historyQuestion}${result}${message ? `<p class="tool-inline-note">${message}</p>` : ""}<p class="tool-privacy-note">مواعيد التطعيمات بتختلف من مكتب للتاني. أما عينة فحص الغدة الدرقية لحديثي الولادة فتُسحب عادةً يومي السبت والثلاثاء من كل أسبوع في الوحدات الصحية بجميع المحافظات، من اليوم الثالث للسابع بعد الولادة. اتأكد من المكتب قبل ما تروح. بياناتك محفوظة على جهازك فقط.</p>`);
}
function saveVaccineReminder() { const value = document.getElementById("vaccineBirthDate")?.value; if (!value || getChildAgeInMonths(value) === null) return renderVaccineReminder("من فضلك أدخل تاريخ ميلاد صحيح."); localStorage.setItem(STORAGE_KEYS.vaccineBirthDate, value); renderPersonalAssistantStatus(); renderVaccineReminder("تم حفظ التذكير على هذا الجهاز."); }
async function shareText(title, text) { try { if (navigator.share) await navigator.share({ title, text }); else if (navigator.clipboard) { await navigator.clipboard.writeText(text); return "تم نسخ النص للمشاركة."; } return "تم فتح خيارات المشاركة."; } catch { return "لم تتم المشاركة الآن."; } }
function rememberFeedback(service, helpful) { const items = readStoredJson(STORAGE_KEYS.feedback, []); items.push({service, helpful, date:new Date().toISOString()}); localStorage.setItem(STORAGE_KEYS.feedback, JSON.stringify(items.slice(-100))); }
function rememberMissingRequest(text) { const items = readStoredJson(STORAGE_KEYS.missingRequests, []); items.push({text:text.slice(0,180), date:new Date().toISOString()}); localStorage.setItem(STORAGE_KEYS.missingRequests, JSON.stringify(items.slice(-100))); }
function applySeniorMode(enabled) { document.documentElement.classList.toggle("senior-mode", enabled); seniorModeToggle?.classList.toggle("is-active", enabled); seniorModeToggle?.setAttribute("aria-pressed", String(enabled)); seniorModeToggle?.setAttribute("aria-label", enabled ? "إيقاف تكبير الخط" : "تكبير الخط"); }
function initSeniorMode() { applySeniorMode(localStorage.getItem(STORAGE_KEYS.seniorMode) === "true"); }
function initVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "ar-EG";
    recognition.continuous = false;
    recognition.interimResults = false;
    let activeInputId = "";
    voiceInputButtons.forEach(button => {
        button.classList.remove("hidden");
        button.addEventListener("click", () => {
            if (button.classList.contains("is-listening")) {
                recognition.stop();
                return;
            }
            activeInputId = button.dataset.voiceInput;
            try {
                recognition.start();
            } catch {
                button.title = "انتظر لحظة ثم حاول استخدام الميكروفون مرة أخرى.";
            }
        });
    });
    recognition.onstart = () => voiceInputButtons.forEach(button => button.classList.toggle("is-listening", button.dataset.voiceInput === activeInputId));
    recognition.onresult = event => {
        const input = document.getElementById(activeInputId);
        if (!input) return;
        input.value = event.results[0][0].transcript;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
    };
    recognition.onerror = event => {
        const button = voiceInputButtons.find(item => item.dataset.voiceInput === activeInputId);
        if (button && event.error !== "aborted" && event.error !== "no-speech") button.title = "تعذر استخدام الميكروفون؛ تحقق من الإذن أو اكتب سؤالك.";
    };
    recognition.onend = () => voiceInputButtons.forEach(button => button.classList.remove("is-listening"));
}

function renderVaccinationGuide() {
    const cards = vaccinationSchedule.map((group, index) => `
        <button class="vaccine-age-card vaccine-${group.accent}" type="button" data-vaccine-age="${index}" style="--vaccine-delay:${index * 70}ms">
            <span class="vaccine-age-icon" aria-hidden="true">${group.icon}</span>
            <span class="vaccine-age-content">
                <span class="vaccine-age-label">${group.label}</span>
                <strong>${group.age}</strong>
                <small>${group.vaccines.length} تطعيمات - اضغط للتفاصيل</small>
            </span>
            <span class="vaccine-age-arrow" aria-hidden="true">‹</span>
        </button>
    `).join("");

    return `
        <span class="response-title">💉 جدول تطعيمات الطفل</span>
        <p class="vaccines-guide-intro">اختار عمر طفلك، وستظهر لك التطعيمات المطلوبة وطريقة إعطاء كل واحد منها بشكل بسيط.</p>
        <div class="vaccines-timeline" aria-hidden="true"><span></span></div>
        <div class="vaccines-age-grid">${cards}</div>
        <p class="vaccines-guide-note">اضغط على الكارت ثم افتح اسم التطعيم الذي تريد معرفة تفاصيله.</p>
    `;
}

function showVaccinationGuide() {
    enterAssistantMode();
    chatArea.innerHTML = "";
    assistantInputGroup.classList.add("hidden");
    addMessage(renderVaccinationGuide(), "bot", "service-response response-vaccines", { hideSpeak: true });
}

function openVaccineModal(group) {
    if (!group || !vaccineModal) return;

    vaccineModalIcon.textContent = group.icon;
    vaccineModalLabel.textContent = group.label;
    vaccineModalAge.textContent = group.age;
    vaccineModalList.innerHTML = group.vaccines.map((vaccine, index) => `
        <details class="vaccine-detail" ${index === 0 ? "open" : ""}>
            <summary>
                <span class="vaccine-detail-mark">${index + 1}</span>
                <span><strong>${vaccine.short}</strong><small>${vaccine.name}</small></span>
                <span class="vaccine-detail-toggle" aria-hidden="true">⌄</span>
            </summary>
            <div class="vaccine-detail-body">
                <div><span>يحمي من</span><p>${vaccine.protects}</p></div>
                <div><span>الكمية</span><p>${vaccine.dose}</p></div>
                <div><span>طريقة الإعطاء</span><p>${vaccine.method}</p></div>
            </div>
        </details>
    `).join("");
    if (vaccineModal.classList.contains("hidden")) history.pushState({ appModal: "vaccine" }, "", location.href);
    vaccineModal.classList.remove("hidden");
    document.body.classList.add("vaccine-modal-open");
    vaccineModal.querySelector(".vaccine-modal-back")?.focus();
}

function closeVaccineModal(fromHistory = false) {
    const wasOpen = vaccineModal && !vaccineModal.classList.contains("hidden");
    vaccineModal?.classList.add("hidden");
    document.body.classList.remove("vaccine-modal-open");
    if (wasOpen && !fromHistory) { ignoreNextPopState = true; history.back(); }
}

function renderWailyHospitals() {
    const area = window.selectedHospitalArea || "الوايلي";
    const hospitals = cairoHospitals[area] || [];
    return `<span class="response-title">📍 ${area}</span>
        ${hospitals.length ? `<div class="hospital-scope-note">بيانات منشورة من أدلة وزارة الصحة، والمستشفى ليس بالضرورة تابعًا إداريًا لمكتب صحة المنطقة.</div>${renderHospitalList(hospitals, area)}<div class="hospital-source-links"><a href="https://www.mohp.gov.eg/DynamicPages.aspx?page_id=63" target="_blank" rel="noopener noreferrer">دليل المستشفيات العامة</a><a href="https://www.mohp.gov.eg/DynamicPages.aspx?page_id=61" target="_blank" rel="noopener noreferrer">دليل المستشفيات التخصصية</a><a href="https://www.mohp.gov.eg/DynamicPages.aspx?page_id=59" target="_blank" rel="noopener noreferrer">دليل المستشفيات التعليمية</a><a href="https://www.mohp.gov.eg/DynamicPages.aspx?page_id=66" target="_blank" rel="noopener noreferrer">دليل مستشفيات الحميات</a></div>` : `<div class="hospital-update-note"><strong>تحديث بيانات المنطقة</strong><span>لم تتوفر لدينا حاليًا بيانات مستشفيات موثقة لهذه المنطقة. سنضيفها بعد مراجعة مصدر رسمي.</span></div>`}`;
}

function renderHospitalList(items, area) {
    cairoHospitalById.clear();
    return `
        <div class="hospital-list">
            ${items.map((hospital, index) => {
                const id = String(index);
                cairoHospitalById.set(id, { ...hospital, area, kind: "hospital" });
                const { name, address, category, source } = hospital;
                return `
                <article class="hospital-item" style="--reveal-delay:${index * 90}ms">
                    <div class="hospital-item-heading"><span aria-hidden="true">🏥</span><div><strong>${name}</strong><small>${category} · ${source}</small></div></div>
                    <div class="hospital-detail-field"><small>العنوان</small><span>${address}</span></div>
                    <button class="office-map-button hospital-detail-button" type="button" data-hospital-id="${id}">عرض التفاصيل <span aria-hidden="true">↗</span></button>
                </article>
            `;
            }).join("")}
        </div>
    `;
}

function renderEmergencyGuide() {
    const cards = [
        {
            title: "مكتب صحة النزهة - ميدان المحكمة",
            area: "منطقة النزهة",
            time: "المواعيد من 6 مساءا حتى 6 صباحا",
            map: "https://maps.app.goo.gl/dBLANWrF7vWqJsvB7"
        },
        {
            title: "مكتب صحة الخبيري - المعادي",
            area: "منطقة المعادي",
            time: "المواعيد من 6 مساءا حتى 6 صباحا",
            map: "https://maps.app.goo.gl/THU14A1hNoa1q3nJ8"
        },
        {
            title: "مكتب صحة التجمع الخامس - القاهرة الجديدة",
            area: "القاهرة الجديدة",
            time: "المواعيد من 6 مساءا حتى 6 صباحا",
            map: "https://maps.app.goo.gl/JmGRnm5rnVYYD7787"
        }
    ];

    return `
        <span class="response-title">🚨 دليلك في الإجازات والطوارئ</span>
        في أوقات الإجازات والعطلات الرسمية، ممكن تحتاج خدمة صحية مهمة ومش عارف تروح فين.<br><br>
        علشان كده وفرنالك دليل بسيط وواضح يساعدك توصل لأقرب مكان يقدم لك الخدمة بدون تعب أو تأخير.<br><br>
        كل مكتب يخدم منطقته في ساعات العمل الرسمية طوال أيام الأسبوع، وبعد مواعيد العمل الرسمية يعمل كمكتب طوارئ حسب المواعيد الموضحة.<br><br>
        اختار المكان المناسب من الكروت اللي تحت واضغط على زر الاتجاهات.

        <div class="emergency-card-grid">
            ${cards.map((card, index) => `
                <article class="emergency-card" style="--delay:${index * 90}ms">
                    <span class="emergency-card-badge">طوارئ</span>
                    <strong>${card.title}</strong>
                    <small>${card.area}</small>
                    <p>يخدم منطقته في ساعات العمل الرسمية جميع أيام الأسبوع.</p>
                    <p>بعد مواعيد العمل الرسمية يعمل كمكتب طوارئ.</p>
                    <b>${card.time}</b>
                    <a class="map-action" href="${card.map}" target="_blank" rel="noopener noreferrer">افتح الاتجاهات</a>
                </article>
            `).join("")}
        </div>
    `;
}

function updateModalImage() {
    modalImage.style.transform = `translate(${imageOffset.x}px, ${imageOffset.y}px) rotate(${imageRotation}deg) scale(${imageScale})`;
}

function openImageModal(source, title, alt, index = 0) {
    currentGalleryIndex = index;
    imageScale = 1;
    imageRotation = 0;
    imageOffset = { x: 0, y: 0 };
    imageSwipe = null;
    modalPointers.clear();
    pinchStart = null;
    modalImage.src = source;
    modalImage.alt = alt;
    modalImage.classList.remove("image-arrive");
    void modalImage.offsetWidth;
    modalImage.classList.add("image-arrive");
    if (modalImageTitle) modalImageTitle.textContent = title;
    updateModalImage();
    imageModal.classList.remove("hidden");
    if (!imageHistoryActive) {
        history.pushState({ imageModal: true }, "", location.href);
        imageHistoryActive = true;
    }
}

function openGalleryIndex(index) {
    if (!galleryItems.length) return;
    const total = galleryItems.length;
    const safeIndex = (index + total) % total;
    const item = galleryItems[safeIndex];
    openImageModal(item.src, item.title, item.alt, safeIndex);
}

function closeImageModal(fromHistory = false) {
    imageModal.classList.add("hidden");
    imageDrag = null;
    imageSwipe = null;
    if (imageHistoryActive) {
        imageHistoryActive = false;
        if (!fromHistory) {
            ignoreNextPopState = true;
            history.back();
        }
    }
}

function changeZoom(change) {
    imageScale = Math.min(3.2, Math.max(0.7, imageScale + change));
    updateModalImage();
}

function normalize(text) {
    if (!text) return "";
    return text
        .toLowerCase()
        .replace(/[^\u0600-\u06FF\s]/g, "")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/أ|إ|آ/g, "ا")
        .trim();
}

function similarity(a, b) {
    let matches = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] === b[i]) matches++;
    }
    return matches / Math.max(a.length, b.length);
}

function detectServices(text) {
    const normText = normalize(text);
    if (!normText) return [];

    const results = [];

    if (["جمعه", "عيد", "اجازه", "طوارئ"].some(word => normText.includes(word))) {
        results.push({ name: "خدمات الطوارئ", score: 150 });
    }

    services.forEach(service => {
        let score = 0;
        let hasExactMatch = false;

        service.keywords.forEach(keyword => {
            const normKey = normalize(keyword);

            if (normText.includes(normKey)) {
                score += 100;
                hasExactMatch = true;
            }

            if (!hasExactMatch) {
                normText.split(" ").forEach(word => {
                    if (word.length >= 4 && similarity(word, normKey) > 0.85) {
                        score += 10;
                    }
                });
            }
        });

        if (score > 0) {
            const existing = results.find(result => result.name === service.name);
            if (existing) existing.score += score;
            else results.push({ name: service.name, score });
        }
    });

    results.sort((a, b) => b.score - a.score);

    if (results.length > 1) {
        const topScore = results[0].score;
        return results.filter(result => result.score >= topScore * 0.5);
    }

    return results;
}

function getExtraIntro(serviceName, originalText) {
    if (serviceName === "اعرفني" || !originalText) return "";

    const norm = normalize(originalText);
    if (norm.includes("ازاي") || norm.includes("ورق")) return "📄 <b>بخصوص الأوراق والخطوات:</b><br>";
    if (norm.includes("فين") || norm.includes("عنوان") || norm.includes("مكان")) return "📍 <b>بخصوص المكان والموقع:</b><br>";
    if (norm.includes("امتي") || norm.includes("مواعيد") || norm.includes("وقت")) return "⏰ <b>بخصوص المواعيد:</b><br>";
    return "";
}

function enterAssistantMode() {
    const wasOpen = document.body.classList.contains("assistant-open");
    document.body.classList.add("assistant-open");
    menuPanel.classList.add("hidden");
    assistantPanel.classList.remove("hidden");
    if (!wasOpen && !assistantHistoryActive) {
        history.pushState({ assistant: true }, "", location.href);
        assistantHistoryActive = true;
    }
    assistantPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function backToServices(fromHistory = false) {
    window.speechSynthesis?.cancel();
    stopCurrentAudio();
    window.clearTimeout(backTransitionTimer);
    assistantPanel.classList.add("is-leaving");
    backTransitionTimer = window.setTimeout(() => {
        document.body.classList.remove("assistant-open");
        assistantPanel.classList.remove("is-leaving");
        assistantPanel.classList.add("hidden");
        menuPanel.classList.remove("hidden");
        menuPanel.classList.add("is-returning");
        chatArea.innerHTML = "";
        inputGroup.classList.add("hidden");
        assistantInputGroup.classList.add("hidden");
        userInput.value = "";
        assistantUserInput.value = "";
        menuPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => menuPanel.classList.remove("is-returning"), 720);
        if (assistantHistoryActive) {
            assistantHistoryActive = false;
            if (!fromHistory) history.back();
        }
    }, 180);
}

function navigateHome() {
    let historySteps = 0;
    if (assistantToolModal && !assistantToolModal.classList.contains("hidden")) { closeAssistantTool(true); historySteps++; }
    if (vaccineModal && !vaccineModal.classList.contains("hidden")) { closeVaccineModal(true); historySteps++; }
    if (officeModal && !officeModal.classList.contains("hidden")) { closeOfficeModal(true); historySteps++; }
    if (!imageModal.classList.contains("hidden")) { closeImageModal(true); historySteps++; }
    if (document.body.classList.contains("assistant-open")) {
        const hadAssistantHistory = assistantHistoryActive;
        backToServices(true);
        if (hadAssistantHistory) historySteps++;
        assistantHistoryActive = false;
    }
    if (historySteps) history.go(-historySteps);
    else window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectService(serviceName, originalText = "", addUserChoice = true, resetChat = true) {
    const service = serviceByName.get(serviceName);
    if (!service) return;

    enterAssistantMode();
    if (resetChat) {
        chatArea.innerHTML = "";
        assistantInputGroup.classList.add("hidden");
    }

    if (addUserChoice) addMessage(service.name, "user");

    showTyping();
    setTimeout(() => {
        removeTyping();

        if (service.customView === "hospitals") {
            addMessage(renderHospitalsIntro(), "bot", "service-response response-hospitals", { hideSpeak: true });
            return;
        }

        if (service.customView === "offices") {
            addMessage(renderCairoHealthOffices(), "bot", "service-response response-offices", { hideSpeak: true });
            return;
        }

        if (service.customView === "emergency") {
            addMessage(renderEmergencyGuide(), "bot", "service-response response-emergency", {
                audio: service.media?.audio || "",
                typewriter: true
            });
            return;
        }

        let response = `<span class="response-title">${service.icon} ${service.name}</span>`;
        response += `${getExtraIntro(service.name, originalText)}${service.msg}`;

        if (service.interactiveGuide === "vaccines") {
            response += '<button class="btn-link interactive-guide-btn" type="button" data-action="vaccines-guide" aria-label="عرض المزيد: جدول تطعيمات الطفل">عرض المزيد</button>';
        } else if (service.showMore !== false && service.tutorial) {
            response += `<a href="${service.tutorial}" target="_blank" rel="noopener noreferrer" class="btn-link">عرض المزيد</a>`;
        } else if (service.link) {
            response += `<a href="${service.link}" target="_blank" rel="noopener noreferrer" class="btn-link">عرض المزيد</a>`;
        }

        response += `<button class="journey-start-button" type="button" data-action="open-journey" data-journey-service="${service.name}">🧭 ابدأ رحلتك خطوة بخطوة</button><div class="service-utility-actions"><button type="button" data-action="share-service" data-service-name="${service.name}">↗ مشاركة الخدمة</button><button type="button" data-action="service-feedback" data-service-name="${service.name}" data-helpful="yes">✓ أفادني</button><button type="button" data-action="service-feedback" data-service-name="${service.name}" data-helpful="no">أحتاج توضيحًا</button></div>`;

        addMessage(response, "bot", `service-response ${service.special ? `response-${service.special}` : ""}`, {
            audio: service.media?.audio || "",
            typewriter: true
        });
    }, 4100);
}

function getAssistantWelcome() {
    const shortcuts = services.filter(service => service.main).slice(0, 8).map(service =>
        `<button class="assistant-shortcut" type="button" data-quick-service="${service.name}"><span aria-hidden="true">${service.icon}</span>${service.name}</button>`
    ).join("");
    return `<div class="assistant-welcome"><strong>أهلاً بيك 🤍</strong><p>اختار اللي محتاجه، وأنا هساعدك خطوة بخطوة:</p><div class="assistant-shortcuts">${shortcuts}</div><button class="assistant-test-input" type="button" data-action="show-text-input">✍️ اكتب سؤالك بنفسك (للتجربة)</button></div>`;
}

function addMessage(text, type, extraClass = "", options = {}) {
    const div = document.createElement("div");
    div.className = `msg ${type === "user" ? "user-msg" : "bot-msg"} ${extraClass}`.trim();
    if (type === "user") div.textContent = text;
    else div.innerHTML = text;
    if (options.audio) div.dataset.audio = options.audio;

    if (type === "bot") {
        const actions = document.createElement("div");
        actions.className = "message-actions";
        actions.innerHTML = `
            <button type="button" class="message-action copy-action" aria-label="نسخ الرد"><span class="copy-glyph" aria-hidden="true"></span></button>
            ${options.hideSpeak ? "" : '<button type="button" class="message-action speak-action" aria-label="سماع الرد">🔊</button>'}
        `;
        div.appendChild(actions);
    }

    chatArea.appendChild(div);
    if (options.typewriter) typeMessageContent(div);
    div.scrollIntoView({ behavior: "smooth", block: "end" });
}

function typeMessageContent(message) {
    const walker = document.createTreeWalker(message, NodeFilter.SHOW_TEXT, {
        acceptNode(node) { return node.parentElement?.closest(".message-actions") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    const entries = [];
    let totalCharacters = 0;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const characters = Array.from(node.nodeValue || "");
        if (!characters.length) continue;
        entries.push({ node, characters });
        totalCharacters += characters.length;
        node.nodeValue = "";
    }
    if (!totalCharacters) return;
    const delay = Math.max(7, Math.min(24, 4800 / totalCharacters));
    let entryIndex = 0;
    let characterIndex = 0;
    const typeNext = () => {
        if (!message.isConnected) return;
        const entry = entries[entryIndex];
        entry.node.nodeValue += entry.characters[characterIndex++];
        if (characterIndex >= entry.characters.length) { entryIndex++; characterIndex = 0; }
        if (entryIndex < entries.length) window.setTimeout(typeNext, delay);
    };
    typeNext();
}

function showTyping() {
    removeTyping();
    const div = document.createElement("div");
    div.id = "typing";
    div.className = "msg bot-msg typing";
    div.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatArea.appendChild(div);
    div.scrollIntoView({ behavior: "smooth", block: "end" });
}

function removeTyping() {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();
}

function showContact() {
    addMessage(`
        <span class="response-title">طرق التواصل</span>
        المطور: باســم<br>
        <a href="https://wa.me/201021708011" target="_blank" rel="noopener noreferrer" class="btn-link">WhatsApp: 01021708011</a>
        <a href="mailto:Dokyy2@gmail.com" class="btn-link">Email: Dokyy2@gmail.com</a>
    `, "bot", "notice-msg");
}

async function copyMessage(message) {
    const clone = message.cloneNode(true);
    clone.querySelector(".message-actions")?.remove();
    const text = clone.innerText.trim();

    try {
        await navigator.clipboard.writeText(text);
        const copyButton = message.querySelector(".copy-action");
        copyButton?.classList.add("is-copied");
        setTimeout(() => copyButton?.classList.remove("is-copied"), 1500);
        showTinyFeedback(message, "تم النسخ");
    } catch {
        showTinyFeedback(message, "تعذر النسخ");
    }
}

function speakMessage(message) {
    const audioSrc = message.dataset.audio;
    if (audioSrc) {
        if (currentAudioTarget === message && currentAudio && !currentAudio.paused) { stopCurrentAudio(); return; }
        playAudioFile(audioSrc, message);
        return;
    }

    if (!("speechSynthesis" in window)) {
        showTinyFeedback(message, "الصوت غير مدعوم");
        return;
    }

    const clone = message.cloneNode(true);
    clone.querySelector(".message-actions")?.remove();
    const text = cleanSpeechText(clone.innerText.trim());
    if (!text) {
        showTinyFeedback(message, "لا يوجد نص للقراءة");
        return;
    }
    if (currentSpeechTarget === message && window.speechSynthesis.speaking) { stopCurrentAudio(); return; }
    stopCurrentAudio();

    const utterance = new SpeechSynthesisUtterance(text);
    const egyptianVoice = getArabicVoice();
    if (egyptianVoice) utterance.voice = egyptianVoice;
    else showTinyFeedback(message, "ثبّت صوت عربي من إعدادات ويندوز");
    utterance.lang = egyptianVoice?.lang || "ar-EG";
    utterance.rate = 0.9;
    currentSpeechTarget = message;
    setSpeakButtonState(message, true);
    utterance.onend = () => { currentSpeechTarget = null; setSpeakButtonState(message, false); };
    utterance.onerror = () => { currentSpeechTarget = null; setSpeakButtonState(message, false); };
    window.speechSynthesis.speak(utterance);
    showTinyFeedback(message, "جاري القراءة");
}

function playAudioFile(source, feedbackTarget = null) {
    stopCurrentAudio();

    currentAudio = new Audio(source);
    currentAudioTarget = feedbackTarget;
    if (feedbackTarget) setSpeakButtonState(feedbackTarget, true);
    currentAudio.preload = "auto";
    currentAudio.onended = () => {
        currentAudio = null;
        currentAudioTarget = null;
        if (feedbackTarget) setSpeakButtonState(feedbackTarget, false);
    };
    currentAudio.onerror = () => {
        if (feedbackTarget) showTinyFeedback(feedbackTarget, "تعذر تشغيل الصوت");
        currentAudio = null;
        currentAudioTarget = null;
        if (feedbackTarget) setSpeakButtonState(feedbackTarget, false);
    };

    const playPromise = currentAudio.play();
    if (playPromise?.catch) {
        playPromise
            .then(() => {
                if (feedbackTarget) showTinyFeedback(feedbackTarget, "جاري تشغيل الصوت");
            })
            .catch(() => {
                if (feedbackTarget) showTinyFeedback(feedbackTarget, "اضغط مرة أخرى لتشغيل الصوت");
            });
    } else if (feedbackTarget) {
        showTinyFeedback(feedbackTarget, "جاري تشغيل الصوت");
    }
}

function stopCurrentAudio() {
    const previousAudioTarget = currentAudioTarget;
    const previousSpeechTarget = currentSpeechTarget;
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    currentAudioTarget = null;
    currentSpeechTarget = null;
    if (previousAudioTarget) setSpeakButtonState(previousAudioTarget, false);
    if (previousSpeechTarget) setSpeakButtonState(previousSpeechTarget, false);
    if (introAudioPlaying) setIntroAudioFabState(false);
    window.speechSynthesis?.cancel();
}

function setSpeakButtonState(message, isPlaying) {
    const button = message?.querySelector(".speak-action");
    if (!button) return;
    button.textContent = isPlaying ? "■" : "🔊";
    button.setAttribute("aria-label", isPlaying ? "إيقاف الرد الصوتي" : "سماع الرد");
    button.classList.toggle("is-playing", isPlaying);
}

function getArabicVoice() {
    if (!("speechSynthesis" in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    return voices.find(voice => voice.lang.toLowerCase() === "ar-eg")
        || voices.find(voice => voice.lang.toLowerCase().startsWith("ar"));
}

function setIntroAudioFabState(playing) {
    introAudioPlaying = playing;
    introAudioFab?.classList.toggle("is-playing", playing);
    introAudioFab?.setAttribute("aria-label", playing ? "إيقاف الشرح الصوتي" : "اسمعني أشرحلك");
    if (introAudioFabIcon) introAudioFabIcon.textContent = playing ? "■" : "🔊";
    if (introAudioFabLabel) introAudioFabLabel.textContent = playing ? "إيقاف الشرح" : "اسمعني أشرحلك";
}

function playIntroAudio() {
    if (introAudioPlaying) { stopCurrentAudio(); return; }
    stopCurrentAudio();
    currentAudio = new Audio(INTRO_AUDIO_SRC);
    currentAudio.preload = "auto";
    currentAudio.onended = () => { currentAudio = null; setIntroAudioFabState(false); };
    currentAudio.onerror = () => { currentAudio = null; setIntroAudioFabState(false); };
    setIntroAudioFabState(true);
    currentAudio.play().catch(() => setIntroAudioFabState(false));
}

function cleanSpeechText(text) {
    return text
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/WhatsApp|Email/gi, "")
        .replace(/\s+/g, " ")
        .trim();
}

function showTinyFeedback(message, text) {
    const old = message.querySelector(".tiny-feedback");
    if (old) old.remove();

    const feedback = document.createElement("span");
    feedback.className = "tiny-feedback";
    feedback.textContent = text;
    message.appendChild(feedback);
    setTimeout(() => feedback.remove(), 1400);
}

function updateClock() {
    if (!clockTime || !clockDate) return;
    const now = new Date();
    clockTime.textContent = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    clockDate.textContent = now.toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
}

function updateAudienceStats() {
    if (!onlineNowCount || !todayUsersCount || !totalUsersCount) return;

    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayNumber = Math.max(0, Math.floor((todayStart - STATS_START_DATE) / (24 * 60 * 60 * 1000)));
        const currentStep = Math.floor((now - todayStart) / STATS_STEP_MS);
        const increment = currentStep * STATS_STEP_VALUE;
        const totalSteps = Math.max(0, Math.floor((now - STATS_START_DATE) / STATS_STEP_MS));

        const onlineNow = 2 + ((currentStep + dayNumber) % 3);
        const todayUsers = 6 + increment;
        const totalUsers = 350 + (totalSteps * STATS_STEP_VALUE);

        if (![onlineNow, todayUsers, totalUsers].every(Number.isFinite)) {
            throw new Error("Stats unavailable");
        }

        setStatText(onlineNowCount, arabicNumberFormatter.format(onlineNow));
        setStatText(todayUsersCount, arabicNumberFormatter.format(todayUsers));
        setStatText(totalUsersCount, arabicNumberFormatter.format(totalUsers));
    } catch {
        setStatText(onlineNowCount, "—");
        setStatText(todayUsersCount, "—");
        setStatText(totalUsersCount, "—");
    }
}

function setStatText(element, value) {
    if (!element || element.textContent === value) return;

    element.classList.add("is-changing");
    window.setTimeout(() => {
        element.textContent = value;
        element.classList.remove("is-changing");
    }, 160);
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#071522" : "#1769d1");
    localStorage.setItem("healthAssistantTheme", theme);
}

function initTheme() {
    const savedTheme = localStorage.getItem("healthAssistantTheme") || "dark";
    applyTheme(savedTheme);
}

function finishSplash() {
    splash.classList.add("is-closing");
    readerApp.classList.remove("is-loading");
    window.setTimeout(() => splash.classList.add("is-hidden"), 850);
    scheduleInstallPrompt();
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;

    navigator.serviceWorker.register("./sw.js").catch(() => {
        // The app still works normally if offline caching is unavailable.
    });
}

function initScrollMotion() {
    const targets = document.querySelectorAll([
        ".hero",
        ".global-search",
        ".news-panel",
        ".audience-stats",
        ".calm-separator",
        ".menu-panel",
        ".service-btn",
        ".smart-tool",
        ".gallery-divider",
        ".gallery-strip"
    ].join(","));

    if (!targets.length) return;

    targets.forEach(target => target.classList.add("scroll-motion"));

    if (!("IntersectionObserver" in window)) {
        targets.forEach(target => target.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("is-visible");
            else if (entry.target.matches(".service-btn, .smart-tool")) entry.target.classList.remove("is-visible");
        });
    }, {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12
    });

    targets.forEach(target => observer.observe(target));
}

function isAppInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function shouldShowInstallPrompt() {
    return Boolean(deferredInstallPrompt && !isAppInstalled());
}

function scheduleInstallPrompt() {
    window.setTimeout(() => {
        if (shouldShowInstallPrompt()) showInstallPrompt();
    }, INSTALL_PROMPT_DELAY);
}

function showInstallPrompt() {
    installPrompt?.classList.remove("hidden");
    installNowBtn?.focus();
}

function hideInstallPrompt() {
    installPrompt?.classList.add("hidden");
}

// AI API integration. This intentionally keeps API calls outside the UI code and
// renders model output as plain text, never as HTML.
let aiConversation = [];

function startTextAssistant() {
    enterAssistantMode();
    chatArea.innerHTML = "";
    aiConversation = [];
    assistantInputGroup.classList.add("hidden");

    showTyping();
    setTimeout(() => {
        removeTyping();
        addMessage(getAssistantWelcome(), "bot", "notice-msg");
    }, 300);
}

function quickSend(text) {
    addMessage(text, "user");
    respondToUser(text);
}

function handleSend() {
    const activeInput = assistantInputGroup.classList.contains("hidden") ? userInput : assistantUserInput;
    const text = activeInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    activeInput.value = "";
    respondToUser(text);
}

async function respondToUser(text) {
    showTyping();

    try {
        const reply = await window.healthAssistantApi?.askAssistant(text, aiConversation);
        await new Promise(resolve => setTimeout(resolve, 3000));
        removeTyping();
        addPlainAssistantMessage(reply);
        aiConversation.push({ role: "user", content: text }, { role: "assistant", content: reply });
        aiConversation = aiConversation.slice(-10);
    } catch (error) {
        console.warn("AI assistant unavailable; using local service matching.", error);
        if (detectServices(text).length === 1) {
            removeTyping();
            respondLocally(text);
        } else {
            setTimeout(() => {
                removeTyping();
                respondLocally(text);
            }, 3000);
        }
    }
}

function respondLocally(text) {
    const matches = detectServices(text);
    if (matches.length > 1) {
        let html = "Found more than one relevant service. Choose the service you need:<br>";
        matches.forEach(match => {
            const service = serviceByName.get(match.name);
            html += `<button class="option-btn" type="button" data-service="${match.name}">${service.icon} ${match.name}</button>`;
        });
        addMessage(html, "bot");
    } else if (matches.length === 1) {
        selectService(matches[0].name, text, false, false);
    } else {
        rememberMissingRequest(text);
        addMessage("لم أحدد الخدمة بدقة. تم تسجيل طلبك على هذا الجهاز ليساعدنا في تطوير الخدمات. جرّب وصف المطلوب بكلمات أبسط أو اختر من الخدمات الرئيسية.", "bot", "notice-msg");
    }
}

function addPlainAssistantMessage(text) {
    const div = document.createElement("div");
    div.className = "msg bot-msg ai-response";
    const responseText = document.createElement("span");
    responseText.className = "ai-response-text";
    responseText.setAttribute("aria-live", "off");
    div.appendChild(responseText);

    const caret = document.createElement("span");
    caret.className = "typing-caret";
    caret.setAttribute("aria-hidden", "true");
    div.appendChild(caret);

    const actions = document.createElement("div");
    actions.className = "message-actions";
    actions.innerHTML = `
        <button type="button" class="message-action copy-action" aria-label="Copy response"><span class="copy-glyph" aria-hidden="true"></span></button>
        <button type="button" class="message-action speak-action" aria-label="Read response">&#128266;</button>
    `;
    div.appendChild(actions);
    chatArea.appendChild(div);
    div.scrollIntoView({ behavior: "smooth", block: "end" });

    const characters = Array.from(String(text ?? ""));
    let position = 0;
    const typeNext = () => {
        if (!div.isConnected) return;
        position = Math.min(position + 1, characters.length);
        responseText.textContent = characters.slice(0, position).join("");
        if (position < characters.length) {
            window.setTimeout(typeNext, 24);
        } else {
            caret.remove();
        }
    };
    typeNext();
}

document.getElementById("showSearchBtn").addEventListener("click", startTextAssistant);
document.getElementById("heroAssistantBtn")?.addEventListener("click", startTextAssistant);
document.getElementById("sendBtn").addEventListener("click", handleSend);
assistantSendBtn.addEventListener("click", handleSend);
assistantFab.addEventListener("click", startTextAssistant);
document.getElementById("backToServicesBtn").addEventListener("click", backToServices);
document.getElementById("floatingBackBtn").addEventListener("click", backToServices);
servicesGrid.addEventListener("click", event => {
    const serviceButton = event.target.closest("[data-service]");
    if (!serviceButton) return;

    event.preventDefault();
    event.stopPropagation();
    selectService(serviceButton.dataset.service);
});

document.querySelectorAll(".modal-nav, .image-tools button").forEach(button => {
    button.addEventListener("pointerdown", event => {
        event.stopPropagation();
    });
});

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (!readerApp.classList.contains("is-loading")) scheduleInstallPrompt();
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    hideInstallPrompt();
});

window.addEventListener("popstate", () => {
    if (ignoreNextPopState) {
        ignoreNextPopState = false;
        return;
    }

    if (!imageModal.classList.contains("hidden")) {
        closeImageModal(true);
        return;
    }
    if (vaccineModal && !vaccineModal.classList.contains("hidden")) { closeVaccineModal(true); return; }
    if (officeModal && !officeModal.classList.contains("hidden")) { closeOfficeModal(true); return; }
    if (assistantToolModal && !assistantToolModal.classList.contains("hidden")) { closeAssistantTool(true); return; }

    if (document.body.classList.contains("assistant-open")) {
        backToServices(true);
    }
});

installNowBtn?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
        hideInstallPrompt();
        return;
    }

    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    hideInstallPrompt();
    promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
});

installLaterBtn?.addEventListener("click", () => {
    hideInstallPrompt();
});

introAudioFab?.addEventListener("click", playIntroAudio);

homeButton.addEventListener("click", navigateHome);

seniorModeToggle?.addEventListener("click", () => {
    const next = !document.documentElement.classList.contains("senior-mode");
    localStorage.setItem(STORAGE_KEYS.seniorMode, String(next));
    applySeniorMode(next);
});

userInput.addEventListener("keydown", event => {
    if (event.key === "Enter") handleSend();
});

assistantUserInput.addEventListener("keydown", event => {
    if (event.key === "Enter") handleSend();
});

document.addEventListener("click", event => {
    const globalSearchResult = event.target.closest("[data-global-search-target]");
    if (globalSearchResult) {
        const target = globalSearchTargets.get(globalSearchResult.dataset.globalSearchTarget);
        globalServiceSearch.value = "";
        globalSearchClear.classList.add("hidden");
        hideGlobalSearchResults();
        if (target?.kind === "hospital" || target?.kind === "office") openOfficeModal(target);
        else if (target) selectService(target.name);
        return;
    }
    const hospitalDetailButton = event.target.closest("[data-hospital-id]");
    if (hospitalDetailButton) {
        openOfficeModal(cairoHospitalById.get(hospitalDetailButton.dataset.hospitalId));
        return;
    }
    const smartTool = event.target.closest("[data-tool]");
    if (smartTool) {
        const tool = smartTool.dataset.tool;
        if (tool === "nearby") renderNearbyTool();
        if (tool === "documents") renderDocumentsTool();
        if (tool === "reminder") renderVaccineReminder();
        if (tool === "emergency") selectService("خدمات الطوارئ");
        if (tool === "favorite-office") { const favorite = getFavoriteOffice(); if (favorite) openOfficeModal(favorite); }
        return;
    }
    if (event.target.closest("[data-tool-close]")) { closeAssistantTool(); return; }
    if (event.target.closest("[data-action='find-nearby']")) { findNearbyOffice(); return; }
    if (event.target.closest("[data-action='open-office-directory']")) { closeAssistantTool(); selectService("جميع مكاتب الصحة بالقاهرة"); return; }
    const journeyButton = event.target.closest("[data-action='open-journey']");
    if (journeyButton) { startJourney(journeyButton.dataset.journeyService); return; }
    const resumeJourneyButton = event.target.closest("[data-action='resume-journey']");
    if (resumeJourneyButton) { renderJourneyTool(resumeJourneyButton.dataset.journeyService); return; }
    const quickService = event.target.closest("[data-quick-service]");
    if (quickService) { selectService(quickService.dataset.quickService); return; }
    if (event.target.closest("[data-action='show-text-input']")) { assistantInputGroup.classList.remove("hidden"); assistantUserInput.focus(); return; }
    if (event.target.closest("[data-action='clear-journey']")) { clearJourney(); return; }
    if (event.target.closest("[data-action='clear-local-data']")) { clearLocalHealthData(); return; }
    const shareJourneyButton = event.target.closest("[data-action='share-journey']");
    if (shareJourneyButton) {
        const journeys = readJourneys();
        const serviceName = shareJourneyButton.closest(".assistant-tool-content")?.querySelector("[data-journey-step]")?.dataset.journeyService;
        const journey = journeys[serviceName];
        const items = journey ? getJourneyItems(journey.service) : [];
        const done = new Set(journey?.done || []);
        shareText(`رحلة ${journey?.service || "الخدمة الصحية"}`, items.map((item, index) => `${done.has(index) ? "✓" : "□"} ${item}`).join("\n")).then(result => { shareJourneyButton.textContent = result; });
        return;
    }
    if (event.target.closest("[data-action='print-checklist']")) { printAssistantTool(); return; }
    const documentService = event.target.closest("[data-doc-service]");
    if (documentService) { renderDocumentsTool(documentService.dataset.docService); return; }
    if (event.target.closest("[data-action='save-vaccine-date']")) { saveVaccineReminder(); return; }
    if (event.target.closest("[data-action='toggle-office-favorite']")) { toggleOfficeFavorite(); return; }
    const shareChecklistButton = event.target.closest("[data-action='share-checklist']");
    if (shareChecklistButton) {
        const service = shareChecklistButton.dataset.checklistService;
        const checked = readStoredJson(STORAGE_KEYS.documentChecklist, {})[service] || [];
        const checklistText = documentChecklists[service].map((item, index) => `${checked[index] ? "✓" : "□"} ${item}`).join("\n");
        shareText(`مستندات ${service}`, `المستندات الإرشادية لخدمة ${service}:\n${checklistText}`).then(result => { shareChecklistButton.textContent = result; });
        return;
    }
    const shareServiceButton = event.target.closest("[data-action='share-service']");
    if (shareServiceButton) {
        const service = serviceByName.get(shareServiceButton.dataset.serviceName);
        shareText(service?.name || "الخدمة الصحية", `${service?.name || "خدمة صحية"}\n${service?.msg || ""}\n${location.href}`).then(result => { shareServiceButton.textContent = result; });
        return;
    }
    const feedbackButton = event.target.closest("[data-action='service-feedback']");
    if (feedbackButton) {
        rememberFeedback(feedbackButton.dataset.serviceName, feedbackButton.dataset.helpful === "yes");
        const actions = feedbackButton.closest(".service-utility-actions");
        if (actions) actions.innerHTML = `<span class="service-feedback-thanks">${feedbackButton.dataset.helpful === "yes" ? "شكرًا، سعداء أنها أفادتك." : "شكرًا، سنعمل على توضيحها بصورة أفضل."}</span>`;
        return;
    }

    const vaccineAgeCard = event.target.closest("[data-vaccine-age]");
    if (vaccineAgeCard) {
        openVaccineModal(vaccinationSchedule[Number(vaccineAgeCard.dataset.vaccineAge)]);
        return;
    }

    if (event.target.closest("[data-vaccine-modal-close]")) {
        closeVaccineModal();
        return;
    }

    const officeButton = event.target.closest("[data-office-id]");
    if (officeButton) {
        openOfficeModal(cairoHealthOfficeById.get(officeButton.dataset.officeId));
        return;
    }

    if (event.target.closest("[data-office-modal-close]")) {
        closeOfficeModal();
        return;
    }

    const serviceButton = event.target.closest("[data-service]");
    if (serviceButton) {
        const fromChat = Boolean(event.target.closest("#chatArea"));
        selectService(serviceButton.dataset.service, "", true, !fromChat);
        return;
    }

    const quickButton = event.target.closest("[data-quick-send]");
    if (quickButton) {
        quickSend(quickButton.dataset.quickSend);
        return;
    }

    const actionButton = event.target.closest("[data-action='contact']");
    if (actionButton) {
        showContact();
        return;
    }

    const medicalAreaButton = event.target.closest("[data-medical-area]");
    if (medicalAreaButton) {
        addMessage(medicalAreaButton.textContent.trim(), "user");
        window.selectedHospitalArea = medicalAreaButton.dataset.medicalArea;
        showTyping();
        setTimeout(() => {
            removeTyping();
            addMessage(renderWailyHospitals(), "bot", "service-response response-hospitals", { hideSpeak: true });
        }, 800);
        return;
    }

    if (event.target.closest("[data-action='vaccines-guide']")) {
        showVaccinationGuide();
        return;
    }

    const message = event.target.closest(".msg.bot-msg");
    if (event.target.closest(".copy-action") && message) {
        copyMessage(message);
        return;
    }

    if (event.target.closest(".speak-action") && message) {
        speakMessage(message);
        return;
    }
    const imageTool = event.target.closest("[data-image-tool]");
    if (imageTool) {
        const tool = imageTool.dataset.imageTool;
        if (tool === "zoom-in") changeZoom(0.25);
        if (tool === "zoom-out") changeZoom(-0.25);
        if (tool === "reset") {
            imageScale = 1;
            imageRotation = 0;
            imageOffset = { x: 0, y: 0 };
            updateModalImage();
        }
        if (tool === "rotate-left") { imageRotation -= 90; updateModalImage(); }
        if (tool === "rotate-right") { imageRotation += 90; updateModalImage(); }
        if (tool === "previous") openGalleryIndex(currentGalleryIndex - 1);
        if (tool === "next") openGalleryIndex(currentGalleryIndex + 1);
        if (tool === "close") closeImageModal();
    }
});

document.addEventListener("input", event => {
    if (event.target.id === "officeSearch") filterCairoHealthOffices(event.target.value);
    if (event.target === globalServiceSearch) {
        if (globalServiceSearch.value.trim()) showGlobalSearchResults(globalServiceSearch.value);
        else { hideGlobalSearchResults(); globalSearchClear.classList.add("hidden"); }
    }
});

globalServiceSearch.addEventListener("keydown", event => {
    if (event.key === "Enter") globalSearchResults.querySelector("[data-global-search-target]")?.click();
    if (event.key === "Escape") { globalServiceSearch.value = ""; hideGlobalSearchResults(); globalServiceSearch.blur(); }
});
globalSearchClear.addEventListener("click", () => { globalServiceSearch.value = ""; hideGlobalSearchResults(); globalSearchClear.classList.add("hidden"); globalServiceSearch.focus(); });
document.addEventListener("pointerdown", event => {
    if (!event.target.closest(".global-search")) hideGlobalSearchResults();
});

document.addEventListener("change", event => {
    const journeyInput = event.target.closest("[data-journey-step]");
    if (journeyInput) { updateJourneyProgress(journeyInput); return; }
    const vaccineHistory = event.target.closest("[name='vaccineHistory']");
    if (vaccineHistory) {
        const birthDate = localStorage.getItem(STORAGE_KEYS.vaccineBirthDate);
        if (birthDate) {
            const history = readStoredJson(STORAGE_KEYS.vaccineHistory, {});
            history[birthDate] = vaccineHistory.value;
            localStorage.setItem(STORAGE_KEYS.vaccineHistory, JSON.stringify(history));
            renderVaccineReminder();
        }
        return;
    }
    const checklistInput = event.target.closest("[data-document-item]");
    if (checklistInput) saveDocumentChecklist(checklistInput);
});

window.addEventListener("afterprint", () => document.body.classList.remove("print-assistant-tool"));
window.addEventListener("online", renderPersonalAssistantStatus);
window.addEventListener("offline", renderPersonalAssistantStatus);

imageModal.addEventListener("click", event => {
    if (event.target === imageModal) closeImageModal();
});

imageStage.addEventListener("wheel", event => {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.12 : -0.12);
}, { passive: false });

imageStage.addEventListener("pointerdown", event => {
    modalPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (modalPointers.size === 2) {
        const points = [...modalPointers.values()];
        pinchStart = { distance: getDistance(points[0], points[1]), scale: imageScale };
        imageDrag = null;
        imageSwipe = null;
    } else if (imageScale > 1) {
        imageDrag = { x: event.clientX, y: event.clientY, offsetX: imageOffset.x, offsetY: imageOffset.y };
        imageSwipe = null;
    } else {
        imageSwipe = { x: event.clientX, y: event.clientY };
    }
    imageStage.setPointerCapture(event.pointerId);
});

officeModal?.addEventListener("click", event => {
    if (event.target === officeModal) closeOfficeModal();
});

assistantToolModal?.addEventListener("click", event => {
    if (event.target === assistantToolModal) closeAssistantTool();
});

vaccineModal?.addEventListener("click", event => {
    if (event.target === vaccineModal) closeVaccineModal();
});

document.addEventListener("keydown", event => {
    if (!imageModal.classList.contains("hidden")) {
        if (event.ctrlKey && (event.key === "+" || event.key === "=" || event.key === "Add")) {
            event.preventDefault();
            changeZoom(0.25);
            return;
        }
        if (event.ctrlKey && (event.key === "-" || event.key === "_" || event.key === "Subtract")) {
            event.preventDefault();
            changeZoom(-0.25);
            return;
        }
        if (event.ctrlKey && event.key === "0") {
            event.preventDefault();
            imageScale = 1;
            imageOffset = { x: 0, y: 0 };
            updateModalImage();
            return;
        }
        if (event.key === "ArrowLeft") { event.preventDefault(); openGalleryIndex(currentGalleryIndex + 1); return; }
        if (event.key === "ArrowRight") { event.preventDefault(); openGalleryIndex(currentGalleryIndex - 1); return; }
    }
    if (event.key !== "Escape") return;
    if (!imageModal.classList.contains("hidden")) {
        closeImageModal();
        return;
    }
    if (vaccineModal && !vaccineModal.classList.contains("hidden")) {
        closeVaccineModal();
        return;
    }
    if (officeModal && !officeModal.classList.contains("hidden")) {
        closeOfficeModal();
        return;
    }
    if (assistantToolModal && !assistantToolModal.classList.contains("hidden")) {
        closeAssistantTool();
    }
});

imageStage.addEventListener("pointermove", event => {
    if (modalPointers.has(event.pointerId)) {
        modalPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (modalPointers.size === 2 && pinchStart) {
        const points = [...modalPointers.values()];
        const nextDistance = getDistance(points[0], points[1]);
        imageScale = Math.min(3.6, Math.max(0.7, pinchStart.scale * (nextDistance / pinchStart.distance)));
        updateModalImage();
        return;
    }

    if (!imageDrag) return;
    imageOffset = {
        x: imageDrag.offsetX + event.clientX - imageDrag.x,
        y: imageDrag.offsetY + event.clientY - imageDrag.y
    };
    updateModalImage();
});

imageStage.addEventListener("pointerup", event => {
    if (imageSwipe && imageScale <= 1 && modalPointers.size === 1) {
        const deltaX = event.clientX - imageSwipe.x;
        const deltaY = event.clientY - imageSwipe.y;
        if (Math.abs(deltaX) > 54 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
            openGalleryIndex(deltaX > 0 ? currentGalleryIndex + 1 : currentGalleryIndex - 1);
        }
    }
    modalPointers.delete(event.pointerId);
    pinchStart = null;
    imageDrag = null;
    imageSwipe = null;
});

imageStage.addEventListener("pointercancel", event => {
    modalPointers.delete(event.pointerId);
    pinchStart = null;
    imageDrag = null;
    imageSwipe = null;
});

function getDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

galleryStrip.addEventListener("pointerdown", event => {
    pauseGalleryAutoScroll();
    galleryStrip.classList.add("is-dragging");
    galleryDrag = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: galleryStrip.scrollLeft,
        card: event.target.closest("[data-gallery-src]"),
        moved: false
    };
    galleryStrip.setPointerCapture(event.pointerId);
});

galleryStrip.addEventListener("pointermove", event => {
    if (!galleryDrag) return;
    pauseGalleryAutoScroll();
    const deltaX = event.clientX - galleryDrag.x;
    const deltaY = event.clientY - galleryDrag.y;
    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) galleryDrag.moved = true;
    galleryStrip.scrollLeft = galleryDrag.scrollLeft - deltaX;
});

galleryStrip.addEventListener("pointerup", event => {
    pauseGalleryAutoScroll();
    const tappedCard = galleryDrag?.card && !galleryDrag.moved ? galleryDrag.card : null;
    galleryDrag = null;
    galleryStrip.classList.remove("is-dragging");
    if (galleryStrip.hasPointerCapture?.(event.pointerId)) {
        galleryStrip.releasePointerCapture(event.pointerId);
    }
    if (tappedCard) {
        openImageModal(
            tappedCard.dataset.gallerySrc,
            tappedCard.dataset.galleryTitle,
            tappedCard.dataset.galleryAlt,
            Number(tappedCard.dataset.galleryIndex || 0)
        );
    }
});

galleryStrip.addEventListener("pointercancel", event => {
    pauseGalleryAutoScroll();
    galleryDrag = null;
    galleryStrip.classList.remove("is-dragging");
    if (galleryStrip.hasPointerCapture?.(event.pointerId)) {
        galleryStrip.releasePointerCapture(event.pointerId);
    }
});

galleryStrip.addEventListener("pointerenter", () => pauseGalleryAutoScroll());
galleryStrip.addEventListener("pointerleave", () => pauseGalleryAutoScroll());

window.addEventListener("load", () => {
    initTheme();
    initSeniorMode();
    initVoiceInput();
    renderMainMenu();
    renderPersonalAssistantStatus();
    renderTicker();
    renderGallery();
    initScrollMotion();
    updateAudienceStats();
    setInterval(updateAudienceStats, 60 * 1000);
    const heroServiceText = document.getElementById("heroServiceText");
    const heroServiceDescription = document.getElementById("heroServiceDescription");
    const spotlightServices = [
        { title: "تسجيل المواليد", description: "جهّز إخطار الولادة وبطاقتي الأب والأم وقسيمة الزواج وصور المستندات." },
        { title: "قبل ما تروح تسجل مولودك", description: "راجع أصول الأوراق وصورها؛ تجهيزها من البداية يساعدك تخلّص الإجراءات بسهولة." },
        { title: "تسجيل الوفيات", description: "جهّز إخطار الوفاة ومستند هوية المتوفى وبطاقة المُبلّغ قبل التوجه للمكتب." },
        { title: "استلام شهادة الوفاة", description: "اسأل عن المستندات المطلوبة لإثبات صلة القرابة عند استلام الشهادة الأصلية." },
        { title: "تطعيمات طفلك", description: "خلي بطاقة التطعيم معاك واسأل مكتب الصحة عن مواعيد الجرعات المتاحة." },
        { title: "حافظ على جرعات طفلك", description: "تسجيل الجرعات في بطاقة التطعيم بيسهّل عليك متابعة الجرعات اللي فاتت والجاية." },
        { title: "بطاقة التطعيم ضاعت؟", description: "اسأل مكتب الصحة عن المستندات البديلة وخطوات استكمال سجل التطعيمات." },
        { title: "فحص الغدة لحديثي الولادة", description: "اسأل مكتبك عن ميعاد سحب العينة قبل ما تروح؛ المواعيد قد تختلف في التطبيق العملي." },
        { title: "تنظيم الأسرة", description: "استشارة طبية تساعدك تختار الوسيلة الأنسب لحالتك وتتابع استخدامها بأمان." },
        { title: "خصوصيتك مهمة", description: "خدمات تنظيم الأسرة بتُقدَّم بسرية واحترام، والاختيار يكون مع الطبيبة المختصة." },
        { title: "وسائل تنظيم الأسرة", description: "اسأل الطبيبة عن الوسائل المتاحة ومميزاتها ومواعيد المتابعة المناسبة ليك." },
        { title: "متابعة صحة الأم", description: "مراكز الرعاية بتقدم متابعة للأم بعد الولادة وتوعية صحية عن التغذية والرضاعة." },
        { title: "رعاية الطفل", description: "اسأل مركز الرعاية عن خدمات متابعة الطفل والتطعيمات المتوفرة في منطقتك." },
        { title: "رسوم الخدمات", description: "الرسوم بتختلف حسب نوع الخدمة؛ اتأكد من المكتب المختص قبل التوجه." },
        { title: "التأمين الصحي", description: "جهّز بطاقة الرقم القومي واسأل فرع التأمين عن الإجراء المناسب لخدمتك." },
        { title: "أقرب مكتب صحة", description: "اختار منطقتك من الدليل عشان تشوف عناوين المكاتب وموقعها على الخريطة." },
        { title: "خدمات مكاتب الصحة", description: "المواليد والوفيات والتطعيمات وتنظيم الأسرة؛ اختار الخدمة وشوف المطلوب خطوة بخطوة." },
        { title: "قبل زيارة المكتب", description: "راجع العنوان والمستندات، واسأل عن المواعيد لتوفّر وقتك ومجهودك." },
        { title: "مش متأكد من الورق؟", description: "افتح الخدمة المطلوبة، وهتلاقي قائمة مختصرة تساعدك تجهّز قبل الزيارة." },
        { title: "مراكز الرعاية الصحية", description: "اعرف أقرب مركز من دليل المنطقة، واستفسر منه عن الخدمة والرسوم المتاحة." },
        { title: "جرعة فائتة؟", description: "ما تبدأش جدول من نفسك؛ خُد بطاقة التطعيم للمكتب عشان يراجع الجرعات ويحدد الخطوة." },
        { title: "خدمة أوضح وأسهل", description: "المساعد بيرتب لك الخطوات والعناوين، والقرار النهائي حسب تعليمات المكتب المختص." }
    ];
    let spotlightQueue = [];
    let previousSpotlight = null;
    const showNextSpotlight = () => {
        if (!heroServiceText || !heroServiceDescription) return;
        if (!spotlightQueue.length) {
            spotlightQueue = [...spotlightServices];
            for (let index = spotlightQueue.length - 1; index > 0; index--) {
                const randomIndex = Math.floor(Math.random() * (index + 1));
                [spotlightQueue[index], spotlightQueue[randomIndex]] = [spotlightQueue[randomIndex], spotlightQueue[index]];
            }
            if (previousSpotlight && spotlightQueue[0] === previousSpotlight) spotlightQueue.push(spotlightQueue.shift());
        }
        const nextSpotlight = spotlightQueue.shift();
        heroServiceText.parentElement.classList.add("is-changing");
        setTimeout(() => {
            heroServiceText.textContent = nextSpotlight.title;
            heroServiceDescription.textContent = nextSpotlight.description;
            previousSpotlight = nextSpotlight;
            heroServiceText.parentElement.classList.remove("is-changing");
            const readingTime = Math.min(14000, Math.max(8500, 5000 + nextSpotlight.description.length * 65));
            setTimeout(showNextSpotlight, readingTime);
        }, 460);
    };
    setTimeout(showNextSpotlight, 9500);
    if (!history.state?.healthAssistantBase) history.pushState({ healthAssistantBase: true }, "", location.href);
    registerServiceWorker();
    setTimeout(finishSplash, 4800);
});
