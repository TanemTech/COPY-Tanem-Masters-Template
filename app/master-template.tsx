"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import site from "../site-data.mjs";
import {
  aboutPreset,
  bookingMode,
  categoryMode,
  chooseInitialLocale,
  contactOptions,
  experienceMode,
  hasLogo,
  heroPreset,
  masterImageSources,
  masterInitial,
  masterNameForLocale,
  normalizedLocales,
  SERVICE_PREVIEW_LIMIT,
  serviceBookingUrl,
  specialtyMode,
  visibleServiceGroups,
} from "../template-rules.mjs";

type ServiceVariant = { label: string; price: string; time?: string };
type Service = {
  name: string;
  price: string;
  time: string;
  description: string;
  url?: string;
  variants?: ServiceVariant[];
  detailClass?: string;
  displayName?: string;
};
type ServiceGroup = { id: string; label: string; services: Service[] };
type GalleryItem = { src: string; alt: string };
type Review = { author: string; text: string; source?: string };
type Amenity = { title: string; text: string };
type LocaleOption = { code: string; label: string };

const bookingUrl = site.links.bookingUrl;
const reviewsUrl = site.links.reviewsUrl;
const mapUrl = site.links.mapUrl;
const routeUrl = site.links.routeUrl;
const mobileMapEmbedUrl = site.links.mobileMapEmbedUrl;
const desktopMapEmbedUrl = site.links.desktopMapEmbedUrl;

const serviceGroups = visibleServiceGroups(site) as ServiceGroup[];
const allServices: Array<Service & { sectionLabel?: string; sectionKey?: string }> = serviceGroups.flatMap((group) =>
  group.services.map((service, index) => ({
    ...service,
    sectionLabel: serviceGroups.length > 1 && index === 0 ? group.label : undefined,
    sectionKey: group.id,
  })),
);
const serviceCategoryMode = categoryMode(site);
const siteBookingMode = bookingMode(site);
const siteExperienceMode = experienceMode(site);
const siteSpecialtyMode = specialtyMode(site);
const siteHeroPreset = heroPreset(site);
const resolvedImages = masterImageSources(site);
const languages = normalizedLocales(site) as LocaleOption[];
const bookingContacts = contactOptions(site);
const locationFillsContactRow = Boolean(mapUrl && bookingContacts.length % 2 === 0);

const beforeAfter = site.images.beforeAfter as unknown[];
const galleryWorks = site.images.gallery as GalleryItem[];
const desktopGalleryModules = [galleryWorks.slice(0, 4), galleryWorks.slice(4, 8), galleryWorks.slice(8)];
const desktopGallerySetCount = 3;
const featuredWorks = galleryWorks.slice(0, 7);
const lightboxItems = [...galleryWorks];
const reviews = (site.reviews as Review[]).slice(0, 9);
const reviewSetCount = 5;
const promotions = site.promotions as unknown[];
const approvedAbout = aboutPreset(site);
const aboutParagraphs = approvedAbout.paragraphs as string[];
const skills = approvedAbout.skills as string[];
const approvedMasterInitial = masterInitial(site);
const amenities: Amenity[] = [
  { title: "Выбор услуги", text: "Мастер поможет определиться." },
  { title: "Пожелания", text: "Покажите пример результата." },
  { title: "Перенос записи", text: "Предупредите заранее." },
];

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
const openMinutes = toMinutes(site.location.openTime);
const closeMinutes = toMinutes(site.location.closeTime);

const paletteSamples = [
  { base: "#625873", light: "#948aa3", dark: "#3d354a" },
  { base: "#7b6b94", light: "#aa9fbb", dark: "#514562" },
  { base: "#955d78", light: "#c28ba0", dark: "#653b50" },
  { base: "#aa6271", light: "#d294a0", dark: "#773f4d" },
  { base: "#bf7b81", light: "#e0aaa9", dark: "#8b5057" },
  { base: "#d1a38d", light: "#ecd0bf", dark: "#9d705d" },
  { base: "#c58a78", light: "#e4b5a1", dark: "#915c4c" },
  { base: "#d59e97", light: "#ecc3bc", dark: "#a36d67" },
  { base: "#e1b3ad", light: "#f2d4cf", dark: "#b7837e" },
  { base: "#ebcbc3", light: "#f8e3dc", dark: "#c49a91" },
  { base: "#f0e4d6", light: "#fff7ec", dark: "#c9b6a1" },
];

