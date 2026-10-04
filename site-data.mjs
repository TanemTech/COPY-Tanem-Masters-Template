const publicBase = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default {
  basePath: publicBase,

  template: {
    specialty: "",
    bookingProvider: "",
    reviewSource: "",
  },

  brand: {
    name: "",
    subtitle: "",
    monogram: "",
  },

  master: {
    name: "",
    dative: "",
    genitive: "",
    instrumental: "",
    monogram: "",
    profession: "",
    heroTitle: "",
    heroEmphasis: "",
    heroCaption: "",
    imageAlt: "",
    heroCopy: "",
    visitMotto: "",
    experienceYears: null,
    experienceAria: "",
    aboutTitle: "",
    aboutLead: "",
    aboutParagraphs: [],
    skills: [],
  },

  location: {
    country: "",
    countryCode: "",
    city: "",
    metro: "",
    cityMetro: "",
    address: "",
    mapCardAddress: "",
    schedule: "",
    scheduleCapitalized: "",
    timeZone: "UTC",
    openTime: "00:00",
    closeTime: "00:00",
    // Optional weekly source of truth for the live Open / Closed badge.
    // Use all seven keys on production sites; null means the master is closed that day.
    // Example: mon: { open: "10:00", close: "16:00" }.
    weeklyHours: {},
  },

  contacts: {
    phoneDisplay: "",
    phoneHref: "",
    channels: [],
    messenger: null,
  },

  links: {
    bookingUrl: "",
    reviewsUrl: "",
    mapUrl: "",
    routeUrl: "",
    mobileMapEmbedUrl: "about:blank",
    desktopMapEmbedUrl: "about:blank",
    yandexMapHrefMatch: "__tanem_map_not_configured__",
  },

  reputation: {
    rating: "",
    reviewCount: "",
  },

  images: {
    // Canonical client media: hero.webp, profile.webp, gallery-01.webp...gallery-15.webp, optional logo.*
    // hero/profile may stay empty in source data: the engine resolves the approved specialty fallback.
    logo: "",
    hero: "",
    profile: "",
    heroDecoration: `${publicBase}/assets/template/hair-tools.png`,
    beforeAfter: [],
    gallery: [],
  },

  services: {
    groups: [],
  },

  i18n: {
    localLocale: "ru",
    locales: [
      { code: "ru", label: "RU" },
      { code: "en", label: "EN" },
    ],
    // Optional verified local spelling/transliteration of the master's personal name.
    // Example: masterNames: { kk: "..." }. Never machine-translate a personal name.
    masterNames: {},
    translations: {
      en: {},
    },
  },

  reviews: [],
  promotions: [],
  amenities: [],

  seo: {
    siteUrl: "https://example.com/",
    title: "TANEM — шаблон мастера",
    description: "Чистый шаблон сайта мастера TANEM.",
    keywords: [],
    locale: "ru_RU",
  },

  analytics: {
    yandexMetrikaId: "",
  },
};
