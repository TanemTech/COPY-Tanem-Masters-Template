import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import site from "../site-data.mjs";
import {
  aboutPreset,
  categoryMode,
  collapsedServiceCounts,
  contactOptions,
  clientTranslationKeys,
  heroPreset,
  masterImageSources,
  masterInitial,
  SERVICE_PREVIEW_LIMIT,
} from "../template-rules.mjs";

const html = fs.readFileSync("out/index.html", "utf8");
const css = fs.readFileSync("app/template.css", "utf8");
const component = fs.readFileSync("app/master-template.tsx", "utf8");

test("static export builds from the empty template", () => {
  assert.match(html, /site-root/);
});

test("client data is empty in the base template", () => {
  assert.equal(site.master.name, "");
  assert.equal(site.location.city, "");
  assert.equal(site.contacts.phoneDisplay, "");
  assert.equal(site.reviews.length, 0);
  assert.equal(site.images.hero, "");
  assert.equal(site.images.profile, "");
  assert.equal(site.images.gallery.length, 0);
  assert.equal(Object.values(site.services).flat().length, 0);
});

test("the clean template uses one canonical stylesheet and runtime", () => {
  assert.ok(fs.existsSync("app/template.css"));
  assert.ok(fs.existsSync("public/template-runtime.js"));
});