export default function MasterTemplate() {
  const initialCategory = serviceCategoryMode === "two" ? (serviceGroups[0]?.id || "all") : "all";
  const [category, setCategory] = useState<string>(initialCategory);
  const [expanded, setExpanded] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [locale, setLocale] = useState<string>(languages[0]?.code || "ru");
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [activeBeforeAfter, setActiveBeforeAfter] = useState(0);
  const [activePromotion, setActivePromotion] = useState(0);
  const [promotionHinting, setPromotionHinting] = useState(false);
  const [promotionInView, setPromotionInView] = useState(false);
  const [promotionActivity, setPromotionActivity] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxTransform, setLightboxTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [reviewsPaused, setReviewsPaused] = useState(false);
  const [desktopGalleryPaused, setDesktopGalleryPaused] = useState(false);
  const [openStatus, setOpenStatus] = useState<{ isOpen: boolean | null }>({
    isOpen: null,
  });
  const heroRef = useRef<HTMLElement>(null);
  const finalBookRef = useRef<HTMLElement>(null);
  const beforeAfterRef = useRef<HTMLDivElement>(null);
  const promotionSectionRef = useRef<HTMLElement>(null);
  const promotionRef = useRef<HTMLDivElement>(null);
  const reviewViewportRef = useRef<HTMLDivElement>(null);
  const reviewTrackRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reviewsPausedRef = useRef(false);
  const reviewPointerStartRef = useRef<number | null>(null);
  const reviewScrollStartRef = useRef(0);
  const reviewOffsetRef = useRef(0);
  const reviewSetWidthRef = useRef(0);
  const reviewWasDraggedRef = useRef(false);
  const reviewResumeTimerRef = useRef<number | null>(null);
  const desktopGalleryViewportRef = useRef<HTMLDivElement>(null);
  const desktopGalleryTrackRef = useRef<HTMLDivElement>(null);
  const desktopGalleryPausedRef = useRef(false);
  const desktopGalleryPointerStartRef = useRef<number | null>(null);
  const desktopGalleryStartOffsetRef = useRef(0);
  const desktopGalleryOffsetRef = useRef(0);
  const desktopGallerySetWidthRef = useRef(0);
  const desktopGalleryWasDraggedRef = useRef(false);
  const lightboxGestureRef = useRef({
    mode: "idle" as "idle" | "swipe" | "pan" | "pinch",
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    startScale: 1,
    startDistance: 0,
  });

  const activeGroup = serviceGroups.find((group) => group.id === category);
  const services: Array<Service & { sectionLabel?: string; sectionKey?: string }> =
    category === "all"
      ? allServices
      : (activeGroup?.services || []).map((service) => ({ ...service, sectionKey: activeGroup?.id }));
  const isCollapsibleCategory = services.length > SERVICE_PREVIEW_LIMIT;
  const hiddenServiceCount = Math.max(services.length - SERVICE_PREVIEW_LIMIT, 0);
  const visibleServices = useMemo(() => services, [services]);
  const desktopServiceGroups = (() => {
    const groups = category === "all" ? serviceGroups : serviceGroups.filter((group) => group.id === category);
    if (expanded || hiddenServiceCount === 0) return groups;
    let remaining = SERVICE_PREVIEW_LIMIT;
    return groups
      .map((group) => {
        const groupServices = group.services.slice(0, Math.max(remaining, 0));
        remaining -= groupServices.length;
        return { ...group, services: groupServices };
      })
      .filter((group) => group.services.length > 0);
  })();
  const baseEnglish: Record<string, string> = {
    "Услуги и цены": "Services & prices",
    "ваш": "your",
    "Стоимость и продолжительность указаны для каждой процедуры. Нажмите на услугу, чтобы выбрать способ связи.": "Price and duration are shown for each service. Tap a service to choose how to contact the master.",
    "О мастере": "About",
    "Отзывы": "Reviews",
    "Визит и запись": "Visit & booking",
    "Портфолио": "Portfolio",
    "Записаться онлайн": "Book online",
    "Смотреть работы": "View work",
    "Смотреть все работы": "View all work",
    "Работы": "Work",
    "Открыть галерею": "Open gallery",
    "Выберите услугу": "Choose a service",
    "Актуальная стоимость и продолжительность указаны для каждой процедуры. Онлайн-запись откроется в новой вкладке.": "Current price and duration are shown for each service. Online booking opens in a new tab.",
    "Все": "All",
    "Свернуть": "Collapse",
    "Продолжить": "Continue",
    "Подробнее": "More",
    "Открыть все услуги": "Show all services",
    "Открыть ещё": "Show",
    "Открыть ещё {count} услуг": "Show {count} more services",
    "услугу": "more service",
    "услуг": "more services",
    "Свернуть услуги": "Collapse services",
    "лет опыта": "years experience",
    "рейтинг": "rating",
    "услуги": "services",
    "Дополнительно": "Additional",
    "Полезно перед записью": "Useful before booking",
    "Выбор услуги": "Choosing a service",
    "Мастер поможет определиться.": "The specialist will help you choose.",
    "Пожелания": "Preferences",
    "Покажите пример результата.": "Show an example of the result you want.",
    "Перенос записи": "Rescheduling",
    "Предупредите заранее.": "Please let the specialist know in advance.",
    "Что говорят клиенты": "What clients say",
    "Запись и связь": "Booking & contact",
    "Позвонить": "Call",
    "Локация": "Location",
    "Яндекс Карты": "Yandex Maps",
    "Адрес и маршрут": "Address & route",
    "Построить маршрут": "Build route",
    "Выбрать время онлайн": "Choose a time online",
    "Как вам удобнее записаться?": "How would you like to book?",
    "Выберите удобный способ связи": "Choose a convenient contact method",
    "Закрыть": "Close",
    "Галерея": "Gallery",
    "Открыто до": "Open until",
    "Закрыто до": "Closed until",
    "Создано в": "Created with",
    "Открыть свободное время": "Open available times",
    "Все отзывы": "All reviews",
    "клиенты": "clients",
    "Запишитесь онлайн": "Book online",
    "или свяжитесь любым удобным способом": "or contact us in the way that works for you",
    "Запишитесь онлайн или свяжитесь любым удобным способом.": "Book online or contact the master in any convenient way.",
    "эксперт по волосам": "hair expert",
    "эксперт по маникюру и педикюру": "manicure and pedicure expert",
    "Стрижки, окрашивание, блонд, уход и укладки с вниманием к состоянию волос, оттенку и вашему образу.": "Haircuts, coloring, blonding, care and styling with attention to hair condition, tone and your look.",
    "Специализируюсь на стрижках и окрашивании, blond и сложных техниках, уходе и реконструкции волос.": "I specialize in haircuts and coloring, blond and advanced techniques, hair care and reconstruction.",
    "Работаю с формой, цветом и состоянием волос, чтобы результат выглядел цельно и подходил именно вам.": "I work with shape, color and hair condition so the result looks cohesive and suits you.",
    "Стрижки и окрашивание": "Haircuts and coloring",
    "Blond и сложные техники": "Blond and advanced techniques",
    "Уход и реконструкция волос": "Hair care and reconstruction",
    "Выполняю маникюр и педикюр, наращивание и коррекцию ногтей.": "I provide manicure and pedicure, nail extensions and correction.",
    "Работаю со стерильными инструментами и уделяю внимание аккуратности, форме и качеству результата.": "I work with sterile instruments and pay attention to neatness, shape and quality of the result.",
    "Маникюр и педикюр": "Manicure and pedicure",
    "Наращивание и коррекция": "Extensions and correction",
    "Стерильные инструменты": "Sterile instruments",
    "По предварительной записи": "By appointment",
    "Написать": "Message",
    "Категории услуг": "Service categories",
    "Разведите двумя пальцами, чтобы увеличить": "Pinch with two fingers to zoom",
    "Предыдущая фотография": "Previous photo",
    "Следующая фотография": "Next photo",
    "Закрыть фотографию": "Close photo",
    "Закрыть галерею": "Close gallery",
    "Открыть меню": "Open menu",
    "Закрыть меню": "Close menu",
    "Свяжитесь удобным способом": "Contact in the way that works for you",
    "Позвоните или напишите мастеру, чтобы согласовать услугу и время.": "Call or message the master to arrange the service and time.",
    "Выберите свободное время онлайн. Если нужно уточнить услугу, свяжитесь с мастером напрямую.": "Choose an available time online. If you need help with a service, contact the master directly.",
    "Запись через": "Booking via",
    "по предварительной записи": "by appointment",
    "Все отзывы в": "All reviews on",
    "Зажмите ленту мышью и двигайте в любую сторону": "Hold and drag the review strip in either direction",
  };
  const translatedText = (value: string) => {
    if (!value) return value;
    if (locale === "ru") return value;
    const configured = (site.i18n?.translations as Record<string, Record<string, string>> | undefined)?.[locale]?.[value];
    if (configured) return configured;
    if (locale === "en" && baseEnglish[value]) return baseEnglish[value];
    return value;
  };
  const localizedMasterName = masterNameForLocale(site, locale) || "TANEM";
  const localizedBrandName = site.brand.name || localizedMasterName || "TANEM";
  const translatedCountText = (key: string, count: number) => {
    if (locale === "ru") {
      const mod10 = count % 10;
      const mod100 = count % 100;
      const noun = mod10 === 1 && mod100 !== 11
        ? "услугу"
        : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
          ? "услуги"
          : "услуг";
      return `Открыть ещё ${count} ${noun}`;
    }
    return translatedText(key).replace("{count}", String(count));
  };
  const introText = String(localizedBrandName).trim();
  const introTextLengthClass = introText.length > 28 ? " is-very-long" : introText.length > 18 ? " is-long" : "";
  const bookingHref = siteBookingMode === "direct" ? bookingUrl : "#booking-options";
  const handleBookingClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (siteBookingMode === "direct") return;
    event.preventDefault();
    setBookingOpen(true);
  };
  const serviceHref = (service: Service) => serviceBookingUrl(service, site) || "#booking-options";
  const handleServiceClick = (event: ReactMouseEvent<HTMLAnchorElement>, service: Service) => {
    if (serviceBookingUrl(service, site)) return;
    event.preventDefault();
    setBookingOpen(true);
  };

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const previousOverflow = document.body.style.overflow;
    let restored = false;
    const showTimer = window.setTimeout(() => setIntroVisible(true), 0);
    document.body.style.overflow = "hidden";

    const restoreScroll = () => {
      if (restored) return;
      restored = true;
      document.body.style.overflow = previousOverflow;
    };

    const timer = window.setTimeout(() => {
      restoreScroll();
      setIntroVisible(false);
    }, 2300);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(timer);
      restoreScroll();
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    const viewport = desktopGalleryViewportRef.current;
    const track = desktopGalleryTrackRef.current;
    const firstSet = track?.querySelector<HTMLElement>(".dct-gallery-set");
    if (!viewport || !track || !firstSet) return;

    let frame = 0;
    let lastFrame = 0;
    const renderPosition = (nextOffset: number) => {
      const setWidth = desktopGallerySetWidthRef.current;
      if (setWidth) {
        while (nextOffset <= -setWidth * 2) nextOffset += setWidth;
        while (nextOffset > 0) nextOffset -= setWidth;
      }
      desktopGalleryOffsetRef.current = nextOffset;
      track.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
    };

    const measure = () => {
      const nextWidth = firstSet.getBoundingClientRect().width;
      if (!nextWidth) return;
      const previousWidth = desktopGallerySetWidthRef.current;
      desktopGallerySetWidthRef.current = nextWidth;
      renderPosition(previousWidth ? (desktopGalleryOffsetRef.current / previousWidth) * nextWidth : -nextWidth);
    };

    const move = (time: number) => {
      if (!lastFrame) lastFrame = time;
      const elapsed = Math.min(time - lastFrame, 34);
      lastFrame = time;
      if (!desktopGalleryPausedRef.current && document.visibilityState === "visible") {
        renderPosition(desktopGalleryOffsetRef.current - elapsed * .038);
      }
      frame = window.requestAnimationFrame(move);
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    measure();
    frame = window.requestAnimationFrame(move);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const finalBook = finalBookRef.current;
    if (!hero || !finalBook) return;

    let frame = 0;
    const updateSticky = () => {
      frame = 0;
      const heroPassed = hero.getBoundingClientRect().bottom <= 0;
      const bookingTop = finalBook.getBoundingClientRect().top;
      const bookingIsApproaching = bookingTop <= window.innerHeight + 96;
      setStickyVisible(heroPassed && !bookingIsApproaching);
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateSticky);
    };

    updateSticky();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  useEffect(() => {
    if (!site.location.scheduleCapitalized || !site.location.openTime || !site.location.closeTime) return;

    const updateStatus = () => {
      const parts = new Intl.DateTimeFormat("ru-RU", {
        timeZone: site.location.timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date());
      const hours = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
      const minutes = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
      const minuteOfDay = hours * 60 + minutes;
      setOpenStatus({ isOpen: minuteOfDay >= openMinutes && minuteOfDay < closeMinutes });
    };

    const frame = window.requestAnimationFrame(updateStatus);
    const timer = window.setInterval(updateStatus, 60_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const overlayOpen = bookingOpen || galleryOpen || lightboxIndex !== null;

  useEffect(() => {
    if (!overlayOpen) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const previous = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      bodyOverflow: document.body.style.overflow,
      scrollBehavior: document.documentElement.style.scrollBehavior,
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.scrollBehavior = "auto";
      document.documentElement.style.overflow = previous.htmlOverflow;
      document.body.style.position = previous.bodyPosition;
      document.body.style.top = previous.bodyTop;
      document.body.style.left = previous.bodyLeft;
      document.body.style.right = previous.bodyRight;
      document.body.style.width = previous.bodyWidth;
      document.body.style.overflow = previous.bodyOverflow;
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
      requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior = previous.scrollBehavior;
      });
    };
  }, [overlayOpen]);

  useEffect(() => {
    const section = promotionSectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = Boolean(entry?.isIntersecting);
        setPromotionInView(isVisible);
        if (!isVisible) setPromotionHinting(false);
      },
      { threshold: 0.24 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!promotionInView || activePromotion !== 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let settleTimer = 0;
    const showHint = () => {
      setPromotionHinting(true);
      settleTimer = window.setTimeout(() => {
        setPromotionHinting(false);
      }, 1150);
    };
    const hintTimer = window.setInterval(showHint, 4_000);

    return () => {
      window.clearInterval(hintTimer);
      window.clearTimeout(settleTimer);
    };
  }, [activePromotion, promotionActivity, promotionInView]);

  useEffect(() => {
    const viewport = reviewViewportRef.current;
    const track = reviewTrackRef.current;
    const firstSet = track?.querySelector<HTMLElement>(".mct-review-set");
    if (!viewport || !track || !firstSet) return;

    let frame = 0;
    let lastFrame = 0;
    const renderPosition = (nextOffset: number) => {
      const setWidth = reviewSetWidthRef.current;
      if (setWidth) {
        while (nextOffset <= -setWidth * 3) nextOffset += setWidth * 2;
        while (nextOffset > -setWidth) nextOffset -= setWidth * 2;
      }
      reviewOffsetRef.current = nextOffset;
      track.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
    };

    const measure = () => {
      const nextWidth = firstSet.getBoundingClientRect().width;
      if (!nextWidth) return;
      const previousWidth = reviewSetWidthRef.current;
      reviewSetWidthRef.current = nextWidth;
      renderPosition(previousWidth ? (reviewOffsetRef.current / previousWidth) * nextWidth : -nextWidth * 2);
    };

    const move = (time: number) => {
      if (!lastFrame) lastFrame = time;
      const elapsed = Math.min(time - lastFrame, 34);
      lastFrame = time;

      if (!reviewsPausedRef.current && document.visibilityState === "visible") {
        renderPosition(reviewOffsetRef.current - elapsed * 0.032);
      }
      frame = window.requestAnimationFrame(move);
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    measure();
    frame = window.requestAnimationFrame(move);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      if (reviewResumeTimerRef.current !== null) window.clearTimeout(reviewResumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let saved = "";
      try { saved = localStorage.getItem("tanem-master-locale") || ""; } catch {}
      const browserLanguages = navigator.languages?.length ? Array.from(navigator.languages) : [navigator.language || ""];
      setLocale(chooseInitialLocale(site, browserLanguages, saved));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem("tanem-master-locale", locale); } catch {}
  }, [locale]);

  const chooseLocale = (next: string) => {
    if (!languages.some((item) => item.code === next)) return;
    setLocale(next);
  };

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".mct-reveal"));
    if (!elements.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!bookingOpen && !galleryOpen && lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (lightboxIndex !== null) setLightboxIndex(null);
        else if (galleryOpen) setGalleryOpen(false);
        else setBookingOpen(false);
      }
      if (lightboxIndex !== null && event.key === "ArrowLeft") {
        setLightboxTransform({ scale: 1, x: 0, y: 0 });
        lightboxGestureRef.current.mode = "idle";
        setLightboxIndex((current) => current === null ? null : (current - 1 + lightboxItems.length) % lightboxItems.length);
      }
      if (lightboxIndex !== null && event.key === "ArrowRight") {
        setLightboxTransform({ scale: 1, x: 0, y: 0 });
        lightboxGestureRef.current.mode = "idle";
        setLightboxIndex((current) => current === null ? null : (current + 1) % lightboxItems.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bookingOpen, galleryOpen, lightboxIndex]);

  const switchCategory = (next: string) => {
    setCategory(next);
    setExpanded(false);
  };

  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches || !("IntersectionObserver" in window)) return;
    const tabs = document.querySelector<HTMLElement>(".mct-tabs-scroll");
    if (!tabs) return;

    let nudgeTimer = 0;
    let returnTimer = 0;
    let cancelled = false;

    const cancelHint = () => {
      cancelled = true;
      window.clearTimeout(nudgeTimer);
      window.clearTimeout(returnTimer);
    };

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      if (tabs.scrollWidth <= tabs.clientWidth + 8) return;

      nudgeTimer = window.setTimeout(() => {
        if (cancelled) return;
        tabs.scrollTo({ left: Math.min(54, tabs.scrollWidth - tabs.clientWidth), behavior: "smooth" });
        returnTimer = window.setTimeout(() => {
          if (!cancelled) tabs.scrollTo({ left: 0, behavior: "smooth" });
        }, 620);
      }, 280);
    }, { threshold: 0.6 });

    observer.observe(tabs);
    tabs.addEventListener("pointerdown", cancelHint, { once: true });

    return () => {
      observer.disconnect();
      cancelHint();
      tabs.removeEventListener("pointerdown", cancelHint);
    };
  }, []);

  const updateBeforeAfterIndex = () => {
    const swiper = beforeAfterRef.current;
    if (!swiper) return;

    const swiperRect = swiper.getBoundingClientRect();
    const swiperCenter = swiperRect.left + swiperRect.width / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(swiper.children).forEach((child, index) => {
      const rect = (child as HTMLElement).getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - swiperCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveBeforeAfter((current) => current === nearestIndex ? current : nearestIndex);
  };

  const goToBeforeAfter = (index: number) => {
    const swiper = beforeAfterRef.current;
    const card = swiper?.children[index] as HTMLElement | undefined;
    if (!swiper || !card) return;

    const swiperRect = swiper.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const left = swiper.scrollLeft + (cardRect.left - swiperRect.left) - (swiper.clientWidth - card.clientWidth) / 2;
    swiper.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  };

  const updatePromotionIndex = () => {
    const swiper = promotionRef.current;
    if (!swiper) return;

    const swiperRect = swiper.getBoundingClientRect();
    const swiperCenter = swiperRect.left + swiperRect.width / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(swiper.children).forEach((child, index) => {
      const rect = (child as HTMLElement).getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - swiperCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (activePromotion !== nearestIndex) {
      setActivePromotion(nearestIndex);
      if (nearestIndex !== 0) setPromotionHinting(false);
      setPromotionActivity((value) => value + 1);
    }
  };

  const goToPromotion = (index: number) => {
    const swiper = promotionRef.current;
    const card = swiper?.children[index] as HTMLElement | undefined;
    if (!swiper || !card) return;

    const swiperRect = swiper.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const left = swiper.scrollLeft + (cardRect.left - swiperRect.left) - (swiper.clientWidth - card.clientWidth) / 2;
    setPromotionActivity((value) => value + 1);
    swiper.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  };

  const registerPromotionInteraction = () => {
    setPromotionHinting(false);
    setPromotionActivity((value) => value + 1);
  };

  const openLightbox = (src: string) => {
    const index = lightboxItems.findIndex((item) => item.src === src);
    if (index >= 0) {
      setLightboxTransform({ scale: 1, x: 0, y: 0 });
      lightboxGestureRef.current.mode = "idle";
      setLightboxIndex(index);
    }
  };

  const stepLightbox = (direction: -1 | 1) => {
    if (lightboxTransform.scale > 1.01) return;
    setLightboxTransform({ scale: 1, x: 0, y: 0 });
    lightboxGestureRef.current.mode = "idle";
    setLightboxIndex((current) => current === null ? null : (current + direction + lightboxItems.length) % lightboxItems.length);
  };

  const pauseReviews = (clientX?: number) => {
    if (reviewResumeTimerRef.current !== null) {
      window.clearTimeout(reviewResumeTimerRef.current);
      reviewResumeTimerRef.current = null;
    }
    if (reviewTrackRef.current) reviewTrackRef.current.style.transition = "";
    reviewsPausedRef.current = true;
    setReviewsPaused(true);
    reviewPointerStartRef.current = clientX ?? null;
    reviewScrollStartRef.current = reviewOffsetRef.current;
    reviewWasDraggedRef.current = false;
  };

  const moveReviews = (clientX: number) => {
    const pointerStart = reviewPointerStartRef.current;
    const track = reviewTrackRef.current;
    if (pointerStart === null || !track) return;

    const distance = clientX - pointerStart;
    if (Math.abs(distance) > 7) reviewWasDraggedRef.current = true;

    let nextOffset = reviewScrollStartRef.current + distance;
    const setWidth = reviewSetWidthRef.current;
    if (setWidth) {
      while (nextOffset <= -setWidth * 3) nextOffset += setWidth * 2;
      while (nextOffset > -setWidth) nextOffset -= setWidth * 2;
    }
    reviewOffsetRef.current = nextOffset;
    track.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
  };

  const resumeReviews = () => {
    reviewPointerStartRef.current = null;
    reviewsPausedRef.current = false;
    setReviewsPaused(false);
  };

  const normalizeReviewOffset = (nextOffset: number) => {
    const setWidth = reviewSetWidthRef.current;
    if (setWidth) {
      while (nextOffset <= -setWidth * 3) nextOffset += setWidth * 2;
      while (nextOffset > -setWidth) nextOffset -= setWidth * 2;
    }
    return nextOffset;
  };

  const setReviewOffset = (nextOffset: number) => {
    const track = reviewTrackRef.current;
    if (!track) return;
    const normalized = normalizeReviewOffset(nextOffset);
    reviewOffsetRef.current = normalized;
    track.style.transform = `translate3d(${normalized}px, 0, 0)`;
  };

  const scheduleReviewsResume = (delay = 520) => {
    if (reviewResumeTimerRef.current !== null) window.clearTimeout(reviewResumeTimerRef.current);
    reviewResumeTimerRef.current = window.setTimeout(() => {
      if (reviewTrackRef.current) reviewTrackRef.current.style.transition = "";
      reviewResumeTimerRef.current = null;
      resumeReviews();
    }, delay);
  };

  const setDesktopGalleryOffset = (nextOffset: number) => {
    const track = desktopGalleryTrackRef.current;
    if (!track) return;
    const setWidth = desktopGallerySetWidthRef.current;
    if (setWidth) {
      while (nextOffset <= -setWidth * 2) nextOffset += setWidth;
      while (nextOffset > 0) nextOffset -= setWidth;
    }
    desktopGalleryOffsetRef.current = nextOffset;
    track.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
  };

  const pauseDesktopGallery = (clientX?: number) => {
    desktopGalleryPausedRef.current = true;
    setDesktopGalleryPaused(true);
    desktopGalleryPointerStartRef.current = clientX ?? null;
    desktopGalleryStartOffsetRef.current = desktopGalleryOffsetRef.current;
    desktopGalleryWasDraggedRef.current = false;
  };

  const moveDesktopGallery = (clientX: number) => {
    const start = desktopGalleryPointerStartRef.current;
    if (start === null) return;
    const distance = clientX - start;
    if (Math.abs(distance) > 7) desktopGalleryWasDraggedRef.current = true;
    setDesktopGalleryOffset(desktopGalleryStartOffsetRef.current + distance);
  };

  const resumeDesktopGallery = () => {
    desktopGalleryPointerStartRef.current = null;
    desktopGalleryPausedRef.current = false;
    setDesktopGalleryPaused(false);
  };

  const stepReviews = (direction: -1 | 1) => {
    const track = reviewTrackRef.current;
    if (!track) return;
    const card = reviewViewportRef.current?.querySelector<HTMLElement>(".mct-review-card");
    const step = (card?.getBoundingClientRect().width ?? 440) + 16;
    pauseReviews();
    track.style.transition = "transform 420ms cubic-bezier(.22, .78, .25, 1)";
    setReviewOffset(reviewOffsetRef.current - direction * step);
    scheduleReviewsResume(460);
  };

  const getTouchDistance = (event: ReactTouchEvent<HTMLElement>) => {
    const first = event.touches[0];
    const second = event.touches[1];
    if (!first || !second) return 0;
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  };

  const clampLightboxOffset = (x: number, y: number, scale: number) => {
    const maxX = Math.max(0, (window.innerWidth * (scale - 1)) / 2);
    const maxY = Math.max(0, (window.innerHeight * 0.68 * (scale - 1)) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const startLightboxGesture = (event: ReactTouchEvent<HTMLElement>) => {
    if (event.touches.length >= 2) {
      lightboxGestureRef.current = {
        mode: "pinch",
        startX: 0,
        startY: 0,
        originX: lightboxTransform.x,
        originY: lightboxTransform.y,
        startScale: lightboxTransform.scale,
        startDistance: getTouchDistance(event),
      };
      return;
    }

    const touch = event.touches[0];
    if (!touch) return;
    lightboxGestureRef.current = {
      mode: lightboxTransform.scale > 1.01 ? "pan" : "swipe",
      startX: touch.clientX,
      startY: touch.clientY,
      originX: lightboxTransform.x,
      originY: lightboxTransform.y,
      startScale: lightboxTransform.scale,
      startDistance: 0,
    };
  };

  const moveLightboxGesture = (event: ReactTouchEvent<HTMLElement>) => {
    const gesture = lightboxGestureRef.current;

    if (event.touches.length >= 2) {
      event.preventDefault();
      const distance = getTouchDistance(event);
      if (gesture.mode !== "pinch" || !gesture.startDistance) {
        lightboxGestureRef.current = {
          ...gesture,
          mode: "pinch",
          startScale: lightboxTransform.scale,
          startDistance: distance,
          originX: lightboxTransform.x,
          originY: lightboxTransform.y,
        };
        return;
      }

      const scale = Math.max(1, Math.min(4, gesture.startScale * (distance / gesture.startDistance)));
      const offset = scale <= 1.01 ? { x: 0, y: 0 } : clampLightboxOffset(gesture.originX, gesture.originY, scale);
      setLightboxTransform({ scale, ...offset });
      return;
    }

    const touch = event.touches[0];
    if (!touch || gesture.mode !== "pan") return;
    event.preventDefault();
    const offset = clampLightboxOffset(
      gesture.originX + touch.clientX - gesture.startX,
      gesture.originY + touch.clientY - gesture.startY,
      lightboxTransform.scale,
    );
    setLightboxTransform((current) => ({ ...current, ...offset }));
  };

  const finishLightboxGesture = (event: ReactTouchEvent<HTMLElement>) => {
    const gesture = lightboxGestureRef.current;

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      lightboxGestureRef.current = {
        ...gesture,
        mode: lightboxTransform.scale > 1.01 ? "pan" : "idle",
        startX: touch.clientX,
        startY: touch.clientY,
        originX: lightboxTransform.x,
        originY: lightboxTransform.y,
      };
      return;
    }

    if (gesture.mode === "swipe" && lightboxTransform.scale <= 1.01) {
      const touch = event.changedTouches[0];
      const distanceX = (touch?.clientX ?? gesture.startX) - gesture.startX;
      const distanceY = (touch?.clientY ?? gesture.startY) - gesture.startY;
      if (Math.abs(distanceX) > 42 && Math.abs(distanceX) > Math.abs(distanceY)) {
        stepLightbox(distanceX > 0 ? -1 : 1);
      }
    }

    if (lightboxTransform.scale <= 1.01) setLightboxTransform({ scale: 1, x: 0, y: 0 });
    lightboxGestureRef.current.mode = "idle";
  };

  return (
    <div className="mct-mobile">
      {introVisible && (
        <div className="mct-intro" aria-hidden="true">
          <div className="mct-intro-mark mct-intro-mark-master">
            {hasLogo(site)
              ? <img className="mct-intro-logo-master" src={site.images.logo} alt="" />
              : <span className={`mct-intro-text-master${introTextLengthClass}`}>{introText}</span>}
          </div>
        </div>
      )}

      <header className="mct-hero" id="mobile-top" ref={heroRef}>
        <div className="mct-shell">
          <div className="mct-topbar">
            <a className={`mct-brand${hasLogo(site) ? " mct-brand-master-image" : " mct-brand-master-text"}`} href="#mobile-top" aria-label={`${localizedMasterName}, наверх`}>
              {hasLogo(site) ? <img src={site.images.logo} alt="" /> : <span>{localizedBrandName}</span>}
            </a>
            <nav className="dct-navigation" aria-label="Основные разделы сайта">
              <a href="#mobile-prices">{translatedText("Услуги и цены")}</a>
              <a href="#mobile-about">{translatedText("О мастере")}</a>
              <a href="#mobile-reviews">{translatedText("Отзывы")}</a>
              <a href="#mobile-location">{translatedText("Визит и запись")}</a>
            </nav>
            <div className="dct-top-actions" aria-label={`Быстрые способы связи с ${localizedMasterName}`}>
              {languages.length > 1 ? (
                <div className="mct-lang-switch is-desktop" role="group" aria-label="Language">
                  {languages.map((item, index) => (
                    <span className="mct-lang-item" key={`desktop-${item.code}`}>
                      {index > 0 ? <span className="mct-lang-sep" aria-hidden="true">/</span> : null}
                      <button type="button" className={locale === item.code ? "is-active" : ""} aria-pressed={locale === item.code} onClick={() => chooseLocale(item.code)}>{item.label}</button>
                    </span>
                  ))}
                </div>
              ) : null}
              {bookingContacts.find((item) => item.kind === "phone") ? (
                <a className="dct-top-phone" href={bookingContacts.find((item) => item.kind === "phone")!.url} aria-label={`Позвонить ${site.master.dative} по номеру ${site.contacts.phoneDisplay}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.1 3.5 9.3 8c.2.5.1 1-.3 1.4l-1.4 1.2c1 2.1 2.7 3.8 4.8 4.8l1.2-1.4c.4-.4.9-.5 1.4-.3l4.5 2.2c.5.2.8.8.6 1.4l-.6 2.3c-.2.7-.8 1.1-1.5 1.1C10 20.7 3.3 14 3.3 6c0-.7.4-1.3 1.1-1.5l2.3-.6c.6-.2 1.2.1 1.4.6Z" /></svg>
                  <span><small>{translatedText("Позвонить")}</small><strong>{site.contacts.phoneDisplay}</strong></span>
                </a>
              ) : null}
              {bookingContacts.find((item) => item.kind !== "phone") ? (
                <a className="dct-top-icon" href={bookingContacts.find((item) => item.kind !== "phone")!.url} target="_blank" rel="noopener noreferrer" aria-label={bookingContacts.find((item) => item.kind !== "phone")!.label} title={bookingContacts.find((item) => item.kind !== "phone")!.label}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>
                </a>
              ) : null}
              {mapUrl ? (
                <a className="dct-top-icon" href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`Открыть адрес ${site.master.genitive} в Яндекс Картах`} title="Яндекс Карты">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                </a>
              ) : null}
            </div>
            {languages.length > 1 ? (
              <div className="mct-lang-switch is-mobile" role="group" aria-label="Language">
                {languages.map((item, index) => (
                  <span className="mct-lang-item" key={item.code}>
                    {index > 0 ? <span className="mct-lang-sep" aria-hidden="true">/</span> : null}
                    <button type="button" className={locale === item.code ? "is-active" : ""} aria-pressed={locale === item.code} onClick={() => chooseLocale(item.code)}>{item.label}</button>
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mct-menu-wrap" ref={menuRef}>
              <button
                className={`mct-menu-button${menuOpen ? " is-open" : ""}`}
                type="button"
                aria-label={translatedText(menuOpen ? "Закрыть меню" : "Открыть меню")}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMenuOpen((value) => !value)}
              >
                <span /><span /><span />
              </button>
              {menuOpen && (
                <nav className="mct-menu-panel" id="mobile-navigation" aria-label="Разделы сайта">
                  <a href="#mobile-portfolio" onClick={() => setMenuOpen(false)}><span>•</span>{translatedText("Портфолио")}</a>
                  <a href="#mobile-prices" onClick={() => setMenuOpen(false)}><span>•</span>{translatedText("Услуги и цены")}</a>
                  <a href="#mobile-about" onClick={() => setMenuOpen(false)}><span>•</span>{translatedText("О мастере")}</a>
                  <a href="#mobile-reviews" onClick={() => setMenuOpen(false)}><span>•</span>{translatedText("Отзывы")}</a>
                  <a href="#mobile-location" onClick={() => setMenuOpen(false)}><span>•</span>{translatedText("Визит и запись")}</a>
                </nav>
              )}
            </div>
          </div>
          <div className="mct-hero-content">
            <div className="mct-hero-meta">
              <span>{translatedText(site.location.city)}</span>
              {bookingContacts.find((item) => item.kind === "phone") ? (
                <a className="mct-hero-phone" href={bookingContacts.find((item) => item.kind === "phone")!.url} aria-label={`Позвонить ${site.master.dative} по номеру ${site.contacts.phoneDisplay}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M7.1 3.5 9.3 8c.2.5.1 1-.3 1.4l-1.4 1.2c1 2.1 2.7 3.8 4.8 4.8l1.2-1.4c.4-.4.9-.5 1.4-.3l4.5 2.2c.5.2.8.8.6 1.4l-.6 2.3c-.2.7-.8 1.1-1.5 1.1C10 20.7 3.3 14 3.3 6c0-.7.4-1.3 1.1-1.5l2.3-.6c.6-.2 1.2.1 1.4.6Z" />
                  </svg>
                  <span>{site.contacts.phoneDisplay}</span>
                </a>
              ) : null}
            </div>
            <h1>{localizedMasterName}{site.master.name ? " — " : ""}{translatedText("ваш")} <em>{translatedText(siteHeroPreset.emphasis)}</em></h1>
            <p className="mct-hero-copy">{translatedText(siteHeroPreset.copy)}</p>
          </div>
          <div
            className="mct-hero-visual"
          >
            {siteSpecialtyMode === "hair" && site.images.heroDecoration ? (
              <div className="mct-master-tools" aria-hidden="true"><img className="mct-master-hero-image" src={site.images.heroDecoration} alt="" /></div>
            ) : null}
            <figure className="dct-hero-portrait">
              <img src={resolvedImages.hero} alt={`${localizedMasterName} — ${translatedText(site.master.imageAlt)}`} />
              <figcaption><span>{localizedMasterName}</span><small>{translatedText(site.master.heroCaption)}</small></figcaption>
            </figure>
            {siteSpecialtyMode === "nails" ? <div className="mct-palette-stage" aria-hidden="true">
              <div className="mct-palette-set">
                {paletteSamples.map((shade, index) => {
                  const leftAngle = -47 + (94 / (paletteSamples.length - 1)) * index;
                  const rightAngle = -leftAngle;
                  const armGradientId = `mct-palette-arm-${index}`;
                  const tipGradientId = `mct-palette-tip-${index}`;
                  const tipGlossId = `mct-palette-gloss-${index}`;
                  const armGlowId = `mct-palette-arm-glow-${index}`;
                  const tipBloomId = `mct-palette-bloom-${index}`;

                  return (
                    <span
                      className="mct-palette-stick"
                      key={`${shade.base}-${index}`}
                      style={{
                        "--left-angle": `${leftAngle}deg`,
                        "--right-angle": `${rightAngle}deg`,
                        "--stack": index + 1,
                      } as CSSProperties}
                    >
                      <svg viewBox="0 0 54 320" aria-hidden="true" focusable="false">
                        <defs>
                          <linearGradient id={armGradientId} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#a7a39d" stopOpacity=".42" />
                            <stop offset="0.13" stopColor="#e8e6e1" stopOpacity=".66" />
                            <stop offset="0.38" stopColor="#fffefb" stopOpacity=".84" />
                            <stop offset="0.62" stopColor="#f4f2ed" stopOpacity=".68" />
                            <stop offset="0.87" stopColor="#d2cec7" stopOpacity=".5" />
                            <stop offset="1" stopColor="#96918a" stopOpacity=".48" />
                          </linearGradient>
                          <linearGradient id={armGlowId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#fff" stopOpacity=".82" />
                            <stop offset=".45" stopColor="#fff" stopOpacity=".2" />
                            <stop offset="1" stopColor="#fff" stopOpacity=".55" />
                          </linearGradient>
                          <linearGradient id={tipGradientId} x1="0" y1="0" x2="1" y2="0.12">
                            <stop offset="0" stopColor={shade.light} />
                            <stop offset="0.22" stopColor={shade.base} />
                            <stop offset="0.7" stopColor={shade.base} />
                            <stop offset="1" stopColor={shade.dark} />
                          </linearGradient>
                          <linearGradient id={tipGlossId} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#fff" stopOpacity="0" />
                            <stop offset="0.31" stopColor="#fff" stopOpacity=".76" />
                            <stop offset="0.5" stopColor="#fff" stopOpacity=".17" />
                            <stop offset="1" stopColor="#fff" stopOpacity="0" />
                          </linearGradient>
                          <radialGradient id={tipBloomId} cx="38%" cy="22%" r="74%">
                            <stop offset="0" stopColor="#fff" stopOpacity=".34" />
                            <stop offset=".5" stopColor={shade.base} stopOpacity=".05" />
                            <stop offset="1" stopColor={shade.dark} stopOpacity=".2" />
                          </radialGradient>
                        </defs>
                        <path
                          className="mct-palette-arm"
                          d="M17 75 Q17 68 22 64 H32 Q37 68 37 75 V87 Q37 92 41 98 L43 307 Q43 316 35 318 H19 Q11 316 11 307 L13 98 Q17 92 17 87 Z"
                          fill={`url(#${armGradientId})`}
                        />
                        <path className="mct-palette-arm-glow" d="M20 76 Q20 70 24 68 H28 L29 309 Q29 314 25 315 H21 Q16 313 16 306 L18 99 Q20 92 20 86 Z" fill={`url(#${armGlowId})`} />
                        <path className="mct-palette-arm-light" d="M18 78 Q18 91 15 99 L15 305 Q15 312 21 314" />
                        <path className="mct-palette-arm-edge" d="M36 76 Q36 91 39 99 L42 305 Q42 312 36 315" />
                        <path className="mct-palette-tip-cast" d="M10 56 Q10 49 16 47 H38 Q44 49 44 56 V70 Q44 81 36 88 H18 Q10 81 10 70 Z" />
                        <path
                          className="mct-palette-tip"
                          d="M12 22 C12 9 18 3 27 3 C36 3 42 9 42 22 V57 C42 74 36 86 27 92 C18 86 12 74 12 57 Z"
                          fill={`url(#${tipGradientId})`}
                        />
                        <path className="mct-palette-tip-bloom" d="M13 22 C13 10 19 4 27 4 C35 4 41 10 41 22 V56 C41 72 35 83 27 89 C19 83 13 72 13 56 Z" fill={`url(#${tipBloomId})`} />
                        <path className="mct-palette-tip-shade" d="M35 6 Q41 12 41 23 V56 Q41 72 34 82 Q37 62 36 39 Q36 17 35 6 Z" />
                        <path
                          className="mct-palette-tip-gloss"
                          d="M19 8 Q14 19 15 43 Q15 67 20 79 Q23 84 25 75 Q21 55 22 34 Q22 16 24 7 Q21 6 19 8 Z"
                          fill={`url(#${tipGlossId})`}
                        />
                        <path className="mct-palette-tip-highlight" d="M19 8 Q27 2 35 8" />
                        <path className="mct-palette-tip-rim" d="M13 23 Q13 10 22 5 M41 23 Q41 10 32 5" />
                      </svg>
                    </span>
                  );
                })}
              </div>
            </div> : null}
          </div>
          <div className="mct-hero-bottom">
            <div className="mct-hero-actions">
              <a className="mct-main-cta" href={bookingHref} target={siteBookingMode === "direct" ? "_blank" : undefined} rel={siteBookingMode === "direct" ? "noopener noreferrer" : undefined} onClick={handleBookingClick}>{translatedText("Записаться онлайн")}&nbsp; →</a>
              <a className="mct-quiet-link" href="#mobile-portfolio">{translatedText("Смотреть все работы")} ↓</a>
            </div>
            <div className={`mct-stats${siteExperienceMode === "unknown" ? " is-two-stats" : ""}`} aria-label="Опыт и рейтинг мастера">
              {siteExperienceMode === "known" ? <div className="mct-stat"><strong>{site.master.experienceYears}</strong><span>{translatedText("лет опыта")}</span></div> : null}
              <div className="mct-stat"><strong>{site.reputation.rating} <i className="mct-stat-star">★</i></strong><span>{translatedText("рейтинг")}</span></div>
              <div className="mct-stat"><strong>{allServices.length}</strong><span>{translatedText("услуги")}</span></div>
            </div>
          </div>
        </div>
      </header>

      <section className="mct-section" id="mobile-portfolio">
        <div className="mct-shell mct-reveal">
          <div className="mct-section-head">
            <div><p className="mct-section-kicker">{translatedText("Портфолио")}</p><h2>{translatedText("Работы")}</h2></div>
            
          </div>
        </div>
        <div className="mct-shell mct-reveal">
          <div className={`mct-work-grid${galleryWorks.length === 0 ? " is-empty" : ""}`} aria-label="Подборка работ">
            {featuredWorks.length > 0 ? featuredWorks.map((item) => (
              <button className="mct-work-tile" type="button" key={item.src} onClick={() => openLightbox(item.src)} aria-label={`Открыть фотографию: ${item.alt}`}>
                <img src={item.src} alt={item.alt} loading="lazy" />
              </button>
            )) : Array.from({ length: 7 }, (_, index) => (
              <span className="mct-work-tile mct-work-placeholder" aria-hidden="true" key={`portfolio-placeholder-${index}`} />
            ))}
          </div>
          <div className="dct-film-strip" aria-label={`Бесконечная галерея работ ${site.master.genitive}`}>
            <div
              className={`dct-gallery-viewport${desktopGalleryPaused ? " is-paused" : ""}`}
              ref={desktopGalleryViewportRef}
              onMouseEnter={() => pauseDesktopGallery()}
              onMouseLeave={() => { if (desktopGalleryPointerStartRef.current === null) resumeDesktopGallery(); }}
              onPointerDown={(event) => {
                if (!event.isPrimary) return;
                if (event.pointerType === "mouse") event.preventDefault();
                pauseDesktopGallery(event.clientX);
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!event.isPrimary || desktopGalleryPointerStartRef.current === null) return;
                if (event.pointerType === "mouse") event.preventDefault();
                moveDesktopGallery(event.clientX);
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                resumeDesktopGallery();
              }}
              onPointerCancel={resumeDesktopGallery}
              onLostPointerCapture={resumeDesktopGallery}
              onDragStart={(event) => event.preventDefault()}
            >
              <div className="dct-gallery-track" ref={desktopGalleryTrackRef}>
                {Array.from({ length: desktopGallerySetCount }, (_, setIndex) => (
                  <div className="dct-gallery-set" key={`gallery-set-${setIndex}`} aria-hidden={setIndex !== 1}>
                    {desktopGalleryModules.map((module, moduleIndex) => (
                      <div className={`dct-gallery-module dct-gallery-module-${moduleIndex + 1}`} key={`gallery-module-${setIndex}-${moduleIndex}`}>
                        {module.map((item, itemIndex) => (
                          <button
                            className={`dct-film-frame dct-film-frame-${itemIndex + 1}`}
                            type="button"
                            key={`${setIndex}-${item.src}`}
                            onClick={(event) => {
                              if (desktopGalleryWasDraggedRef.current) {
                                event.preventDefault();
                                desktopGalleryWasDraggedRef.current = false;
                                return;
                              }
                              openLightbox(item.src);
                            }}
                            aria-label={`Открыть фотографию: ${item.alt}`}
                            tabIndex={setIndex === 1 ? 0 : -1}
                          >
                            <img src={item.src} alt={item.alt} loading="lazy" draggable="false" />
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button className="mct-gallery-button" type="button" onClick={() => setGalleryOpen(true)}><span>{translatedText("Смотреть все работы")}</span><span aria-hidden="true">→</span></button>
        </div>
      </section>

      <section className="mct-prices mct-reveal" id="mobile-prices">
        <div className="mct-shell">
          <div className="mct-price-head">
            <p className="mct-section-kicker">{translatedText("Услуги и цены")}</p>
            <h2>{translatedText("Выберите услугу")}</h2>
            <span>{siteBookingMode === "direct"
              ? translatedText("Актуальная стоимость и продолжительность указаны для каждой процедуры. Онлайн-запись откроется в новой вкладке.")
              : translatedText("Стоимость и продолжительность указаны для каждой процедуры. Нажмите на услугу, чтобы выбрать способ связи.")}</span>
          </div>
          {serviceCategoryMode !== "single" ? (
            <div className={`mct-tabs-ribbon-wrap is-${serviceCategoryMode}`}>
              {serviceCategoryMode === "many" ? (
                <span className="mct-tabs-swipe-cue" aria-hidden="true">
                  <svg viewBox="0 0 18 10" fill="none"><path d="M1 5h14M11 1.5 15 5l-4 3.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              ) : null}
              <div className={`mct-tabs mct-tabs-scroll is-${serviceCategoryMode}`} role="tablist" aria-label="Категории услуг">
                <div className="mct-tabs-track" role="presentation" style={{ "--mct-category-count": Math.max(serviceGroups.length, 1) } as CSSProperties}>
                  {serviceCategoryMode === "many" ? (
                    <button className={`mct-tab mct-tab-all${category === "all" ? " is-active" : ""}`} type="button" role="tab" aria-selected={category === "all"} onClick={() => switchCategory("all")}>{translatedText("Все")}</button>
                  ) : null}
                  {serviceGroups.map((group) => (
                    <button className={`mct-tab${category === group.id ? " is-active" : ""}`} type="button" role="tab" aria-selected={category === group.id} onClick={() => switchCategory(group.id)} key={group.id}>{translatedText(group.label)}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <div className={`mct-service-list${isCollapsibleCategory && !expanded ? " is-collapsed" : " is-expanded"}`}>
            {visibleServices.map((service) => {
              const hasVariants = Boolean(service.variants?.length);
              const serviceKey = `${service.sectionKey ?? category}-${service.name}`;
              const hasDescription = Boolean(service.description);
              const descriptionIsLong = service.description.length > 100;
              const descriptionExpanded = Boolean(expandedDescriptions[serviceKey]);
              return (
                <a className={`mct-service-row master-price-row master-service-link${service.sectionLabel ? " has-group-label" : ""}${hasVariants ? " has-variants" : ""}${hasDescription ? " has-description" : ""}${descriptionExpanded ? " description-expanded" : ""}`} href={serviceHref(service)} target={serviceBookingUrl(service, site) ? "_blank" : undefined} rel={serviceBookingUrl(service, site) ? "noopener noreferrer" : undefined} onClick={(event) => handleServiceClick(event, service)} aria-label={`${service.name} — открыть запись`} key={serviceKey}>
                  {service.sectionLabel && <div className="mct-service-group-label">{service.sectionLabel}</div>}
                  <div className="master-service-body">
                    <div className="master-service-head">
                      <strong className="master-service-title">{translatedText(service.displayName || service.name)}</strong>
                      {!hasVariants && <b className="master-service-price mct-mobile-service-price">{service.price}</b>}
                    </div>
                    <div className={`dct-service-description-slot${hasDescription ? " has-copy" : " is-empty"}`}>
                      {hasDescription && <p className={`dct-service-description master-service-description${service.detailClass === "contouring" ? " master-contouring-detail" : ""}`}>{translatedText(service.description)}</p>}
                      {descriptionIsLong && (
                        <span
                          className="dct-service-description-toggle"
                          role="button"
                          tabIndex={0}
                          aria-expanded={descriptionExpanded}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setExpandedDescriptions((current) => ({ ...current, [serviceKey]: !current[serviceKey] }));
                          }}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            event.stopPropagation();
                            setExpandedDescriptions((current) => ({ ...current, [serviceKey]: !current[serviceKey] }));
                          }}
                        >{translatedText(descriptionExpanded ? "Свернуть" : "Продолжить")}</span>
                      )}
                    </div>
                    {!hasVariants && service.time && <small className="master-service-time mct-mobile-service-time">{translatedText(service.time)}</small>}
                    {!hasVariants && (
                      <div className="dct-service-meta" aria-hidden="true">
                        {service.time && <small className="master-service-time">{translatedText(service.time)}</small>}
                        <b className="master-service-price">{service.price}</b>
                      </div>
                    )}
                    {hasVariants && (
                      <div className="master-service-variants">
                        {service.variants!.map((item) => (
                          <div className="master-service-variant" key={item.label}>
                            <span>{translatedText(item.label)}{item.time ? <small className="mct-mobile-variant-time">{translatedText(item.time)}</small> : null}</span>
                            <b className="mct-mobile-variant-price">{item.price}</b>
                            <span className="dct-service-variant-meta" aria-hidden="true">
                              {item.time ? <small>{translatedText(item.time)}</small> : null}
                              <b>{item.price}</b>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
          <div className="dct-service-groups" aria-label="Услуги по категориям на компьютере">
            {desktopServiceGroups.map((group) => {
              const groupServices = group.services;
              if (!groupServices.length) return null;

              return (
                <section className="dct-service-category" key={`desktop-${group.id}`}>
                  {category === "all" && (
                    <div className="dct-service-category-heading">
                      <span>{group.label}</span><i aria-hidden="true" />
                    </div>
                  )}
                  <div className="dct-service-category-list">
                    {groupServices.map((service) => {
                      const hasVariants = Boolean(service.variants?.length);
                      const serviceKey = `desktop-${group.id}-${service.name}`;
                      const hasDescription = Boolean(service.description);
                      const descriptionIsLong = service.description.length > 100;
                      const descriptionExpanded = Boolean(expandedDescriptions[serviceKey]);

                      return (
                        <a
                          className={`dct-service-card${hasVariants ? " has-variants" : ""}${hasDescription ? " has-description" : ""}${descriptionExpanded ? " description-expanded" : ""}`}
                          href={service.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${service.name} — открыть запись в ${site.template.bookingProvider}`}
                          key={serviceKey}
                        >
                          <div className="dct-service-card-body">
                            <strong className="dct-service-card-title">{translatedText(service.displayName || service.name)}</strong>
                            <div className={`dct-service-card-description${hasDescription ? " has-copy" : " is-empty"}`}>
                              {hasDescription && <p>{translatedText(service.description)}</p>}
                              {descriptionIsLong && (
                                <span
                                  className="dct-service-description-toggle"
                                  role="button"
                                  tabIndex={0}
                                  aria-expanded={descriptionExpanded}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setExpandedDescriptions((current) => ({ ...current, [serviceKey]: !current[serviceKey] }));
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key !== "Enter" && event.key !== " ") return;
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setExpandedDescriptions((current) => ({ ...current, [serviceKey]: !current[serviceKey] }));
                                  }}
                                >{translatedText(descriptionExpanded ? "Свернуть" : "Подробнее")}</span>
                              )}
                            </div>
                            {hasVariants ? (
                              <div className="dct-service-card-variants">
                                {service.variants!.map((item) => (
                                  <div className="dct-service-card-variant" key={item.label}>
                                    <span>{translatedText(item.label)}</span>
                                    <span className="dct-service-card-variant-meta">
                                      {item.time ? <small>{translatedText(item.time)}</small> : null}
                                      <b>{item.price}</b>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="dct-service-card-meta">
                                {service.time ? <small>{translatedText(service.time)}</small> : <span aria-hidden="true" />}
                                <b>{service.price}</b>
                              </div>
                            )}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          {isCollapsibleCategory && hiddenServiceCount > 0 && (
            <button className={`mct-more-services${expanded ? " is-open" : ""}`} type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
              {expanded ? translatedText("Свернуть услуги") : (
                <>
                  <span className="mct-more-services-mobile-copy">{translatedCountText("Открыть ещё {count} услуг", hiddenServiceCount)}</span>
                  <span className="mct-more-services-desktop-copy">{translatedCountText("Открыть ещё {count} услуг", hiddenServiceCount)}</span>
                </>
              )}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>
      </section>

      <section className="mct-about mct-reveal" id="mobile-about">
        <div className="mct-shell">
          <div className="mct-about-head">
            <div><p className="mct-section-kicker">{translatedText("О мастере")}</p><h2>{translatedText(site.master.aboutTitle)}</h2></div>
            <span className="mct-about-monogram" aria-hidden="true">{approvedMasterInitial}</span>
          </div>
          <div className="mct-about-card">
            <div className="mct-about-portrait-wrap">
              <figure className="mct-about-portrait">
                <img src={resolvedImages.profile} alt={`${localizedMasterName} — ${translatedText(site.master.imageAlt)}`} loading="lazy" />
              </figure>
              {siteExperienceMode === "known" ? (
                <div className="mct-about-experience" aria-label={site.master.experienceAria}>
                  <strong>{site.master.experienceYears}</strong>
                  <span>{translatedText("лет опыта")}</span>
                </div>
              ) : null}
            </div>
            <div className="mct-about-copy">
              <p className="mct-about-lead">{translatedText(approvedAbout.lead)}</p>
              <p>{translatedText(aboutParagraphs[0] || "")}</p>
              <p>{translatedText(aboutParagraphs[1] || "")}</p>
              {aboutParagraphs[2] && <p className="dct-about-extra-copy">{translatedText(aboutParagraphs[2])}</p>}
              <ul className="mct-about-list">{skills.map((skill) => <li key={skill}>{translatedText(skill)}</li>)}</ul>
              <div className="dct-about-amenities" aria-label={`Дополнительная информация о визите к ${site.master.dative}`}>
                <div className="dct-about-amenities-head"><p className="mct-section-kicker">{translatedText("Дополнительно")}</p><span>{translatedText("Полезно перед записью")}</span></div>
                <div className="dct-about-amenities-grid">
                  {amenities.map((item) => <article key={item.title}><strong>{translatedText(item.title)}</strong><span>{translatedText(item.text)}</span></article>)}
                </div>
              </div>
            </div>
          </div>

          <div className="mct-amenities mct-about-amenities-mobile" aria-label={`О визите к ${site.master.dative}`}>
            <div className="mct-amenities-head"><p className="mct-section-kicker">{translatedText("Дополнительно")}</p><span>{translatedText("Полезно перед записью")}</span></div>
            <div className="mct-amenities-grid">
              {amenities.map((item) => <article key={item.title}><strong>{translatedText(item.title)}</strong><span>{translatedText(item.text)}</span></article>)}
            </div>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="mct-reviews mct-reveal" id="mobile-reviews">
          <div className="mct-shell">
            <p className="mct-section-kicker">{translatedText("Отзывы")}</p><h2>{translatedText("Что говорят клиенты")}</h2>
            {reviewsUrl ? <a className="mct-review-summary" href={reviewsUrl} target="_blank" rel="noopener noreferrer"><span>{translatedText("Все отзывы в")} {site.template.reviewSource || site.template.bookingProvider} →</span></a> : null}
            <p className="dct-review-drag-hint">{translatedText("Зажмите ленту мышью и двигайте в любую сторону")}</p>
            <div className="dct-review-controls" aria-label="Управление лентой отзывов">
              <button type="button" onClick={() => stepReviews(-1)} aria-label="Показать предыдущие отзывы">←</button>
              <button type="button" onClick={() => stepReviews(1)} aria-label="Показать следующие отзывы">→</button>
            </div>
          </div>
          <div
            className={`mct-review-viewport${reviewsPaused ? " is-paused" : ""}`}
            ref={reviewViewportRef}
            aria-label={`Настоящие отзывы клиентов ${site.master.genitive}. Лента движется автоматически, при касании останавливается.`}
            onPointerDown={(event) => {
              if (!event.isPrimary) return;
              pauseReviews(event.clientX);
              if (event.pointerType === "mouse" && window.matchMedia("(min-width: 768px)").matches && !event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.setPointerCapture(event.pointerId);
              }
            }}
            onPointerMove={(event) => {
              if (!event.isPrimary || !reviewsPausedRef.current) return;
              if (reviewPointerStartRef.current !== null && Math.abs(event.clientX - reviewPointerStartRef.current) > 7 && !event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.setPointerCapture(event.pointerId);
              }
              moveReviews(event.clientX);
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              resumeReviews();
            }}
            onPointerCancel={resumeReviews}
            onWheel={(event) => {
              const horizontalDelta = event.shiftKey ? event.deltaY : event.deltaX;
              if (Math.abs(horizontalDelta) < 1 || Math.abs(horizontalDelta) < Math.abs(event.deltaY) * .55) return;
              event.preventDefault();
              pauseReviews();
              setReviewOffset(reviewOffsetRef.current - horizontalDelta * 1.12);
              scheduleReviewsResume();
            }}
          >
            <div className="mct-review-track" ref={reviewTrackRef}>
              {Array.from({ length: reviewSetCount }, (_, setIndex) => (
                <div className="mct-review-set" key={setIndex} aria-hidden={setIndex !== 2}>
                  {reviews.map((review) => {
                    const reviewIsLong = review.text.length > 245;
                    return (
                      <div className="mct-review-pair" key={`${setIndex}-${review.author}`}>
                        <a
                          className={`mct-review-card mct-review-card-mobile${reviewIsLong ? " is-long" : ""}`}
                          href={reviewsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={setIndex === 2 ? 0 : -1}
                          draggable={false}
                          onDragStart={(event) => event.preventDefault()}
                          onClick={(event) => {
                            if (!reviewWasDraggedRef.current) return;
                            event.preventDefault();
                            reviewWasDraggedRef.current = false;
                          }}
                        >
                          <div className="dct-review-card-head mct-mobile-review-head">
                            <strong><span className="mct-mobile-review-name">{review.author}</span><span className="mct-mobile-review-stars" aria-label="5 из 5">★★★★★</span></strong>
                            <small className="mct-mobile-review-source">{review.source || site.template.reviewSource}</small>
                          </div>
                          <blockquote>{review.text}</blockquote>
                          <i>{translatedText("Подробнее")} →</i>
                        </a>

                        <article className={`mct-review-card dct-review-card${reviewIsLong ? " is-long" : ""}`}>
                          <div className="dct-review-card-head">
                            <strong>{review.author} <small>{review.source || site.template.reviewSource}</small></strong>
                            <span aria-label="5 из 5">★★★★★</span>
                          </div>
                          <blockquote>«{review.text}»</blockquote>
                          {reviewIsLong && (
                            <a
                              className="dct-review-continue"
                              href={reviewsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              tabIndex={setIndex === 2 ? 0 : -1}
                              onClick={(event) => {
                                if (!reviewWasDraggedRef.current) return;
                                event.preventDefault();
                                reviewWasDraggedRef.current = false;
                              }}
                            >{translatedText("Продолжить")} →</a>
                          )}
                        </article>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mct-visit mct-reveal" id="mobile-location" ref={finalBookRef} style={{ "--dct-visit-image": `url(${resolvedImages.profile})` } as CSSProperties}>
        <div className="mct-shell">
          <div className="mct-visit-booking mct-visit-booking-desktop-current" id="mobile-booking">
            <div className="mct-visit-booking-top">
              <p className="mct-section-kicker">{translatedText("Запись и связь")}</p>
              {site.location.scheduleCapitalized ? (
                <span className={`mct-open-status${openStatus.isOpen === true ? " is-open" : openStatus.isOpen === false ? " is-closed" : ""}`}>
                  <i aria-hidden="true" />
                  {openStatus.isOpen === true
                    ? `${translatedText("Открыто до")} ${site.location.closeTime}`
                    : openStatus.isOpen === false
                      ? `${translatedText("Закрыто до")} ${site.location.openTime}`
                      : translatedText(site.location.scheduleCapitalized)}
                </span>
              ) : null}
            </div>
            {site.master.visitMotto ? <span className="dct-visit-motto" aria-hidden="true">{translatedText(site.master.visitMotto)}</span> : null}
            <h3>{translatedText("Запишитесь онлайн или свяжитесь любым удобным способом.")}</h3>
            <p>{siteBookingMode === "direct"
              ? translatedText("Выберите свободное время онлайн. Если нужно уточнить услугу, свяжитесь с мастером напрямую.")
              : translatedText("Позвоните или напишите мастеру, чтобы согласовать услугу и время.")}</p>
            <div className="mct-visit-actions">
              <a className="mct-final-cta" href={bookingHref} target={siteBookingMode === "direct" ? "_blank" : undefined} rel={siteBookingMode === "direct" ? "noopener noreferrer" : undefined} onClick={handleBookingClick}><span>{siteBookingMode === "direct" ? translatedText("Выбрать время онлайн") : translatedText("Записаться онлайн")}</span><i className="mct-link-arrow" aria-hidden="true" /></a>
              {siteBookingMode === "direct" && site.template.bookingProvider ? <div className="dct-booking-note" aria-hidden="true"><span>▢</span><small>{translatedText("Запись через")} {site.template.bookingProvider}<br />{translatedText("по предварительной записи")}</small></div> : null}
              <div className="mct-final-contact-grid" aria-label={`Способы связи с ${site.master.instrumental}`}>
                {bookingContacts.map((item) => (
                  <a className="mct-final-secondary" href={item.url} target={item.kind === "phone" ? undefined : "_blank"} rel={item.kind === "phone" ? undefined : "noopener noreferrer"} key={`${item.kind}-${item.url}`}>
                    <span className="mct-contact-icon" aria-hidden="true">
                      {item.kind === "phone"
                        ? <svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></svg>
                        : <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>}
                    </span>
                    <span className="mct-contact-copy"><strong>{item.kind === "phone" ? translatedText("Позвонить") : item.label}</strong><small>{item.kind === "phone" ? site.contacts.phoneDisplay : `${translatedText("Написать")} ${locale === "ru" ? site.master.dative : localizedMasterName}`}</small></span><i className="mct-link-arrow" aria-hidden="true" />
                  </a>
                ))}
                {mapUrl ? (
                  <a className={`mct-final-secondary is-location${locationFillsContactRow ? " is-full-row" : ""}`} href={mapUrl} target="_blank" rel="noopener noreferrer">
                    <span className="mct-contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg></span>
                    <span className="mct-contact-copy"><strong className="mct-mobile-location-title">{translatedText("Яндекс Карты")}</strong><strong className="dct-location-title">{translatedText("Локация")}</strong><small className="mct-mobile-location-copy">{translatedText("Адрес и маршрут")}</small><small className="dct-location-copy">{translatedText(site.location.city)},<br />{site.location.mapCardAddress}</small></span><i className="mct-link-arrow" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
              {site.location.address ? (
                <p className="mct-visit-address mct-visit-address-mobile">
                  {site.location.address}
                  {site.location.schedule ? <span>{translatedText(site.location.schedule)}</span> : null}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mct-visit-booking mct-visit-booking-mobile-julia">
            <div className="mct-visit-booking-top">
              <p className="mct-section-kicker">{translatedText("Запись и связь")}</p>
              {site.location.scheduleCapitalized ? (
                <span className={`mct-open-status${openStatus.isOpen === true ? " is-open" : openStatus.isOpen === false ? " is-closed" : ""}`}>
                  <i aria-hidden="true" />
                  {openStatus.isOpen === true
                    ? `${translatedText("Открыто до")} ${site.location.closeTime}`
                    : openStatus.isOpen === false
                      ? `${translatedText("Закрыто до")} ${site.location.openTime}`
                      : translatedText(site.location.scheduleCapitalized)}
                </span>
              ) : null}
            </div>
            <h3>{translatedText("Запишитесь онлайн")}<br /><em>{translatedText("или свяжитесь любым удобным способом")}</em></h3>
            <p>{siteBookingMode === "direct"
              ? translatedText("Выберите свободное время онлайн. Если нужно уточнить услугу, свяжитесь с мастером напрямую.")
              : translatedText("Позвоните или напишите мастеру, чтобы согласовать услугу и время.")}</p>
            <div className="mct-visit-actions">
              <a className="mct-final-cta" href={bookingHref} target={siteBookingMode === "direct" ? "_blank" : undefined} rel={siteBookingMode === "direct" ? "noopener noreferrer" : undefined} onClick={handleBookingClick}><span>{siteBookingMode === "direct" ? translatedText("Выбрать время онлайн") : translatedText("Записаться онлайн")}</span><i className="mct-link-arrow" aria-hidden="true" /></a>
              <div className="mct-final-contact-grid" aria-label={`Способы связи с ${site.master.instrumental}`}>
                {bookingContacts.map((item) => (
                  <a className="mct-final-secondary" href={item.url} target={item.kind === "phone" ? undefined : "_blank"} rel={item.kind === "phone" ? undefined : "noopener noreferrer"} key={`mobile-julia-${item.kind}-${item.url}`}>
                    <span className="mct-contact-icon" aria-hidden="true">
                      {item.kind === "phone"
                        ? <svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></svg>
                        : <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>}
                    </span>
                    <span className="mct-contact-copy"><strong>{item.kind === "phone" ? translatedText("Позвонить") : item.label}</strong><small>{item.kind === "phone" ? `${locale === "ru" ? site.master.dative : localizedMasterName} · ${site.contacts.phoneDisplay}` : `${translatedText("Написать")} ${locale === "ru" ? site.master.dative : localizedMasterName}`}</small></span><i className="mct-link-arrow" aria-hidden="true" />
                  </a>
                ))}
                {mapUrl ? (
                  <a className={`mct-final-secondary is-location${locationFillsContactRow ? " is-full-row" : ""}`} href={mapUrl} target="_blank" rel="noopener noreferrer">
                    <span className="mct-contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg></span>
                    <span className="mct-contact-copy"><strong>{translatedText("Яндекс Карты")}</strong><small>{translatedText("Адрес и маршрут")}</small></span><i className="mct-link-arrow" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {site.location.address ? (
            <div className="mct-visit-details mct-visit-details-mobile-julia">
              {routeUrl || mapUrl ? (
                <a className="mct-visit-address mct-visit-address-link" href={routeUrl || mapUrl} target="_blank" rel="noopener noreferrer">
                  {site.location.address}
                  {site.location.schedule ? <span>{translatedText(site.location.schedule)}</span> : null}
                </a>
              ) : (
                <p className="mct-visit-address">
                  {site.location.address}
                  {site.location.schedule ? <span>{translatedText(site.location.schedule)}</span> : null}
                </p>
              )}
            </div>
          ) : null}

        </div>
      </section>
      <a className="mct-tanem-footer" href="https://tanem.ru/" target="_blank" rel="noopener noreferrer"><span className="tanem-mark">T</span><span className="tanem-credit">{translatedText("Создано в")} <strong>TANEM.ru</strong></span></a>

      <div className={`mct-sticky-wrap${stickyVisible && !galleryOpen && !bookingOpen ? " is-visible" : ""}`} aria-hidden={!stickyVisible || galleryOpen}>
        <a className="mct-sticky" href={bookingHref} target={siteBookingMode === "direct" ? "_blank" : undefined} rel={siteBookingMode === "direct" ? "noopener noreferrer" : undefined} onClick={handleBookingClick} tabIndex={stickyVisible && !galleryOpen && !bookingOpen ? 0 : -1}>
          <span className="mct-sticky-icon dct-sticky-mobile-mark">{site.brand.monogram}</span><span className="dct-sticky-live" aria-hidden="true"><i /></span><span className="mct-sticky-copy"><strong>{translatedText("Записаться онлайн")}</strong><small>{siteBookingMode === "direct" ? translatedText("Открыть свободное время") : translatedText("Выберите удобный способ связи")}</small></span><span className="mct-sticky-arrow" aria-hidden="true">→</span>
        </a>
      </div>

      <div className={`mct-book-sheet${bookingOpen ? " is-open" : ""}`} id="booking-options" role="dialog" aria-modal="true" aria-hidden={!bookingOpen} aria-label={translatedText("Как вам удобнее записаться?")} onClick={() => setBookingOpen(false)}>
        <div className="mct-book-panel" onClick={(event) => event.stopPropagation()}>
          <button className="mct-book-close" type="button" onClick={() => setBookingOpen(false)} aria-label={translatedText("Закрыть")}>×</button>
          <p className="mct-section-kicker">{translatedText("Запись и связь")}</p>
          <h3>{translatedText("Как вам удобнее записаться?")}</h3>
          <p className="mct-book-copy">{translatedText("Выберите удобный способ связи")}</p>
          <div className="mct-book-options">
            {bookingContacts.map((item) => (
              <a className="mct-book-option" href={item.url} target={item.kind === "phone" ? undefined : "_blank"} rel={item.kind === "phone" ? undefined : "noopener noreferrer"} key={`sheet-${item.kind}-${item.url}`} onClick={() => setBookingOpen(false)}>
                <span className="mct-book-icon" aria-hidden="true">
                  {item.kind === "phone"
                    ? <svg viewBox="0 0 24 24"><path d="M7 4h3l1.3 4-2 1.5c1 2 2.6 3.6 4.6 4.6l1.5-2L19 13.5v3c0 1.1-.9 2-2 2C10.4 18.5 5.5 13.6 5.5 7A2 2 0 0 1 7 4Z" /></svg>
                    : <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>}
                </span>
                <span className="mct-book-option-copy"><strong>{item.kind === "phone" ? translatedText("Позвонить") : item.label}</strong><small>{item.kind === "phone" ? site.contacts.phoneDisplay : `${translatedText("Написать")} ${locale === "ru" ? site.master.dative : localizedMasterName}`}</small></span>
                <span className="mct-book-arrow" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {galleryOpen && (
        <div className="mct-gallery-overlay" role="dialog" aria-modal="true" aria-label={`Галерея ${site.master.genitive}`}>
          <div className="mct-gallery-top"><strong>{translatedText("Галерея")}</strong><button className="mct-gallery-close" type="button" onClick={() => setGalleryOpen(false)} aria-label={translatedText("Закрыть галерею")}>×</button></div>
          <div className="mct-gallery-content">
            <h3>{translatedText("Работы")}</h3>
            <div className="mct-gallery-works">
              {galleryWorks.map((item) => (
                <button className="mct-gallery-image" type="button" key={item.src} onClick={() => openLightbox(item.src)} aria-label={`Открыть фотографию: ${item.alt}`}>
                  <img src={item.src} alt={item.alt} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <div className={`mct-lightbox${lightboxTransform.scale > 1.01 ? " is-zoomed" : ""}`} role="dialog" aria-modal="true" aria-label="Полноэкранный просмотр фотографии" onClick={() => setLightboxIndex(null)}>
          <button className="mct-lightbox-close" type="button" onClick={() => setLightboxIndex(null)} aria-label="Закрыть фотографию">×</button>
          <span className="mct-lightbox-hint">{translatedText("Разведите двумя пальцами, чтобы увеличить")}</span>
          <button className="mct-lightbox-nav mct-lightbox-prev" type="button" onClick={(event) => { event.stopPropagation(); stepLightbox(-1); }} aria-label="Предыдущая фотография" tabIndex={lightboxTransform.scale > 1.01 ? -1 : 0}>‹</button>
          <figure
            className="mct-lightbox-figure"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={startLightboxGesture}
            onTouchMove={moveLightboxGesture}
            onTouchEnd={finishLightboxGesture}
            onTouchCancel={finishLightboxGesture}
          >
            <div className="mct-lightbox-image-stage">
              <img
                src={lightboxItems[lightboxIndex].src}
                alt={lightboxItems[lightboxIndex].alt}
                draggable="false"
                style={{ transform: `translate3d(${lightboxTransform.x}px, ${lightboxTransform.y}px, 0) scale(${lightboxTransform.scale})` }}
              />
            </div>
            <figcaption><span>{lightboxItems[lightboxIndex].alt}</span><small>{String(lightboxIndex + 1).padStart(2, "0")} / {String(lightboxItems.length).padStart(2, "0")}</small></figcaption>
          </figure>
          {!galleryOpen && (
            <button
              className="mct-lightbox-gallery-cta"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxIndex(null);
                setGalleryOpen(true);
              }}
            >{translatedText("Открыть галерею")}</button>
          )}
          <button className="mct-lightbox-nav mct-lightbox-next" type="button" onClick={(event) => { event.stopPropagation(); stepLightbox(1); }} aria-label="Следующая фотография" tabIndex={lightboxTransform.scale > 1.01 ? -1 : 0}>›</button>
        </div>
      )}
    </div>
  );
}
