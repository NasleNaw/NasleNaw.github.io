// فایل‌های سایت در حالت بتا هستند.
// انیمیشن کارت‌ها و عناصر
(() => {
    const reveal = (selector, className, threshold) => {
        const elements = document.querySelectorAll(selector);
        if (!("IntersectionObserver" in window)) {
            elements.forEach(element => element.classList.add(className));
            return;
        }
        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add(className);
                currentObserver.unobserve(entry.target);
            });
        }, { threshold });
        elements.forEach(element => observer.observe(element));
    };
    reveal(".card-becuase", "text-open", 0.2);
    reveal(".reveal", "show", 0.15);
})();

/* Slider */
document.addEventListener("DOMContentLoaded", () => {
    const slider = document.querySelector("#hero-slider");
    if (!slider) return;
    const slides = [...slider.querySelectorAll(".slide")];
    const prevButton = slider.querySelector(".slider-prev");
    const nextButton = slider.querySelector(".slider-next");
    const dotsContainer = slider.querySelector(".slider-dots");
    const progressBar = slider.querySelector(".slider-progress-bar");
    if (!slides.length || !prevButton || !nextButton || !dotsContainer || !progressBar) return;

    const AUTO_DELAY = 5000;
    const MANUAL_DELAY = 8000;
    const reducedMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
    let currentIndex = Math.max(0, slides.findIndex(slide => slide.classList.contains("active")));
    let timerId = null;
    let deadline = 0;
    let remainingTime = AUTO_DELAY;
    let isPaused = false;
    let isInViewport = true;
    let isPageVisible = !document.hidden;
    let touchStartX = 0;
    let touchStartY = 0;
    const dots = [];

    dotsContainer.replaceChildren();
    slides.forEach((slide, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `رفتن به اسلاید ${index + 1}`);
        dot.addEventListener("click", () => {
            showSlide(index);
            scheduleNext(MANUAL_DELAY);
        });
        dotsContainer.appendChild(dot);
        dots.push(dot);
    });

    function updateSlide() {
        slides.forEach((slide, index) => {
            const active = index === currentIndex;
            slide.classList.toggle("active", active);
            slide.setAttribute("aria-hidden", String(!active));
            if ("inert" in slide) slide.inert = !active;
        });
        dots.forEach((dot, index) => {
            const active = index === currentIndex;
            dot.classList.toggle("active", active);
            if (active) dot.setAttribute("aria-current", "true");
            else dot.removeAttribute("aria-current");
        });
    }
    function showSlide(index) {
        currentIndex = (index + slides.length) % slides.length;
        updateSlide();
    }
    function clearTimer() {
        if (timerId !== null) clearTimeout(timerId);
        timerId = null;
    }
    function canRun() {
        return !isPaused && isInViewport && isPageVisible && !reducedMotion.matches && slides.length > 1;
    }
    function scheduleNext(delay) {
        clearTimer();
        remainingTime = delay;
        progressBar.style.transition = "none";
        progressBar.style.width = "0%";
        deadline = Date.now() + delay;
        if (!canRun()) return;
        requestAnimationFrame(() => {
            if (!canRun()) return;
            progressBar.style.transition = `width ${delay}ms linear`;
            progressBar.style.width = "100%";
        });
        timerId = setTimeout(() => {
            timerId = null;
            showSlide(currentIndex + 1);
            scheduleNext(AUTO_DELAY);
        }, delay);
    }
    function pauseSlider() {
        if (isPaused) return;
        isPaused = true;
        if (timerId !== null) remainingTime = Math.max(0, deadline - Date.now());
        clearTimer();
        progressBar.style.transition = "none";
        const total = Math.max(1, deadline - (deadline - remainingTime));
        const progress = Math.min(100, Math.max(0, ((total - remainingTime) / total) * 100));
        progressBar.style.width = `${progress}%`;
    }
    function resumeSlider() {
        if (!isPaused) return;
        isPaused = false;
        if (!canRun()) return;
        if (remainingTime <= 0) {
            showSlide(currentIndex + 1);
            scheduleNext(AUTO_DELAY);
        } else scheduleNext(remainingTime);
    }

    nextButton.addEventListener("click", () => { showSlide(currentIndex + 1); scheduleNext(MANUAL_DELAY); });
    prevButton.addEventListener("click", () => { showSlide(currentIndex - 1); scheduleNext(MANUAL_DELAY); });
    slider.addEventListener("mouseenter", pauseSlider);
    slider.addEventListener("mouseleave", resumeSlider);
    slider.addEventListener("focusin", pauseSlider);
    slider.addEventListener("focusout", event => {
        if (!slider.contains(event.relatedTarget)) resumeSlider();
    });
    document.addEventListener("visibilitychange", () => {
        isPageVisible = !document.hidden;
        if (!isPageVisible) pauseSlider(); else resumeSlider();
    });
    if ("IntersectionObserver" in window) {
        const sliderObserver = new IntersectionObserver(([entry]) => {
            isInViewport = entry.isIntersecting;
            if (!isInViewport) pauseSlider(); else resumeSlider();
        }, { threshold: 0.1 });
        sliderObserver.observe(slider);
    }
    slider.addEventListener("touchstart", event => {
        if (!event.changedTouches.length) return;
        touchStartX = event.changedTouches[0].clientX;
        touchStartY = event.changedTouches[0].clientY;
    }, { passive: true });
    slider.addEventListener("touchend", event => {
        if (!event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - touchStartX;
        const dy = event.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        showSlide(currentIndex + (dx > 0 ? -1 : 1));
        scheduleNext(MANUAL_DELAY);
    }, { passive: true });
    function handleMotionPreference() {
        clearTimer();
        if (reducedMotion.matches) {
            progressBar.style.transition = "none";
            progressBar.style.width = "0%";
        } else if (canRun()) scheduleNext(AUTO_DELAY);
    }
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", handleMotionPreference);
    else if (reducedMotion.addListener) reducedMotion.addListener(handleMotionPreference);
    updateSlide();
    scheduleNext(AUTO_DELAY);
});