test("identity, reviews and exact address stay source-locked while descriptive content localizes", () => {
  const translationKeys = clientTranslationKeys({
    template: { specialty: "generic" },
    brand: { name: "Studio Aizhan" },
    master: {
      name: "Aizhan Serikkyzy",
      profession: "Колорист",
      heroEmphasis: "эксперт по волосам",
      aboutParagraphs: [],
      skills: [],
    },
    location: {
      city: "Алматы",
      address: "ул. Абая, 10",
      mapCardAddress: "ул. Абая, 10",
      schedule: "Ежедневно 10:00–20:00",
    },
    services: { groups: [{ id: "hair", label: "Волосы", services: [{ name: "Окрашивание", description: "Описание", time: "2 часа" }] }] },
    amenities: [],
    reviews: [{ author: "Анна", text: "Оригинальный отзыв", source: "Яндекс Карты" }],
  });
  assert.ok(!translationKeys.includes("Studio Aizhan"));
  assert.ok(!translationKeys.includes("Aizhan Serikkyzy"));
  assert.ok(!translationKeys.includes("ул. Абая, 10"));
  assert.ok(!translationKeys.includes("Оригинальный отзыв"));
  assert.ok(translationKeys.includes("Колорист"));
  assert.ok(translationKeys.includes("Алматы"));
  assert.ok(translationKeys.includes("Ежедневно 10:00–20:00"));
  assert.ok(translationKeys.includes("Окрашивание"));
  assert.match(component, /const localizedMasterName = masterNameForLocale\(site, locale\)/);
  assert.doesNotMatch(component, /translatedText\(site\.brand\.name/);
  assert.doesNotMatch(component, /translatedText\(site\.master\.name/);
  assert.doesNotMatch(component, /translatedText\(site\.location\.address\)/);
  assert.doesNotMatch(component, /translatedText\(site\.location\.mapCardAddress\)/);
  assert.match(component, /<blockquote>\{review\.text\}<\/blockquote>/);
});

test("dynamic service count is translated as one complete phrase", () => {
  assert.match(component, /translatedCountText\("Открыть ещё \{count\} услуг", hiddenServiceCount\)/);
});

test("portfolio and full gallery remain structural without client photos", () => {
  assert.match(html, /id="mobile-portfolio"/);
  assert.match(html, /Смотреть все работы/);
  assert.match(html, /mct-work-placeholder/);
  assert.doesNotMatch(html, /disabled=""[^>]*Смотреть все работы/);
});


test("template renders canonical hero/profile through the media resolver", () => {
  const resolved = masterImageSources({
    basePath: "",
    template: { specialty: "hair" },
    images: { hero: "", profile: "" },
  });
  assert.equal(resolved.hero, "/fallback/masters/hair/hero.webp");
  assert.equal(resolved.profile, "/fallback/masters/hair/profile.webp");
  assert.match(component, /const resolvedImages = masterImageSources\(site\)/);
  assert.match(component, /src=\{resolvedImages\.hero\}/);
  assert.match(component, /src=\{resolvedImages\.profile\}/);
});

test("specialty hero copy is deterministic", () => {
  const hair = {
    template: { specialty: "hair" },
    master: { heroEmphasis: "ignored", heroCopy: "ignored" },
  };
  const nails = {
    template: { specialty: "nails" },
    master: { heroEmphasis: "ignored", heroCopy: "Проверенный текст мастера" },
  };
  assert.deepEqual(heroPreset(hair), {
    emphasis: "эксперт по волосам",
    copy: "Стрижки, окрашивание, блонд, уход и укладки с вниманием к состоянию волос, оттенку и вашему образу.",
  });
  assert.deepEqual(heroPreset(nails), {
    emphasis: "эксперт по маникюру и педикюру",
    copy: "Проверенный текст мастера",
  });
});

test("category mechanics stay 1 / 2 / 3+ without a hard cap", () => {
  const makeSite = (count) => ({
    services: {
      groups: Array.from({ length: count }, (_, index) => ({
        id: `g-${index}`,
        label: `G ${index}`,
        services: [{ name: `S ${index}` }],
      })),
    },
  });
  assert.equal(categoryMode(makeSite(1)), "single");
  assert.equal(categoryMode(makeSite(2)), "two");
  assert.equal(categoryMode(makeSite(3)), "many");
  assert.equal(categoryMode(makeSite(8)), "many");
});

test("contact options support multiple verified channels and legacy messenger data", () => {
  const phoneOnly = {
    contacts: {
      phoneDisplay: "+7 (900) 000-00-00",
      phoneHref: "tel:+79000000000",
      channels: [],
      messenger: null,
    },
  };
  assert.deepEqual(contactOptions(phoneOnly).map((item) => item.kind), ["phone"]);

  const multi = {
    contacts: {
      phoneDisplay: "+7 (900) 000-00-00",
      phoneHref: "tel:+79000000000",
      channels: [
        { type: "whatsapp", label: "WhatsApp", url: "https://wa.me/79000000000" },
        { type: "telegram", label: "Telegram", url: "https://t.me/+79000000000" },
        { type: "vk", label: "VK", url: "https://vk.ru/example" },
      ],
      messenger: null,
    },
  };
  assert.deepEqual(contactOptions(multi).map((item) => item.kind), ["phone", "whatsapp", "telegram", "vk"]);

  const legacy = {
    contacts: {
      phoneDisplay: "+7 (900) 000-00-00",
      phoneHref: "tel:+79000000000",
      messenger: { type: "telegram", label: "Telegram", url: "https://t.me/example" },
    },
  };
  assert.deepEqual(contactOptions(legacy).map((item) => item.kind), ["phone", "telegram"]);

  const mixed = {
    contacts: {
      phoneDisplay: "+7 (900) 000-00-00",
      phoneHref: "tel:+79000000000",
      channels: [
        { type: "whatsapp", label: "WhatsApp", url: "https://wa.me/79000000000" },
        { type: "telegram", label: "Telegram", url: "https://t.me/example" },
        { type: "instagram", label: "Instagram", url: "https://instagram.com/example" },
      ],
      messenger: { type: "telegram", label: "Telegram", url: "https://t.me/example" },
    },
  };
  assert.deepEqual(contactOptions(mixed).map((item) => item.kind), ["phone", "whatsapp", "telegram"]);
});

test("hidden service counts are computed from the responsive layouts", () => {
  const testSite = {
    services: {
      groups: [
        { id: "a", label: "A", services: Array.from({ length: 4 }, (_, i) => ({ name: `A${i}` })) },
        { id: "b", label: "B", services: Array.from({ length: 3 }, (_, i) => ({ name: `B${i}` })) },
        { id: "c", label: "C", services: Array.from({ length: 2 }, (_, i) => ({ name: `C${i}` })) },
      ],
    },
  };
  assert.equal(SERVICE_PREVIEW_LIMIT, 7);
  assert.deepEqual(collapsedServiceCounts(testSite), {
    total: 9,
    mobileHidden: 2,
    desktopHidden: 2,
  });
});


test("approved About copy and skills are deterministic", () => {
  const hair = {
    template: { specialty: "hair" },
    master: { name: "Ксения Шаповалова", experienceYears: null },
    brand: { name: "" },
  };
  assert.deepEqual(aboutPreset(hair), {
    lead: "Я Ксения — эксперт по волосам.",
    paragraphs: [
      "Специализируюсь на стрижках и окрашивании, blond и сложных техниках, уходе и реконструкции волос.",
      "Работаю с формой, цветом и состоянием волос, чтобы результат выглядел цельно и подходил именно вам.",
    ],
    skills: [
      "Стрижки и окрашивание",
      "Blond и сложные техники",
      "Уход и реконструкция волос",
    ],
  });
  assert.equal(masterInitial(hair), "К");

  const nails = {
    template: { specialty: "nails" },
    master: { name: "Наталья", experienceYears: "14" },
    brand: { name: "" },
  };
  assert.equal(aboutPreset(nails).lead, "Я Наталья — эксперт по маникюру и педикюру со стажем более 14 лет.");
  assert.equal(aboutPreset({ ...nails, master: { ...nails.master, experienceYears: "14+" } }).lead, "Я Наталья — эксперт по маникюру и педикюру со стажем более 14 лет.");
  assert.deepEqual(aboutPreset(nails).skills, [
    "Маникюр и педикюр",
    "Наращивание и коррекция",
    "Стерильные инструменты",
  ]);
  assert.equal(masterInitial(nails), "Н");
});

test("reviews are capped at nine and preserve author, source and verbatim text", () => {
  assert.match(component, /site\.reviews as Review\[\]\)\.slice\(0, 9\)/);
  assert.match(component, /type Review = \{ author: string; text: string; source\?: string \}/);
  assert.match(component, /review\.source \|\| site\.template\.reviewSource/);
  assert.match(component, /aria-label="5 из 5">★★★★★/);
  assert.match(component, /<blockquote>«\{review\.text\}»<\/blockquote>/);
  assert.match(component, /\{reviews\.length > 0 && \(\s*<section className="mct-reviews/);
});

test("reviews keep separate approved mobile and desktop renderers", () => {
  assert.match(component, /mct-review-card mct-review-card-mobile/);
  assert.match(component, /mct-review-card dct-review-card/);
  assert.match(css, /\.dct-review-card\s*\{\s*display:\s*none !important;/);
  assert.match(css, /@media \(min-width: 1024px\)[\s\S]*?\.mct-review-card-mobile\s*\{\s*display:\s*none !important;/);
  assert.match(css, /@media \(min-width: 1024px\)[\s\S]*?\.dct-review-card\s*\{\s*display:\s*flex !important;/);
});

test("approved mobile review architecture is locked without changing desktop reviews", () => {
  assert.match(component, /mct-review-card mct-review-card-mobile[\s\S]*?mct-mobile-review-stars[\s\S]*?mct-mobile-review-source/);
  assert.match(component, /mct-review-card mct-review-card-mobile[\s\S]*?<blockquote>\{review\.text\}<\/blockquote>/);
  assert.match(component, /mct-review-card dct-review-card[\s\S]*?<blockquote>«\{review\.text\}»<\/blockquote>/);
  assert.match(css, /TANEM approved mobile review architecture/);
  assert.match(css, /mct-review-card-mobile[\s\S]*?-webkit-line-clamp:\s*7 !important/);
  assert.match(css, /mct-review-card-mobile[\s\S]*?padding:\s*16px 16px 40px !important/);
  assert.match(css, /mct-review-card-mobile[\s\S]*?max-height:\s*144px !important/);
  assert.match(css, /mct-review-card-mobile[\s\S]*?position:\s*absolute !important[\s\S]*?right:\s*16px !important[\s\S]*?bottom:\s*15px !important/);
  assert.match(css, /mct-mobile-review-source[\s\S]*?translateY\(4px\)/);
});

test("additional block always uses the three compact approved cards", () => {
  assert.match(component, /title: "Выбор услуги", text: "Мастер поможет определиться\."/);
  assert.match(component, /title: "Пожелания", text: "Покажите пример результата\."/);
  assert.match(component, /title: "Перенос записи", text: "Предупредите заранее\."/);
  assert.doesNotMatch(component, /const amenities = site\.amenities/);
  assert.doesNotMatch(css, /mct-amenities-grid article:nth-child\(2\) strong/);
});

test("approved gallery and service limits cannot regress", () => {
  assert.match(component, /\{galleryOpen && \(/);
  assert.doesNotMatch(component, /galleryOpen && galleryWorks\.length > 0/);
  assert.doesNotMatch(component, /group\.services\.slice\(0,\s*2\)/);
  assert.match(css, /nth-child\(n \+ 8\)/);
  assert.match(component, /locationFillsContactRow/);
});

test("final CSS locks Nails to mobile and many categories to one horizontal ribbon", () => {
  assert.match(css, /TANEM master engine rules v2: mass-production invariants/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.mct-hero-visual \.mct-palette-stage[\s\S]*?display: block !important/);
  assert.match(css, /@media \(min-width: 768px\)[\s\S]*?\.mct-palette-stage[\s\S]*?display: none !important/);
  assert.match(css, /\.mct-tabs-ribbon-wrap\.is-many \.mct-tabs-track[\s\S]*?display: flex !important[\s\S]*?flex-wrap: nowrap !important/);
  assert.match(css, /\.dct-top-actions \.mct-lang-switch\.is-desktop button[\s\S]*?font-size: 20px !important/);
});

test("Julia booking structure replaces only the mobile block", () => {
  assert.match(component, /mct-visit-booking-desktop-current/);
  assert.match(component, /mct-visit-booking-mobile-julia/);
  assert.match(component, /Запишитесь онлайн"\)}<br \/><em>/);
  assert.match(component, /mct-visit-details-mobile-julia/);
  assert.match(css, /\.mct-visit-booking-mobile-julia,[\s\S]*?display: none !important/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.mct-visit-booking-desktop-current[\s\S]*?display: none !important[\s\S]*?\.mct-visit-booking-mobile-julia[\s\S]*?display: block !important/);
  const mobileDetails = component.match(/<div className="mct-visit-details mct-visit-details-mobile-julia">([\s\S]*?)<\/div>/)?.[1] || "";
  assert.match(mobileDetails, /mct-visit-address mct-visit-address-link/);
  assert.match(mobileDetails, /href=\{routeUrl \|\| mapUrl\}/);
  assert.match(mobileDetails, /site\.location\.schedule/);
  assert.doesNotMatch(mobileDetails, /mct-mobile-route-card|mct-map-wrap/);
});
