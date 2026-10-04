import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import {
  clientTranslationKeys,
  UI_TRANSLATION_KEYS,
} from "../template-rules.mjs";

const siteDataPath = new URL("../site-data.mjs", import.meta.url);
const original = fs.readFileSync(siteDataPath, "utf8");

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with ${result.status}`);
};

const service = (name, { price = "1 000 ₽", time = "60 мин", description = "", variants, url = "" } = {}) => ({
  name, price, time, description, url, ...(variants ? { variants } : {}),
});

const base = () => ({
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  template: { specialty: "", bookingProvider: "", reviewSource: "" },
  brand: { name: "TANEM TEST", subtitle: "", monogram: "TT" },
  master: {
    name: "Тест Мастер",
    dative: "Тест Мастеру",
    genitive: "Тест Мастера",
    instrumental: "Тест Мастером",
    monogram: "ТМ",
    profession: "мастер",
    heroTitle: "",
    heroEmphasis: "мастер",
    heroCaption: "Мастер",
    imageAlt: "мастер",
    heroCopy: "Тестовое описание мастера",
    visitMotto: "",
    experienceYears: null,
    experienceAria: "",
    aboutTitle: "О тестовом мастере",
    aboutLead: "Короткий текст о мастере",
    aboutParagraphs: ["Описание работы мастера"],
    skills: ["Тестовая специализация"],
  },
  location: {
    country: "Россия",
    countryCode: "RU",
    city: "Москва",
    metro: "",
    cityMetro: "Москва",
    address: "Тестовый адрес",
    mapCardAddress: "Тестовый адрес",
    schedule: "Ежедневно 10:00–20:00",
    scheduleCapitalized: "Ежедневно 10:00–20:00",
    timeZone: "Europe/Moscow",
    openTime: "10:00",
    closeTime: "20:00",
  },
  contacts: { phoneDisplay: "+7 000 000-00-00", phoneHref: "tel:+70000000000", messenger: null },
  links: {
    bookingUrl: "",
    reviewsUrl: "",
    mapUrl: "",
    routeUrl: "",
    mobileMapEmbedUrl: "about:blank",
    desktopMapEmbedUrl: "about:blank",
    yandexMapHrefMatch: "__qa_map__",
  },
  reputation: { rating: "5.0", reviewCount: "10" },
  images: {
    logo: "",
    hero: "",
    profile: "",
    heroDecoration: "/assets/template/hair-tools.png",
    beforeAfter: [],
    gallery: [{ src: "/placeholder.svg", alt: "QA work" }],
  },
  services: { groups: [] },
  i18n: {
    localLocale: "ru",
    locales: [{ code: "ru", label: "RU" }, { code: "en", label: "EN" }],
    translations: { en: {} },
  },
  reviews: [],
  promotions: [],
  amenities: [],
  seo: { siteUrl: "https://example.com/", title: "QA", description: "QA", keywords: [], locale: "ru_RU" },
  analytics: { yandexMetrikaId: "" },
});

const fillTranslations = (site) => {
  const dynamic = clientTranslationKeys(site);
  for (const locale of site.i18n.locales.map((x) => x.code).filter((x) => x !== "ru")) {
    const keys = locale === site.i18n.localLocale && locale !== "en"
      ? [...dynamic, ...UI_TRANSLATION_KEYS]
      : dynamic;
    site.i18n.translations[locale] = Object.fromEntries([...new Set(keys)].map((key) => [key, `${locale.toUpperCase()}:${key}`]));
  }
  return site;
};

const scenarios = [
  {
    name: "hair-ru-known-many-direct",
    site: (() => {
      const site = base();
      site.template.specialty = "hair";
      site.template.bookingProvider = "Dikidi";
      site.master.experienceYears = "8";
      site.master.experienceAria = "8 лет опыта";
      site.links.bookingUrl = "https://booking.example/master";
      site.services.groups = [
        { id: "cuts", label: "Стрижки", services: [
          service("Стрижка женская", { url: "https://booking.example/service/42" }),
          service("Стрижка каскад"),
          service("Стрижка челки"),
        ] },
        { id: "color", label: "Окрашивание", services: [
          service("Окрашивание тон в тон", { variants: [{ label: "Короткие волосы", price: "3 000 ₽", time: "90 мин" }, { label: "Длинные волосы", price: "5 000 ₽", time: "120 мин" }] }),
          service("Блонд"),
          service("Airtouch"),
        ] },
        { id: "care", label: "Уход", services: [
          service("Уход для волос", { description: "Описание процедуры" }),
          service("Восстановление"),
          service("Укладка"),
        ] },
      ];
      return fillTranslations(site);
    })(),
    check(html) {
      assert.match(html, /mct-master-tools/);
      assert.doesNotMatch(html, /mct-palette-stage/);
      assert.match(html, /эксперт по волосам/);
      assert.match(html, /Стрижки, окрашивание, блонд, уход и укладки с вниманием к состоянию волос, оттенку и вашему образу\./);
      assert.match(html, /Я Тест — эксперт по волосам со стажем более 8 лет\./);
      assert.match(html, /Смотреть все работы/);
      assert.match(html, /QA work/);
      assert.doesNotMatch(html, /mct-work-placeholder/);
      assert.match(html, /Открыть ещё<!-- --> <!-- -->2<!-- --> <!-- -->услуги|Открыть ещё 2 услуги/);
      assert.match(html, /Стрижки/);
      assert.match(html, /Окрашивание/);
      assert.match(html, /Уход/);
      assert.match(html, /Короткие волосы/);
      assert.match(html, /Описание процедуры/);
      assert.match(html, /https:\/\/booking\.example\/master/);
      assert.doesNotMatch(html, /is-two-stats/);
    },
  },
  {
    name: "nails-ru-unknown-two-phone",
    site: (() => {
      const site = base();
      site.template.specialty = "nails";
      site.master.heroEmphasis = "мастер маникюра";
      site.master.experienceYears = null;
      site.services.groups = [
        { id: "manicure", label: "Маникюр", services: [service("Маникюр")] },
        { id: "pedicure", label: "Педикюр", services: [service("Педикюр")] },
      ];
      return fillTranslations(site);
    })(),
    check(html) {
      assert.match(html, /mct-palette-stage/);
      assert.doesNotMatch(html, /mct-master-tools/);
      assert.match(html, /эксперт по маникюру и педикюру/);
      assert.match(html, /Смотреть все работы/);
      assert.match(html, /QA work/);
      assert.doesNotMatch(html, /mct-work-placeholder/);
      assert.match(html, /is-two-stats/);
      assert.match(html, /mct-tabs mct-tabs-scroll is-two/);
      assert.doesNotMatch(html, /mct-tab-all/);
      assert.match(html, /href="#booking-options"/);
      assert.match(html, /tel:\+70000000000/);
      assert.doesNotMatch(html, /instagram\.com/i);
      assert.ok(html.indexOf("mct-lang-switch is-desktop") < html.indexOf("dct-top-phone"));
    },
  },
  {
    name: "foreign-single-three-languages-contact",
    site: (() => {
      const site = base();
      site.template.specialty = "hair";
      site.location.country = "Армения";
      site.location.countryCode = "AM";
      site.location.timeZone = "Asia/Yerevan";
      site.contacts.phoneDisplay = "+374 00 000000";
      site.contacts.phoneHref = "tel:+37400000000";
      site.contacts.messenger = { type: "telegram", label: "Telegram", url: "https://t.me/tanem_test" };
      site.links.mapUrl = "https://yandex.example/maps/master";
      site.services.groups = [{ id: "hair", label: "Волосы", services: [service("Стрижка")] }];
      site.i18n.localLocale = "hy";
      site.i18n.locales = [{ code: "hy", label: "HY" }, { code: "ru", label: "RU" }, { code: "en", label: "EN" }];
      site.i18n.translations = { hy: {}, en: {} };
      return fillTranslations(site);
    })(),
    check(html) {
      assert.match(html, />HY</);
      assert.match(html, />RU</);
      assert.match(html, />EN</);
      assert.match(html, /HY:Портфолио/);
      assert.doesNotMatch(html, /role="tablist"/);
      assert.match(html, /https:\/\/t\.me\/tanem_test/);
      assert.match(html, /is-location is-full-row/);
      assert.match(html, /Тестовый адрес/);
      assert.match(html, /href="#booking-options"/);
    },
  },
];

try {
  for (const scenario of scenarios) {
    console.log(`\n=== QA scenario: ${scenario.name} ===`);
    fs.writeFileSync(siteDataPath, `export default ${JSON.stringify(scenario.site, null, 2)};\n`);
    fs.rmSync(new URL("../.next", import.meta.url), { recursive: true, force: true });
    fs.rmSync(new URL("../out", import.meta.url), { recursive: true, force: true });
    run(process.execPath, ["scripts/validate-site.mjs"]);
    run(process.execPath, ["node_modules/next/dist/bin/next", "build"]);
    const html = fs.readFileSync(new URL("../out/index.html", import.meta.url), "utf8");
    scenario.check(html);
  }
  console.log("\nAll rendered production scenarios passed.");
} finally {
  fs.writeFileSync(siteDataPath, original);
  fs.rmSync(new URL("../.next", import.meta.url), { recursive: true, force: true });
  fs.rmSync(new URL("../out", import.meta.url), { recursive: true, force: true });
}
