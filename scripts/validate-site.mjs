import site from "../site-data.mjs";
import {
  bookingMode,
  categoryMode,
  clientTranslationKeys,
  contactOptions,
  normalizedLocales,
  specialtyMode,
  UI_TRANSLATION_KEYS,
  visibleServiceGroups,
} from "../template-rules.mjs";

const fail = (message) => {
  throw new Error(`site-data.mjs: ${message}`);
};

const arrays = [
  ["master.aboutParagraphs", site.master.aboutParagraphs],
  ["master.skills", site.master.skills],
  ["images.beforeAfter", site.images.beforeAfter],
  ["images.gallery", site.images.gallery],
  ["services.groups", site.services.groups],
  ["reviews", site.reviews],
  ["promotions", site.promotions],
  ["amenities", site.amenities],
];

for (const [label, value] of arrays) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
}

if (site.images.gallery.length > 15) fail("publish at most 15 master gallery photos");
if (site.master.name && site.images.gallery.length === 0) {
  fail("published master must have at least one real gallery photo");
}
for (const field of ["logo", "hero", "profile"]) {
  if (typeof site.images[field] !== "string") fail(`images.${field} must be a string`);
}

if (site.reviews.length > 9) fail("publish at most 9 verified reviews");
for (const [index, review] of site.reviews.entries()) {
  if (!String(review?.author || "").trim()) fail(`review ${index + 1} must have the verified author`);
  if (!String(review?.text || "").trim()) fail(`review ${index + 1} must have the verbatim source text`);
  if (!String(review?.source || site.template?.reviewSource || "").trim()) {
    fail(`review ${index + 1} must identify its verified source`);
  }
}

const groups = visibleServiceGroups(site);
const groupIds = groups.map((group) => group.id);
if (new Set(groupIds).size !== groupIds.length) fail("service group ids must be unique");
for (const group of groups) {
  if (!group.label) fail(`service group ${group.id} must have a label`);
  if (!Array.isArray(group.services)) fail(`service group ${group.id} services must be an array`);
}

if (!site.location.timeZone) fail("location.timeZone must exist");
if (!site.seo.siteUrl) fail("seo.siteUrl must exist");
if (!["generic", "hair", "nails"].includes(specialtyMode(site))) fail("unsupported specialty");

const locales = normalizedLocales(site).map((item) => item.code);
const masterNames = site.i18n?.masterNames || {};
if (typeof masterNames !== "object" || Array.isArray(masterNames)) fail("i18n.masterNames must be an object");
for (const [rawLocale, value] of Object.entries(masterNames)) {
  const locale = String(rawLocale || "").trim().toLowerCase();
  if (!locales.includes(locale)) fail(`i18n.masterNames contains unsupported locale: ${rawLocale}`);
  if (!String(value || "").trim()) fail(`i18n.masterNames.${rawLocale} must be a non-empty verified spelling/transliteration`);
}

if (site.location.countryCode) {
  const country = String(site.location.countryCode).toUpperCase();
  if (country === "RU") {
    if (locales.length !== 2 || locales[0] !== "ru" || locales[1] !== "en") {
      fail("Russia must publish languages in RU, EN order");
    }
  } else {
    const localLocale = String(site.i18n.localLocale || "").toLowerCase();
    if (!localLocale || localLocale === "ru" || localLocale === "en") fail("non-Russia site must declare a local language");
    if (locales.length !== 3 || locales[0] !== localLocale || locales[1] !== "ru" || locales[2] !== "en") {
      fail("non-Russia site must publish languages in local, RU, EN order");
    }
  }
}

if (site.master.name) {
  const keys = clientTranslationKeys(site);
  const localLocale = String(site.i18n?.localLocale || "ru").toLowerCase();
  for (const locale of locales.filter((code) => code !== "ru")) {
    const dictionary = site.i18n?.translations?.[locale];
    if (!dictionary || typeof dictionary !== "object") fail(`missing translation dictionary for ${locale}`);
    const required = locale === localLocale && locale !== "en"
      ? [...keys, ...UI_TRANSLATION_KEYS]
      : keys;
    const missing = [...new Set(required)].filter((key) => !String(dictionary[key] || "").trim());
    if (missing.length) fail(`missing ${locale} translations: ${missing.slice(0, 8).join(" | ")}`);
  }
}

const messenger = site.contacts?.messenger;
if (messenger) {
  const type = String(messenger.type || "").toLowerCase();
  const url = String(messenger.url || "").toLowerCase();
  if (type === "instagram" || url.includes("instagram.com")) fail("Instagram is not allowed");
}

const publishedUrls = [
  ...Object.values(site.links || {}),
  site.contacts?.phoneHref,
  site.contacts?.messenger?.url,
  ...groups.flatMap((group) => group.services.map((service) => service?.url)),
]
  .filter((value) => typeof value === "string")
  .map((value) => value.toLowerCase());

if (publishedUrls.some((url) => url.includes("instagram.com") || url.includes("instagr.am"))) {
  fail("Instagram links are forbidden anywhere in the published site data");
}

if (site.master.name && bookingMode(site) === "contact" && contactOptions(site).length === 0) {
  fail("published master without direct booking must have at least a phone/contact option");
}

categoryMode(site);
console.log("TANEM master template rules are valid.");