/* Header menu */
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const siteNav = document.getElementById("site-navigation");
    if (!menuToggle || !siteNav) return;
    function setMenuState(isOpen) {
        menuToggle.classList.toggle("is-open", isOpen);
        siteNav.classList.toggle("is-open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "بستن منو" : "باز کردن منو");
    }
    menuToggle.addEventListener("click", () => setMenuState(menuToggle.getAttribute("aria-expanded") !== "true"));
    siteNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenuState(false)));
    document.addEventListener("keydown", event => { if (event.key === "Escape") setMenuState(false); });
    document.addEventListener("click", event => {
        if (!siteNav.contains(event.target) && !menuToggle.contains(event.target)) setMenuState(false);
    });
    window.addEventListener("resize", () => { if (window.innerWidth > 768) setMenuState(false); });
});

/* School gallery */
(() => {
    const gallery = document.querySelector("#schoolGallery");
    if (!gallery || gallery.dataset.ready) return;
    const main = gallery.querySelector(".gallery-main");
    const image = gallery.querySelector(".gallery-image");
    const blur = gallery.querySelector(".gallery-blur");
    const thumbs = [...gallery.querySelectorAll(".gallery-thumb")];
    const prev = gallery.querySelector(".gallery-prev");
    const next = gallery.querySelector(".gallery-next");
    const viewer = document.querySelector(".gallery-viewer");
    const viewerImage = viewer?.querySelector(".gallery-viewer-image");
    const close = viewer?.querySelector(".gallery-close");
    if (!main || !image || !blur || !thumbs.length || !prev || !next) return;
    gallery.dataset.ready = "true";
    let index = 0;
    let startX = 0;
    let startY = 0;
    function showImage(i) {
        index = (i + thumbs.length) % thumbs.length;
        const thumbImage = thumbs[index].querySelector("img");
        if (!thumbImage) return;
        image.src = thumbImage.src;
        blur.src = thumbImage.src;
        image.alt = `تصویر ${index + 1} گالری مکتب نسل نو`;
        thumbs.forEach((thumb, n) => thumb.classList.toggle("active", n === index));
    }
    prev.addEventListener("click", () => showImage(index - 1));
    next.addEventListener("click", () => showImage(index + 1));
    thumbs.forEach((thumb, i) => thumb.addEventListener("click", () => showImage(i)));
    function openViewer() {
        if (!viewer || !viewerImage || !close) return;
        viewerImage.src = image.src;
        viewerImage.alt = image.alt;
        viewer.classList.add("open");
        viewer.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        close.focus();
    }
    function closeViewer() {
        if (!viewer || !viewerImage) return;
        viewer.classList.remove("open");
        viewer.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        viewerImage.src = "";
        image.focus?.();
    }
    image.addEventListener("click", openViewer);
    close?.addEventListener("click", closeViewer);
    viewer?.addEventListener("click", event => { if (event.target === viewer) closeViewer(); });
    document.addEventListener("keydown", event => {
        if (viewer?.classList.contains("open")) {
            if (event.key === "Escape") closeViewer();
            return;
        }
        if (!gallery.contains(document.activeElement)) return;
        if (event.key === "ArrowLeft") showImage(index + 1);
        if (event.key === "ArrowRight") showImage(index - 1);
    });
    main.addEventListener("touchstart", event => {
        if (!event.touches.length) return;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
    }, { passive: true });
    main.addEventListener("touchend", event => {
        if (!event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - startX;
        const dy = event.changedTouches[0].clientY - startY;
        if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
        showImage(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
    showImage(0);
})();

/* Statistics counter */
(() => {
    const numbers = document.querySelectorAll(".stat-number");
    function setFinalValue(element) {
        const target = Number(element.dataset.target);
        if (Number.isFinite(target)) element.textContent = target.toLocaleString("en-US");
    }
    if (!("IntersectionObserver" in window)) {
        numbers.forEach(setFinalValue);
        return;
    }
    const statObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const element = entry.target;
            const target = Number(element.dataset.target);
            observer.unobserve(element);
            if (!Number.isFinite(target)) return;
            const startTime = performance.now();
            function animate(now) {
                const progress = Math.min((now - startTime) / 1500, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = Math.round(target * eased).toLocaleString("en-US");
                if (progress < 1) requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
        });
    }, { threshold: 0.5 });
    numbers.forEach(number => statObserver.observe(number));
})();

/* Copy buttons */
document.addEventListener("click", async event => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const button = target?.closest(".copy-btn");
    if (!button) return;
    const text = button.dataset.copy;
    const originalText = button.textContent;
    try {
        if (typeof text !== "string") throw new Error("متن کپی مشخص نشده است.");
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard API در دسترس نیست.");
        await navigator.clipboard.writeText(text);
        button.textContent = "کپی شد ✓";
    } catch (error) {
        button.textContent = "خطا در کپی";
        console.warn("کپی متن انجام نشد:", error);
    }
    button.style.borderRadius = "9px";
    button.style.color = "white";
    button.style.fontFamily = "estedad";
    window.setTimeout(() => { button.textContent = originalText; }, 1800);
});

/* Lottie animations — بعضی صفحات این کانتینرها را ندارند. */
if (typeof lottie !== "undefined" && typeof lottie.loadAnimation === "function") {
    [
        ["book-animation", "../assets/icon/doodle-outline-112-book-bookmark-hover-pinch.json"],
        ["facebook-animation", "../assets/icon/wired-outline-2540-logo-facebook-hover-roll.json"]
    ].forEach(([id, path]) => {
        const container = document.getElementById(id);
        if (!container) return;
        try {
            lottie.loadAnimation({ container, renderer: "svg", loop: true, autoplay: true, path });
        } catch (error) {
            console.warn(`بارگذاری انیمیشن ${id} انجام نشد:`, error);
        }
    });
}

/* Share Nasle Naw: پشتیبانی از مرورگرهای بدون Web Share API و جلوگیری از خطای null. */
(() => {
    const shareBtn = document.getElementById("shareBtn");
    if (!shareBtn) return;
    const shareData = {
        title: "لیسه عالی نسل نو",
        text: "با وب‌سایت رسمی مکتب نسل نو آشنا شوید:",
        url: "https://naslenaw.github.io/"
    };
    shareBtn.addEventListener("click", async event => {
        event.preventDefault();
        const control = shareBtn.querySelector("button") || shareBtn;
        const originalLabel = control.getAttribute("aria-label");
        try {
            if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(shareData))) {
                await navigator.share(shareData);
                return;
            }
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareData.url);
                control.setAttribute("aria-label", "پیوند سایت کپی شد");
                shareBtn.title = "پیوند سایت کپی شد";
                window.setTimeout(() => {
                    if (originalLabel === null) control.removeAttribute("aria-label");
                    else control.setAttribute("aria-label", originalLabel);
                    shareBtn.removeAttribute("title");
                }, 2000);
                return;
            }
            window.prompt("پیوند سایت را برای اشتراک‌گذاری کپی کنید:", shareData.url);
        } catch (error) {
            // لغو پنجرهٔ اشتراک‌گذاری توسط کاربر خطا محسوب نمی‌شود.
            if (error?.name === "AbortError") return;
            console.warn("اشتراک‌گذاری انجام نشد:", error);
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(shareData.url);
                    control.setAttribute("aria-label", "پیوند سایت کپی شد");
                    shareBtn.title = "پیوند سایت کپی شد";
                } else {
                    window.prompt("پیوند سایت را برای اشتراک‌گذاری کپی کنید:", shareData.url);
                }
            } catch (fallbackError) {
                console.warn("کپی پیوند سایت نیز انجام نشد:", fallbackError);
                window.prompt("پیوند سایت را کپی کنید:", shareData.url);
            }
        }
    });
})();

