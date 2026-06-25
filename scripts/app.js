const services = window.services || [];
const announcements = window.announcements || [];
const fixedAnnouncements = window.fixedAnnouncements || [];
const galleryItems = window.galleryItems || [];

const serviceByName = new Map(services.map(service => [service.name, service]));
const splash = document.getElementById("splash");
const readerApp = document.getElementById("readerApp");
const menuPanel = document.getElementById("menuPanel");
const assistantPanel = document.getElementById("assistantPanel");
const servicesGrid = document.getElementById("servicesGrid");
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
const themeToggle = document.getElementById("themeToggle");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const modalImageTitle = document.getElementById("modalImageTitle");
const imageStage = document.getElementById("imageStage");
const installPrompt = document.getElementById("installPrompt");
const installNowBtn = document.getElementById("installNowBtn");
const installLaterBtn = document.getElementById("installLaterBtn");
const introAudioPrompt = document.getElementById("introAudioPrompt");
const introPlayBtn = document.getElementById("introPlayBtn");
const introSkipBtn = document.getElementById("introSkipBtn");
const introDontShowAgain = document.getElementById("introDontShowAgain");

let imageScale = 1;
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
let assistantHistoryActive = false;
let imageHistoryActive = false;
let ignoreNextPopState = false;

const INTRO_SPEECH_DELAY = 2000;
const INSTALL_PROMPT_DELAY = 12000;
const INTRO_AUDIO_SRC = "assets/audio/00 المقدمة.mp3";
const INTRO_AUDIO_PLAYED_KEY = "healthAssistantIntroAudioPlayed";
const INTRO_AUDIO_SUPPRESS_UNTIL_KEY = "healthAssistantIntroAudioSuppressUntil";
const STATS_START_DATE = new Date("2026-06-20T00:00:00");
const STATS_STEP_MS = 60 * 60 * 1000;
const STATS_STEP_VALUE = 3;
const arabicNumberFormatter = new Intl.NumberFormat("ar-EG");

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

