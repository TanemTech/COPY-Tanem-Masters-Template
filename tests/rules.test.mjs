import assert from "node:assert/strict";
import test from "node:test";
import {
  bookingMode,
  categoryMode,
  chooseInitialLocale,
  contactOptions,
  experienceMode,
  masterImageSources,
  masterNameForLocale,
  openingStatusAt,
  serviceBookingUrl,
  specialtyMode,
} from "../template-rules.mjs";

const makeSite = (overrides = {}) => ({
  template: { specialty: "", ...overrides.template },
  master: { experienceYears: null, ...overrides.master },
  contacts: { phoneDisplay: "", phoneHref: "", messenger: null, ...overrides.contacts },
  links: { bookingUrl: "", ...overrides.links },
  services: { groups: [], ...overrides.services },
  i18n: { locales: [{ code: "ru", label: "RU" }, { code: "en", label: "EN" }], ...overrides.i18n },
  images: { logo: "", hero: "", profile: "", gallery: [], ...overrides.images },
  location: { timeZone: "UTC", openTime: "10:00", closeTime: "20:00", weeklyHours: {}, ...overrides.location },
  basePath: overrides.basePath || "",
});

test("category modes follow 1 / 2 / 3+ rules", () => {
  const group = (id) => ({ id, label: id, services: [{ name: id }] });
  assert.equal(categoryMode(makeSite({ services: { groups: [group("a")] } })), "single");
  assert.equal(categoryMode(makeSite({ services: { groups: [group("a"), group("b")] } })), "two");
  assert.equal(categoryMode(makeSite({ services: { groups: [group("a"), group("b"), group("c")] } })), "many");
});

test("direct booking wins and service-specific link wins over generic", () => {
  const site = makeSite({ links: { bookingUrl: "https://booking.example/master" } });
  assert.equal(bookingMode(site), "direct");
  assert.equal(serviceBookingUrl({ url: "https://booking.example/service" }, site), "https://booking.example/service");
  assert.equal(serviceBookingUrl({ url: "" }, site), "https://booking.example/master");
});

test("phone alone is a valid contact fallback and Instagram is filtered", () => {
  const phoneOnly = makeSite({ contacts: { phoneDisplay: "+7 000", phoneHref: "tel:+7000", messenger: null } });
  assert.equal(bookingMode(phoneOnly), "contact");
  assert.deepEqual(contactOptions(phoneOnly).map((item) => item.kind), ["phone"]);

  const instagram = makeSite({ contacts: { phoneDisplay: "+7 000", phoneHref: "tel:+7000", messenger: { type: "instagram", label: "Instagram", url: "https://instagram.com/test" } } });
  assert.deepEqual(contactOptions(instagram).map((item) => item.kind), ["phone"]);
});

test("locale detection honors saved locale, then system locale, then English", () => {
  const armenia = makeSite({ i18n: { locales: [{ code: "hy", label: "HY" }, { code: "ru", label: "RU" }, { code: "en", label: "EN" }] } });
  assert.equal(chooseInitialLocale(armenia, ["en-US"], "ru"), "ru");
  assert.equal(chooseInitialLocale(armenia, ["hy-AM"], ""), "hy");
  assert.equal(chooseInitialLocale(armenia, ["de-DE"], ""), "en");
});

test("Kazakhstan and other local languages use the same generic locale engine", () => {
  const kazakhstan = makeSite({
    master: { name: "Aizhan Serikkyzy" },
    i18n: {
      localLocale: "kk",
      locales: [{ code: "kk", label: "KZ" }, { code: "ru", label: "RU" }, { code: "en", label: "EN" }],
      masterNames: { kk: "Айжан Серікқызы" },
    },
  });
  assert.deepEqual(kazakhstan.i18n.locales.map((item) => item.code), ["kk", "ru", "en"]);
  assert.equal(chooseInitialLocale(kazakhstan, ["kk-KZ"], ""), "kk");
  assert.equal(masterNameForLocale(kazakhstan, "kk"), "Айжан Серікқызы");
  assert.equal(masterNameForLocale(kazakhstan, "en"), "Aizhan Serikkyzy");
});

test("experience and specialty are explicit data-driven states", () => {
  assert.equal(experienceMode(makeSite()), "unknown");
  assert.equal(experienceMode(makeSite({ master: { experienceYears: "8" } })), "known");
  assert.equal(specialtyMode(makeSite({ template: { specialty: "hair" } })), "hair");
  assert.equal(specialtyMode(makeSite({ template: { specialty: "nails" } })), "nails");
  assert.equal(specialtyMode(makeSite({ template: { specialty: "brows" } })), "generic");
});


test("master images prefer real canonical files and otherwise use specialty fallbacks", () => {
  const hair = makeSite({ template: { specialty: "hair" }, basePath: "/TAN-TEST" });
  assert.deepEqual(masterImageSources(hair), {
    hero: "/TAN-TEST/fallback/masters/hair/hero.webp",
    profile: "/TAN-TEST/fallback/masters/hair/profile.webp",
  });

  const nails = makeSite({
    template: { specialty: "nails" },
    images: { hero: "/hero.webp", profile: "/profile.webp" },
  });
  assert.deepEqual(masterImageSources(nails), {
    hero: "/hero.webp",
    profile: "/profile.webp",
  });
});


test("weekly hours drive the live badge by weekday and respect closed days", () => {
  const site = makeSite({
    location: {
      timeZone: "Europe/Moscow",
      weeklyHours: {
        mon: { open: "10:00", close: "16:00" },
        tue: { open: "10:00", close: "20:00" },
        wed: { open: "10:00", close: "20:00" },
        thu: { open: "10:00", close: "20:00" },
        fri: { open: "10:00", close: "16:00" },
        sat: { open: "09:00", close: "20:00" },
        sun: null,
      },
    },
  });

  assert.deepEqual(openingStatusAt(site, new Date("2026-10-05T12:00:00Z")), {
    isOpen: true,
    boundaryTime: "16:00",
    phase: "open",
    day: "mon",
  });
  assert.deepEqual(openingStatusAt(site, new Date("2026-10-06T05:30:00Z")), {
    isOpen: false,
    boundaryTime: "10:00",
    phase: "before",
    day: "tue",
  });
  assert.deepEqual(openingStatusAt(site, new Date("2026-10-11T09:00:00Z")), {
    isOpen: false,
    boundaryTime: "",
    phase: "closed",
    day: "sun",
  });
});

test("legacy openTime/closeTime remains supported when weeklyHours is absent", () => {
  const site = makeSite({
    location: {
      timeZone: "UTC",
      openTime: "10:00",
      closeTime: "18:00",
      weeklyHours: {},
    },
  });
  assert.equal(openingStatusAt(site, new Date("2026-10-05T12:00:00Z")).isOpen, true);
  assert.equal(openingStatusAt(site, new Date("2026-10-05T08:00:00Z")).boundaryTime, "10:00");
});
