import assert from "node:assert/strict";
import test from "node:test";
import {
  bookingMode,
  categoryMode,
  chooseInitialLocale,
  contactOptions,
  experienceMode,
  normalizedLocales,
  serviceBookingUrl,
  specialtyMode,
} from "../template-rules.mjs";

const service = (name, url = "") => ({ name, price: "1 000 ₽", time: "60 мин", description: "", url });
const group = (id, label, items = [service(label)]) => ({ id, label, services: items });

test("Hair / Russia / known experience / 3+ categories", () => {
  const site = {
    template: { specialty: "hair" },
    master: { experienceYears: "8" },
    contacts: { phoneHref: "tel:+70000000000", phoneDisplay: "+7 000 000-00-00", messenger: null },
    links: { bookingUrl: "https://booking.example/master" },
    services: { groups: [group("cuts", "Стрижки"), group("color", "Окрашивание"), group("care", "Уход")] },
    i18n: { localLocale: "ru", locales: [{ code: "ru", label: "RU" }, { code: "en", label: "EN" }] },
  };

  assert.equal(specialtyMode(site), "hair");
  assert.equal(experienceMode(site), "known");
  assert.equal(categoryMode(site), "many");
  assert.equal(bookingMode(site), "direct");
  assert.deepEqual(normalizedLocales(site).map((x) => x.code), ["ru", "en"]);
  assert.equal(chooseInitialLocale(site, ["en-US"], ""), "en");
});

test("Nails / two categories / unknown experience / phone-only booking", () => {
  const site = {
    template: { specialty: "nails" },
    master: { experienceYears: null },
    contacts: { phoneHref: "tel:+70000000000", phoneDisplay: "+7 000 000-00-00", messenger: null },
    links: { bookingUrl: "" },
    services: { groups: [group("manicure", "Маникюр"), group("pedicure", "Педикюр")] },
    i18n: { localLocale: "ru", locales: [{ code: "ru", label: "RU" }, { code: "en", label: "EN" }] },
  };

  assert.equal(specialtyMode(site), "nails");
  assert.equal(experienceMode(site), "unknown");
  assert.equal(categoryMode(site), "two");
  assert.equal(bookingMode(site), "contact");
  assert.deepEqual(contactOptions(site).map((x) => x.kind), ["phone"]);
  assert.equal(serviceBookingUrl(site.services.groups[0].services[0], site), "");
});

test("Foreign master / local + RU + EN / saved and system language precedence", () => {
  const site = {
    template: { specialty: "hair" },
    master: { experienceYears: "5" },
    contacts: {
      phoneHref: "tel:+37400000000",
      phoneDisplay: "+374 00 000000",
      messenger: { type: "telegram", label: "Telegram", url: "https://t.me/example" },
    },
    links: { bookingUrl: "" },
    services: { groups: [group("hair", "Մազեր")] },
    i18n: {
      localLocale: "hy",
      locales: [{ code: "hy", label: "HY" }, { code: "ru", label: "RU" }, { code: "en", label: "EN" }],
    },
  };

  assert.deepEqual(normalizedLocales(site).map((x) => x.code), ["hy", "ru", "en"]);
  assert.equal(chooseInitialLocale(site, ["ru-RU"], ""), "ru");
  assert.equal(chooseInitialLocale(site, ["hy-AM"], ""), "hy");
  assert.equal(chooseInitialLocale(site, ["de-DE"], ""), "en");
  assert.equal(chooseInitialLocale(site, ["en-US"], "hy"), "hy");
  assert.deepEqual(contactOptions(site).map((x) => x.kind), ["phone", "telegram"]);
});

test("Kazakhstan / local + RU + EN uses the generic foreign-market locale contract", () => {
  const site = {
    template: { specialty: "hair" },
    master: { name: "Aizhan Serikkyzy", experienceYears: "5" },
    contacts: { phoneHref: "tel:+77000000000", phoneDisplay: "+7 700 000 00 00", messenger: null },
    links: { bookingUrl: "" },
    services: { groups: [group("hair", "Шаш")] },
    i18n: {
      localLocale: "kk",
      locales: [{ code: "kk", label: "KZ" }, { code: "ru", label: "RU" }, { code: "en", label: "EN" }],
      masterNames: { kk: "Айжан Серікқызы" },
    },
  };

  assert.deepEqual(normalizedLocales(site).map((x) => x.code), ["kk", "ru", "en"]);
  assert.equal(chooseInitialLocale(site, ["kk-KZ"], ""), "kk");
  assert.equal(chooseInitialLocale(site, ["de-DE"], ""), "en");
});

test("service-specific booking URL overrides master booking URL", () => {
  const site = {
    links: { bookingUrl: "https://booking.example/master" },
  };
  assert.equal(
    serviceBookingUrl({ url: "https://booking.example/service/42" }, site),
    "https://booking.example/service/42",
  );
});
