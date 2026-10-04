(() => {
  const scriptUrl = document.currentScript?.src || window.location.href;
  const siteBase = new URL("./", scriptUrl);
  const assetUrl = (name) => new URL(`assets/${name}`, siteBase).href;

  const galleryReplacements = new Map([
    ["work-01.webp", ["photo1.jpg", "Работа ClayTone — новое фото 1"]],
    ["work-02.webp", ["photo2.jpg", "Работа ClayTone — новое фото 2"]],
    ["work-03.webp", ["photo3.jpg", "Работа ClayTone — новое фото 3"]],
    ["work-04.webp", ["photo4.jpg", "Работа ClayTone — новое фото 4"]],
    ["work-05.webp", ["photo5.jpg", "Работа ClayTone — новое фото 5"]],
    ["portfolio-wine.webp", ["photo6.jpg", "Работа ClayTone — новое фото 6"]],
  ]);

  const basename = (src) => {
    try {
      return new URL(src, window.location.href).pathname.split("/").pop() || "";
    } catch {
      return src.split("/").pop() || "";
    }
  };

  const replaceGalleryImage = (img) => {
    const replacement = galleryReplacements.get(
      basename(img.getAttribute("src") || img.src)
    );
    if (!replacement) return;
    img.src = assetUrl(replacement[0]);
    img.alt = replacement[1];
  };

  const enhanceGalleryPhotos = () => {
    document.querySelectorAll("img").forEach(replaceGalleryImage);
  };

  const observeGalleryPhotos = () => {
    if (!("MutationObserver" in window)) return;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches("img")) replaceGalleryImage(node);
          node.querySelectorAll?.("img").forEach(replaceGalleryImage);
        });
        if (mutation.type === "attributes" && mutation.target instanceof HTMLImageElement) {
          replaceGalleryImage(mutation.target);
        }
      });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
  };

  const enhancePromotions = () => {
    const cards = document.querySelectorAll(".mct-promotion-card");
    const firstImage = cards[0]?.querySelector("img");
    const secondImage = cards[1]?.querySelector("img");

    if (firstImage) {
      firstImage.src = assetUrl("photohh1.jpg");
      firstImage.alt = "Первая акция ClayTone";
    }

    if (secondImage) {
      secondImage.src = assetUrl("photohh2.jpg");
      secondImage.alt = "Вторая акция ClayTone";
    }
  };

  const dispatchPointer = (viewport, type, clientX = 0, pointerType = "touch") => {
    if (typeof PointerEvent !== "function") return;
    viewport.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 77,
      pointerType,
      isPrimary: true,
      clientX,
      clientY: 0,
    }));
  };

  const dispatchMouseTransition = (viewport, type, relatedTarget) => {
    viewport.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      relatedTarget,
      clientX: 0,
      clientY: 0,
    }));
  };

  const enhanceDesktopGallery = () => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const viewport = document.querySelector(".dct-gallery-viewport");
    if (!viewport || viewport.dataset.claytoneTrackpad === "1") return;
    viewport.dataset.claytoneTrackpad = "1";

    let gestureActive = false;
    let virtualX = 0;
    let releaseTimer = 0;
    let dragStartX = null;
    let dragged = false;
    let manualResumeTimer = 0;
    let manualCooldown = false;

    const cancelHoverPause = (event) => {
      if (manualCooldown) return;
      if (event.relatedTarget instanceof Node && viewport.contains(event.relatedTarget)) return;
      window.setTimeout(() => dispatchPointer(viewport, "pointerup", 0, "mouse"), 0);
    };

    viewport.addEventListener("mouseover", cancelHoverPause);

    viewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || !event.isPrimary) return;
      window.clearTimeout(manualResumeTimer);
      dragStartX = event.clientX;
      dragged = false;
      manualCooldown = false;
    });

    viewport.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || dragStartX === null || !(event.buttons & 1)) return;
      if (Math.abs(event.clientX - dragStartX) > 7) dragged = true;
    });

    viewport.addEventListener("pointerup", (event) => {
      if (event.pointerType !== "mouse" || !event.isPrimary) return;
      const shouldDelay = dragged;
      dragStartX = null;
      dragged = false;
      if (!shouldDelay) return;

      manualCooldown = true;
      window.setTimeout(() => {
        dispatchMouseTransition(viewport, "mouseover", null);
      }, 0);

      window.clearTimeout(manualResumeTimer);
      manualResumeTimer = window.setTimeout(() => {
        dispatchMouseTransition(viewport, "mouseout", document.body);
        dispatchPointer(viewport, "pointerup", event.clientX, "mouse");
        manualCooldown = false;
      }, 1000);
    });

    viewport.addEventListener("pointercancel", () => {
      dragStartX = null;
      dragged = false;
      manualCooldown = false;
      window.clearTimeout(manualResumeTimer);
    });

    window.setTimeout(() => dispatchPointer(viewport, "pointerup", 0, "mouse"), 0);

    viewport.addEventListener("wheel", (event) => {
      const horizontalDelta = Math.abs(event.deltaX) > 0.6
        ? event.deltaX
        : event.shiftKey ? event.deltaY : 0;
      if (!horizontalDelta) return;

      event.preventDefault();
      if (!gestureActive) {
        gestureActive = true;
        virtualX = 0;
        dispatchPointer(viewport, "pointerdown", virtualX);
      }

      virtualX -= horizontalDelta * 1.08;
      dispatchPointer(viewport, "pointermove", virtualX);

      window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(() => {
        dispatchPointer(viewport, "pointerup", virtualX);
        gestureActive = false;
        virtualX = 0;
      }, 1000);
    }, { passive: false });
  };

  const pauseMovingRowsOffscreen = () => {
    if (!window.matchMedia("(min-width: 768px)").matches || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const rows = document.querySelectorAll(".dct-gallery-viewport, .mct-review-viewport");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        dispatchPointer(target, entry.isIntersecting ? "pointerup" : "pointerdown");
      });
    }, { rootMargin: "220px 0px", threshold: 0.01 });
    rows.forEach((row) => observer.observe(row));
  };

  document.addEventListener("click", (event) => {
    const title = event.target.closest?.(".mct-service-name strong");
    if (!title) return;
    const action = title.closest(".mct-service-row")?.querySelector(".mct-service-action a");
    if (!action) return;
    event.preventDefault();
    window.open(action.href, "_blank", "noopener,noreferrer");
  });

  document.addEventListener("keydown", (event) => {
    const title = event.target.closest?.(".mct-service-name strong");
    if (!title || (event.key !== "Enter" && event.key !== " ")) return;
    const action = title.closest(".mct-service-row")?.querySelector(".mct-service-action a");
    if (!action) return;
    event.preventDefault();
    window.open(action.href, "_blank", "noopener,noreferrer");
  });

  const run = () => {
    // Visible customer photos are controlled by site-data.mjs.
    enhanceDesktopGallery();
    pauseMovingRowsOffscreen();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
})();