/* Pages CMS — بارگذاری خودکار اخبار و اطلاعیه‌ها */
(() => {
    const container = document.querySelector(".news-container");
    if (!container) return;
    const DATA_URL = "/assets/data/site-content.json";
    const FALLBACK_IMAGE = "assets/images/کاور-خبر.avif";
    function formatDate(value) {
        if (!value) return "";
        const date = new Date(`${value}T12:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        try {
            return new Intl.DateTimeFormat("fa-AF-u-ca-persian", {
                day: "numeric", month: "long", year: "numeric"
            }).format(date);
        } catch { return value; }
    }
    function createCard(item) {
        const card = document.createElement("div");
        card.className = "news";
        const cover = document.createElement("div");
        cover.className = "news-cover";
        const image = document.createElement("img");
        image.src = item.image || FALLBACK_IMAGE;
        image.alt = item.title || "";
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener("error", () => {
            image.src = new URL(FALLBACK_IMAGE, location.href).href;
        }, { once: true });
        cover.appendChild(image);
        const content = document.createElement("div");
        content.className = "news-txt";
        const time = document.createElement("time");
        time.dateTime = item.date || "";
        time.textContent = formatDate(item.date);
        const title = document.createElement("h1");
        title.textContent = item.title || "";
        const summary = document.createElement("p");
        summary.textContent = item.summary || "";
        content.append(time, title, summary);
        const more = document.createElement("a");
        more.className = "news-a";
        more.textContent = "بیشتر ...";
        if (item.source) {
            more.href = "https://github.com/NasleNaw/NasleNaw.github.io/blob/main/" +
                String(item.source).split("/").map(encodeURIComponent).join("/");
            more.target = "_blank";
            more.rel = "noopener noreferrer";
        } else {
            more.href = "#";
            more.addEventListener("click", event => event.preventDefault());
        }
        const label = document.createElement("small");
        if (item.type === "announcement") {
            const priorities = { normal: "عادی", important: "مهم", urgent: "فوری" };
            label.textContent = `اطلاعیه · ${priorities[item.priority] || "عادی"}`;
        } else label.textContent = "خبر";
        content.appendChild(label);
        card.append(cover, content, more);
        return card;
    }
    fetch(DATA_URL, { cache: "no-cache" })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data || !Array.isArray(data.items)) throw new Error("ساختار فایل JSON معتبر نیست.");
            const fragment = document.createDocumentFragment();
            data.items.forEach(item => {
                if (item && item.published === true) fragment.appendChild(createCard(item));
            });
            if (!fragment.childNodes.length) {
                const message = document.createElement("p");
                message.textContent = "در حال حاضر خبر یا اطلاعیه‌ای برای نمایش وجود ندارد.";
                container.replaceChildren(message);
                return;
            }
            container.replaceChildren(fragment);
        })
        .catch(error => console.warn("خطا در دریافت اخبار و اطلاعیه‌ها:", error));
})();