function shuffleItems(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function renderTicker() {
    const shuffled = shuffleItems(announcements);
    const selected = [...fixedAnnouncements, ...shuffled.slice(0, Math.min(7, shuffled.length))];
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
    return `
        <span class="response-title">📍 المناطق الطبية التابعة لمديرية الشئون الصحية بالقاهرة</span>
        اختار المنطقة الطبية المطلوبة، والمساعد هيعرض لك مكاتب الصحة والمستشفيات التابعة لمكاتب الصحة بشكل واضح.<br><br>
        <button class="option-btn area-choice" type="button" data-medical-area="waily">
            منطقة الوايلي الطبية
        </button>
    `;
}

function renderWailyHospitals() {
    return `
        <span class="response-title">منطقة الوايلي الطبية</span>

        <div class="hospital-office">
            <h3>صحة الدمرداش</h3>
            <p>المستشفيات التابعة لمكتب صحة الدمرداش</p>
            ${renderHospitalList([
                ["مستشفى الدمرداش", "56 شارع رمسيس، حي العباسية، القاهرة"],
                ["مستشفى دار الشفاء", "375 شارع رمسيس، العباسية، القاهرة"],
                ["مستشفى واحة الطب", "19 شارع مصر والسودان، امتداد أحمد سعيد، حدائق القبة، القاهرة"]
            ])}
        </div>

        <div class="hospital-office">
            <h3>صحة العباسية</h3>
            <p>المستشفيات التابعة لمكتب صحة العباسية</p>
            ${renderHospitalList([
                ["مستشفى عين شمس التخصصى", "2 شارع الخليفة المأمون، العباسية، بجوار كلية التجارة عين شمس"],
                ["مستشفى الزهراء الجامعى", "شارع المستشفى اليوناني، السرايات، الوايلي، القاهرة"],
                ["مستشفى الايطالى", "17 شارع السرايات، العباسية، القاهرة"],
                ["مستشفى اليونانى", "أحمد فؤاد عبد العزيز، السرايات، الوايلي، القاهرة"],
                ["مستشفى اركان التخصصى", "126 أمام محطة مترو العباسية، القاهرة"],
                ["مستشفى الجوى العام", "شارع أحمد سعيد، العباسية، الوايلي، القاهرة"]
            ])}
        </div>

        <div class="hospital-office">
            <h3>صحة الظاهر</h3>
            <p>المستشفيات التابعة لمكتب صحة الظاهر</p>
            ${renderHospitalList([
                ["مستشفى السلام التخصصى", "أبو خودة، حي الظاهر، مدينة السلام، القاهرة"],
                ["مستشفى النزهة", "2 النزهة، السكاكيني، حي الظاهر، القاهرة"],
                ["مستشفى الأمل", "10 ركن الريس، القبيسي، حي الظاهر، القاهرة"]
            ])}
        </div>
    `;
}

function renderHospitalList(items) {
    return `
        <div class="hospital-list">
            ${items.map(([name, address]) => `
                <article class="hospital-item">
                    <strong>${name}</strong>
                    <span>${address}</span>
                </article>
            `).join("")}
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
    modalImage.style.transform = `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${imageScale})`;
}

function openImageModal(source, title, alt, index = 0) {
    currentGalleryIndex = index;
    imageScale = 1;
    imageOffset = { x: 0, y: 0 };
    imageSwipe = null;
    modalPointers.clear();
    pinchStart = null;
    modalImage.src = source;
    modalImage.alt = alt;
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
    document.body.classList.remove("assistant-open");
    assistantPanel.classList.add("hidden");
    menuPanel.classList.remove("hidden");
    chatArea.innerHTML = "";
    inputGroup.classList.add("hidden");
    assistantInputGroup.classList.add("hidden");
    userInput.value = "";
    assistantUserInput.value = "";
    menuPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    if (assistantHistoryActive) {
        assistantHistoryActive = false;
        if (!fromHistory) history.back();
    }
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

        if (service.customView === "emergency") {
            addMessage(renderEmergencyGuide(), "bot", "service-response response-emergency", {
                audio: service.media?.audio || ""
            });
            return;
        }

        let response = `<span class="response-title">${service.icon} ${service.name}</span>`;
        response += `${getExtraIntro(service.name, originalText)}${service.msg}`;

        if (service.showMore !== false && service.tutorial) {
            response += `<a href="${service.tutorial}" target="_blank" rel="noopener noreferrer" class="btn-link">عرض المزيد</a>`;
        } else if (service.link) {
            response += `<a href="${service.link}" target="_blank" rel="noopener noreferrer" class="btn-link">عرض المزيد</a>`;
        }

        addMessage(response, "bot", `service-response ${service.special ? `response-${service.special}` : ""}`, {
            audio: service.media?.audio || ""
        });
    }, 1100);
}

function startTextAssistant() {
    enterAssistantMode();
    chatArea.innerHTML = "";
    assistantInputGroup.classList.remove("hidden");

    showTyping();
    setTimeout(() => {
        removeTyping();
        addMessage(getAssistantWelcome(), "bot", "notice-msg");
        assistantUserInput.focus();
    }, 1300);
}

function getAssistantWelcome() {
    return `
        👋 أهلاً بيك<br><br>
        لو محتار تبدأ منين أو مش عارف الإجراءات تمشي إزاي… أنا هنا علشان أساعدك 🤍<br><br>
        💬 قولّي عايز تعمل إيه<br>
        وأنا هقولك تعمل إيه خطوة خطوة بشكل بسيط وواضح<br><br>
        ✨ <b>جرب تدوس هنا دلوقتي:</b><br>
        <button class="option-btn" type="button" data-quick-send="عايز أطلع شهادة ميلاد">👉 عايز أطلع شهادة ميلاد</button><br>
        🔹 خدمات تقدر تسأل عنها:<br>
        التطعيمات - الوفاة - تنمية الأسرة - عن المساعد
    `;
}

function quickSend(text) {
    addMessage(text, "user");
    showTyping();
    setTimeout(() => {
        removeTyping();
        const matches = detectServices(text);
        if (matches.length > 0) {
            selectService(matches[0].name, text, false, false);
        }
    }, 1000);
}

function handleSend() {
    const activeInput = assistantInputGroup.classList.contains("hidden") ? userInput : assistantUserInput;
    const text = activeInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    activeInput.value = "";

    showTyping();
    setTimeout(() => {
        removeTyping();
        const matches = detectServices(text);

        if (matches.length > 1) {
            let html = "لقيت أكتر من خدمة ممكن تكون مناسبة. اختار الخدمة المطلوبة:<br>";
            matches.forEach(match => {
                const service = serviceByName.get(match.name);
                html += `<button class="option-btn" type="button" data-service="${match.name}">${service.icon} ${match.name}</button>`;
            });
            addMessage(html, "bot");
        } else if (matches.length === 1) {
            selectService(matches[0].name, text, false, false);
        } else {
            addMessage("ممكن توضح أكتر؟ ولو حابب، ارجع للخدمات الرئيسية واختار من الأزرار.", "bot", "notice-msg");
        }
    }, 1000);
}

function addMessage(text, type, extraClass = "", options = {}) {
    const div = document.createElement("div");
    div.className = `msg ${type === "user" ? "user-msg" : "bot-msg"} ${extraClass}`.trim();
    div.innerHTML = text;
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
    div.scrollIntoView({ behavior: "smooth", block: "end" });
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
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const egyptianVoice = getArabicVoice();
    if (egyptianVoice) utterance.voice = egyptianVoice;
    else showTinyFeedback(message, "ثبّت صوت عربي من إعدادات ويندوز");
    utterance.lang = egyptianVoice?.lang || "ar-EG";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    showTinyFeedback(message, "جاري القراءة");
}

function playAudioFile(source, feedbackTarget = null) {
    stopCurrentAudio();

    currentAudio = new Audio(source);
    currentAudio.preload = "auto";
    currentAudio.onended = () => {
        currentAudio = null;
    };
    currentAudio.onerror = () => {
        if (feedbackTarget) showTinyFeedback(feedbackTarget, "تعذر تشغيل الصوت");
        currentAudio = null;
    };

    const playPromise = currentAudio.play();
    if (playPromise?.catch) {
        playPromise
            .then(() => {
                if (feedbackTarget) showTinyFeedback(feedbackTarget, "جاري تشغيل الصوت");
            })
            .catch(() => {
                if (feedbackTarget) showTinyFeedback(feedbackTarget, "اضغط مرة أخرى لتشغيل الصوت");
                else showIntroAudioPrompt();
            });
    } else if (feedbackTarget) {
        showTinyFeedback(feedbackTarget, "جاري تشغيل الصوت");
    }
}

function stopCurrentAudio() {
    if (!currentAudio) return;
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    window.speechSynthesis?.cancel();
}

function getArabicVoice() {
    if (!("speechSynthesis" in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    return voices.find(voice => voice.lang.toLowerCase() === "ar-eg")
        || voices.find(voice => voice.lang.toLowerCase().startsWith("ar"));
}

function scheduleIntroSpeech() {
    window.setTimeout(handleIntroAudio, INTRO_SPEECH_DELAY);
}

function handleIntroAudio() {
    if (document.body.classList.contains("assistant-open")) return;

    const playedBefore = localStorage.getItem(INTRO_AUDIO_PLAYED_KEY) === "1";
    const suppressUntil = Number(localStorage.getItem(INTRO_AUDIO_SUPPRESS_UNTIL_KEY) || 0);

    if (!playedBefore) {
        playIntroAudio(true);
        return;
    }

    if (suppressUntil && Date.now() < suppressUntil) return;

    showIntroAudioPrompt();
}

function playIntroAudio(markAsPlayed = false) {
    playAudioFile(INTRO_AUDIO_SRC);
    if (markAsPlayed) localStorage.setItem(INTRO_AUDIO_PLAYED_KEY, "1");
    hideIntroAudioPrompt();
}

function showIntroAudioPrompt() {
    introAudioPrompt?.classList.remove("hidden");
    introPlayBtn?.focus();
}

function hideIntroAudioPrompt() {
    introAudioPrompt?.classList.add("hidden");
    if (introDontShowAgain) introDontShowAgain.checked = false;
}

function rememberIntroPromptChoice() {
    if (introDontShowAgain?.checked) {
        localStorage.setItem(INTRO_AUDIO_SUPPRESS_UNTIL_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    }
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
    localStorage.setItem("healthAssistantTheme", theme);
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-label", theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن");
}

function initTheme() {
    const savedTheme = localStorage.getItem("healthAssistantTheme") || "light";
    applyTheme(savedTheme);
}

function finishSplash() {
    splash.classList.add("is-hidden");
    readerApp.classList.remove("is-loading");
    scheduleIntroSpeech();
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
        ".news-panel",
        ".audience-stats",
        ".calm-separator",
        ".menu-panel",
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
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
            }
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
        if (introAudioPrompt && !introAudioPrompt.classList.contains("hidden")) {
            scheduleInstallPrompt();
            return;
        }
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

document.getElementById("showSearchBtn").addEventListener("click", startTextAssistant);
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

introPlayBtn?.addEventListener("click", () => {
    rememberIntroPromptChoice();
    playIntroAudio(true);
});

introSkipBtn?.addEventListener("click", () => {
    rememberIntroPromptChoice();
    hideIntroAudioPrompt();
});

themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "light";
    applyTheme(current === "dark" ? "light" : "dark");
});

userInput.addEventListener("keydown", event => {
    if (event.key === "Enter") handleSend();
});

assistantUserInput.addEventListener("keydown", event => {
    if (event.key === "Enter") handleSend();
});

document.addEventListener("click", event => {
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
        showTyping();
        setTimeout(() => {
            removeTyping();
            addMessage(renderWailyHospitals(), "bot", "service-response response-hospitals", { hideSpeak: true });
        }, 800);
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
            imageOffset = { x: 0, y: 0 };
            updateModalImage();
        }
        if (tool === "previous") openGalleryIndex(currentGalleryIndex - 1);
        if (tool === "next") openGalleryIndex(currentGalleryIndex + 1);
        if (tool === "close") closeImageModal();
    }
});

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
    renderMainMenu();
    renderTicker();
    renderGallery();
    initScrollMotion();
    updateClock();
    updateAudienceStats();
    setInterval(updateClock, 1000);
    setInterval(updateAudienceStats, 60 * 1000);
    registerServiceWorker();
    setTimeout(finishSplash, 5000);
});