(() => {
  if (!window.matchMedia("(max-width: 767px)").matches) return;

  const root = document.documentElement;
  const body = document.body;
  const overlaySelector = ".mct-gallery-overlay, .mct-lightbox, .mct-custom-lightbox:not([hidden])";
  let frame = 0;

  const setImportant = (element, property, value) => {
    if (
      element.style.getPropertyValue(property) === value &&
      element.style.getPropertyPriority(property) === "important"
    ) return;
    element.style.setProperty(property, value, "important");
  };

  const unlockScroll = () => {
    if (document.querySelector(overlaySelector)) return;

    setImportant(root, "height", "auto");
    setImportant(root, "min-height", "100%");
    setImportant(root, "overflow-x", "hidden");
    setImportant(root, "overflow-y", "auto");
    setImportant(root, "overscroll-behavior-y", "auto");
    setImportant(root, "touch-action", "pan-y");

    setImportant(body, "height", "auto");
    setImportant(body, "min-height", "100%");
    setImportant(body, "overflow-x", "hidden");
    setImportant(body, "overflow-y", "visible");
    setImportant(body, "overscroll-behavior-y", "auto");
    setImportant(body, "touch-action", "pan-y");
  };

  const scheduleUnlock = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      unlockScroll();
    });
  };

  unlockScroll();
  [80, 350, 900, 1800, 2800, 4500, 7000].forEach((delay) => {
    window.setTimeout(unlockScroll, delay);
  });

  const styleObserver = new MutationObserver(scheduleUnlock);
  styleObserver.observe(root, { attributes: true, attributeFilter: ["style", "class"] });
  styleObserver.observe(body, { attributes: true, attributeFilter: ["style", "class"] });

  const domObserver = new MutationObserver(scheduleUnlock);
  domObserver.observe(body, { childList: true, subtree: true });

  window.addEventListener("pageshow", scheduleUnlock);
  window.addEventListener("load", scheduleUnlock);
  window.addEventListener("resize", scheduleUnlock, { passive: true });
  window.addEventListener("orientationchange", scheduleUnlock, { passive: true });
  document.addEventListener("visibilitychange", scheduleUnlock);
  document.addEventListener("touchstart", scheduleUnlock, { passive: true });
})();

