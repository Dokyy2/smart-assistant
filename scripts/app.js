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
const themeToggle = document.getElementById("themeToggle");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const modalImageTitle = document.getElementById("modalImageTitle");
const imageStage = document.getElementById("imageStage");

let imageScale = 1;
let imageOffset = { x: 0, y: 0 };
let imageDrag = null;
let currentGalleryIndex = 0;
let modalPointers = new Map();
let pinchStart = null;
let galleryDrag = null;
let galleryAutoFrame = null;
let galleryPausedUntil = 0;
let tickerAutoFrame = null;

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
        اختار المنطقة الطبية المطلوبة، والمساعد هيعرض لك مكاتب الصحة والمستشفيات التابعة لها بشكل واضح.<br><br>
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
    const cards = Array.from({ length: 6 }, (_, index) => ({
        title: index === 0 ? "مكتب صحة الدمرداش" : `مكتب طوارئ رقم ${index + 1}`,
        area: index === 0 ? "منطقة الوايلي الطبية" : "منطقة طبية",
        serves: index === 0 ? "يخدم منطقة الوايلي" : "يخدم المنطقة المحيطة",
        days: "مفتوح أيام الإجازات والعطلات الرسمية",
        services: "مواليد - وفيات - تطعيمات",
        time: "من الساعة 8 صباحا حتى 6 مساءا",
        map: "https://maps.app.goo.gl/96Hna7KCu4rshQVL7"
    }));

    return `
        <span class="response-title">🚨 دليلك في الإجازات والطوارئ</span>
        في أوقات الإجازات والعطلات الرسمية، ممكن تحتاج خدمة صحية مهمة ومش عارف تروح فين.<br><br>
        علشان كده وفرنالك دليل بسيط وواضح يساعدك توصل لأقرب مكان يقدم لك الخدمة بدون تعب أو تأخير.<br><br>
        اختار المكان المناسب من الكروت اللي تحت… واضغط علشان تروح مباشرة.

        <div class="emergency-card-grid">
            ${cards.map((card, index) => `
                <a class="emergency-card" href="${card.map}" target="_blank" rel="noopener noreferrer" style="--delay:${index * 90}ms">
                    <span class="emergency-card-badge">طوارئ</span>
                    <strong>${card.title}</strong>
                    <small>${card.area}</small>
                    <p>${card.serves}</p>
                    <p>${card.days}</p>
                    <p>${card.services}</p>
                    <b>${card.time}</b>
                    <span class="map-action">افتح الاتجاهات</span>
                </a>
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
    modalPointers.clear();
    pinchStart = null;
    modalImage.src = source;
    modalImage.alt = alt;
    modalImageTitle.textContent = title;
    updateModalImage();
    imageModal.classList.remove("hidden");
}

function openGalleryIndex(index) {
    if (!galleryItems.length) return;
    const total = galleryItems.length;
    const safeIndex = (index + total) % total;
    const item = galleryItems[safeIndex];
    openImageModal(item.src, item.title, item.alt, safeIndex);
}

function closeImageModal() {
    imageModal.classList.add("hidden");
    imageDrag = null;
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
    document.body.classList.add("assistant-open");
    menuPanel.classList.add("hidden");
    assistantPanel.classList.remove("hidden");
    assistantPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function backToServices() {
    window.speechSynthesis?.cancel();
    document.body.classList.remove("assistant-open");
    assistantPanel.classList.add("hidden");
    menuPanel.classList.remove("hidden");
    chatArea.innerHTML = "";
    inputGroup.classList.add("hidden");
    assistantInputGroup.classList.add("hidden");
    userInput.value = "";
    assistantUserInput.value = "";
    menuPanel.scrollIntoView({ behavior: "smooth", block: "start" });
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
            addMessage(renderHospitalsIntro(), "bot", "service-response response-hospitals");
            return;
        }

        if (service.customView === "emergency") {
            addMessage(renderEmergencyGuide(), "bot", "service-response response-emergency");
            return;
        }

        let response = `<span class="response-title">${service.icon} ${service.name}</span>`;
        response += `${getExtraIntro(service.name, originalText)}${service.msg}`;

        if (service.showMore !== false && service.tutorial) {
            response += `<a href="${service.tutorial}" target="_blank" rel="noopener noreferrer" class="btn-link">عرض المزيد</a>`;
        } else if (service.link) {
            response += `<a href="${service.link}" target="_blank" rel="noopener noreferrer" class="btn-link">عرض المزيد</a>`;
        }

        addMessage(response, "bot", `service-response ${service.special ? `response-${service.special}` : ""}`);
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

function addMessage(text, type, extraClass = "") {
    const div = document.createElement("div");
    div.className = `msg ${type === "user" ? "user-msg" : "bot-msg"} ${extraClass}`.trim();
    div.innerHTML = text;

    if (type === "bot") {
        const actions = document.createElement("div");
        actions.className = "message-actions";
        actions.innerHTML = `
            <button type="button" class="message-action copy-action" aria-label="نسخ الرد"><span class="copy-glyph" aria-hidden="true"></span></button>
            <button type="button" class="message-action speak-action" aria-label="سماع الرد">🔊</button>
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
    const voices = window.speechSynthesis.getVoices();
    const egyptianVoice = voices.find(voice => voice.lang.toLowerCase() === "ar-eg")
        || voices.find(voice => voice.lang.toLowerCase().startsWith("ar"));
    if (egyptianVoice) utterance.voice = egyptianVoice;
    else showTinyFeedback(message, "ثبّت صوت عربي من إعدادات ويندوز");
    utterance.lang = egyptianVoice?.lang || "ar-EG";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    showTinyFeedback(message, "جاري القراءة");
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
}

document.getElementById("showSearchBtn").addEventListener("click", startTextAssistant);
document.getElementById("sendBtn").addEventListener("click", handleSend);
assistantSendBtn.addEventListener("click", handleSend);
assistantFab.addEventListener("click", startTextAssistant);
document.getElementById("backToServicesBtn").addEventListener("click", backToServices);
document.getElementById("floatingBackBtn").addEventListener("click", backToServices);

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
            addMessage(renderWailyHospitals(), "bot", "service-response response-hospitals");
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
    } else if (imageScale > 1) {
        imageDrag = { x: event.clientX, y: event.clientY, offsetX: imageOffset.x, offsetY: imageOffset.y };
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
    modalPointers.delete(event.pointerId);
    pinchStart = null;
    imageDrag = null;
});

imageStage.addEventListener("pointercancel", event => {
    modalPointers.delete(event.pointerId);
    pinchStart = null;
    imageDrag = null;
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
    updateClock();
    setInterval(updateClock, 1000);
    setTimeout(finishSplash, 2500);
});
