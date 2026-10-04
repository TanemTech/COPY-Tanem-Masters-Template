export const UI_TRANSLATION_KEYS = [
  "Услуги и цены",
  "О мастере",
  "Отзывы",
  "Визит и запись",
  "Портфолио",
  "Записаться онлайн",
  "Смотреть работы",
  "Смотреть все работы",
  "Работы",
  "Открыть галерею",
  "Выберите услугу",
  "Актуальная стоимость и продолжительность указаны для каждой процедуры. Онлайн-запись откроется в новой вкладке.",
  "Стоимость и продолжительность указаны для каждой процедуры. Нажмите на услугу, чтобы выбрать способ связи.",
  "Все",
  "Свернуть",
  "Продолжить",
  "Подробнее",
  "Открыть все услуги",
  "Открыть ещё",
  "услугу",
  "услуг",
  "Свернуть услуги",
  "лет опыта",
  "рейтинг",
  "услуги",
  "Дополнительно",
  "Полезно перед записью",
  "Что говорят клиенты",
  "Запись и связь",
  "Позвонить",
  "Написать",
  "Локация",
  "Яндекс Карты",
  "Адрес и маршрут",
  "Построить маршрут",
  "Выбрать время онлайн",
  "Как вам удобнее записаться?",
  "Выберите удобный способ связи",
  "Закрыть",
  "Галерея",
  "Открыто до",
  "Закрыто до",
  "Создано в",
  "Открыть свободное время",
  "Запишитесь онлайн",
  "или свяжитесь любым удобным способом",
  "Запишитесь онлайн или свяжитесь любым удобным способом.",
  "эксперт по волосам",
  "эксперт по маникюру и педикюру",
  "Стрижки, окрашивание, блонд, уход и укладки с вниманием к состоянию волос, оттенку и вашему образу.",
  "Свяжитесь удобным способом",
  "Позвоните или напишите мастеру, чтобы согласовать услугу и время.",
  "Выберите свободное время онлайн. Если нужно уточнить услугу, свяжитесь с мастером напрямую.",
  "Запись через",
  "по предварительной записи",
  "Все отзывы в",
  "Зажмите ленту мышью и двигайте в любую сторону",
  "ваш",
  "Выбор услуги",
  "Мастер поможет определиться.",
  "Пожелания",
  "Покажите пример результата.",
  "Перенос записи",
  "Предупредите заранее.",
  "Все отзывы",
  "клиенты",
  "Категории услуг",
  "Разведите двумя пальцами, чтобы увеличить",
  "Предыдущая фотография",
  "Следующая фотография",
  "Закрыть фотографию",
  "Закрыть галерею",
  "Открыть меню",
  "Закрыть меню",
  "Открыть ещё {count} услуг",
];

const invalidLinks = new Set(["", "#", "about:blank"]);

export function hasUsableLink(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return Boolean(normalized) && !invalidLinks.has(normalized);
}

export function visibleServiceGroups(site) {
  const groups = Array.isArray(site?.services?.groups) ? site.services.groups : [];
  return groups
    .filter((group) => group && typeof group.id === "string" && group.id.trim())
    .map((group) => ({
      ...group,
      id: group.id.trim(),
      label: String(group.label || "").trim(),
      services: Array.isArray(group.services) ? group.services : [],
    }))
    .filter((group) => group.services.length > 0);
}

export function categoryMode(site) {
  const count = visibleServiceGroups(site).length;
  if (count <= 1) return "single";
  if (count === 2) return "two";
  return "many";
}

export function bookingMode(site) {
  return hasUsableLink(site?.links?.bookingUrl) ? "direct" : "contact";
}

export function serviceBookingUrl(service, site) {
  if (hasUsableLink(service?.url)) return service.url.trim();
  if (bookingMode(site) === "direct") return site.links.bookingUrl.trim();
  return "";
}

export function experienceMode(site) {
  const value = site?.master?.experienceYears;
  return value === null || value === undefined || String(value).trim() === "" ? "unknown" : "known";
}

export function specialtyMode(site) {
  const specialty = String(site?.template?.specialty || "").toLowerCase();
  if (specialty === "hair" || specialty === "nails") return specialty;
  return "generic";
}

export function masterImageSources(site) {
  const base = String(site?.basePath || "");
  const mode = specialtyMode(site);
  const explicitHero = String(site?.images?.hero || "").trim();
  const explicitProfile = String(site?.images?.profile || "").trim();

  // Read-only compatibility for older TAN-xxxx repositories. New sites must use hero/profile.
  const legacyHero = String(site?.images?.portrait || "").trim();
  const legacyProfile = String(site?.images?.about || "").trim();

  const fallbackRoot = mode === "hair" || mode === "nails"
    ? `${base}/fallback/masters/${mode}`
    : "";
  const placeholder = `${base}/placeholder.svg`;

  return {
    hero: explicitHero || legacyHero || (fallbackRoot ? `${fallbackRoot}/hero.webp` : placeholder),
    profile: explicitProfile || legacyProfile || (fallbackRoot ? `${fallbackRoot}/profile.webp` : explicitHero || legacyHero || placeholder),
  };
}

export function heroPreset(site) {
  const mode = specialtyMode(site);
  if (mode === "hair") {
    return {
      emphasis: "эксперт по волосам",
      copy: "Стрижки, окрашивание, блонд, уход и укладки с вниманием к состоянию волос, оттенку и вашему образу.",
    };
  }
  if (mode === "nails") {
    return {
      emphasis: "эксперт по маникюру и педикюру",
      copy: String(site?.master?.heroCopy || "").trim(),
    };
  }
  return {
    emphasis: String(site?.master?.heroEmphasis || "").trim(),
    copy: String(site?.master?.heroCopy || "").trim(),
  };
}

export const SERVICE_PREVIEW_LIMIT = 7;

export function collapsedServiceCounts(site) {
  const groups = visibleServiceGroups(site);
  const total = groups.reduce((sum, group) => sum + group.services.length, 0);
  const visible = Math.min(total, SERVICE_PREVIEW_LIMIT);
  const hidden = Math.max(total - visible, 0);
  return {
    total,
    mobileHidden: hidden,
    desktopHidden: hidden,
  };
}

export function masterFirstName(site) {
  const fullName = String(site?.master?.name || site?.brand?.name || "").trim();
  return fullName.split(/\s+/).filter(Boolean)[0] || "";
}

export function masterInitial(site) {
  const name = masterFirstName(site) || "T";
  return Array.from(name)[0]?.toUpperCase() || "T";
}

export function masterNameForLocale(site, locale) {
  const original = String(site?.master?.name || "").trim();
  const brandFallback = String(site?.brand?.name || "").trim();
  if (!original) return brandFallback;

  const code = String(locale || "").trim().toLowerCase();
  const localized = String(site?.i18n?.masterNames?.[code] || "").trim();
  return localized || original;
}

export function aboutPreset(site) {
  const mode = specialtyMode(site);
  const name = masterFirstName(site);
  const experience = site?.master?.experienceYears;
  const hasExperience = experience !== null && experience !== undefined && String(experience).trim() !== "";
  const experienceYears = String(experience ?? "").trim().replace(/\s*лет$/i, "").replace(/\+$/, "").trim();
  const experienceCopy = hasExperience && experienceYears ? ` со стажем более ${experienceYears} лет` : "";

  if (mode === "hair") {
    return {
      lead: `Я ${name} — эксперт по волосам${experienceCopy}.`,
      paragraphs: [
        "Специализируюсь на стрижках и окрашивании, blond и сложных техниках, уходе и реконструкции волос.",
        "Работаю с формой, цветом и состоянием волос, чтобы результат выглядел цельно и подходил именно вам.",
      ],
      skills: [
        "Стрижки и окрашивание",
        "Blond и сложные техники",
        "Уход и реконструкция волос",
      ],
    };
  }

  if (mode === "nails") {
    return {
      lead: `Я ${name} — эксперт по маникюру и педикюру${experienceCopy}.`,
      paragraphs: [
        "Выполняю маникюр и педикюр, наращивание и коррекцию ногтей.",
        "Работаю со стерильными инструментами и уделяю внимание аккуратности, форме и качеству результата.",
      ],
      skills: [
        "Маникюр и педикюр",
        "Наращивание и коррекция",
        "Стерильные инструменты",
      ],
    };
  }

  return {
    lead: String(site?.master?.aboutLead || "").trim(),
    paragraphs: Array.isArray(site?.master?.aboutParagraphs) ? site.master.aboutParagraphs : [],
    skills: Array.isArray(site?.master?.skills) ? site.master.skills : [],
  };
}

export function hasLogo(site) {
  return hasUsableLink(site?.images?.logo);
}

export function normalizedLocales(site) {
  const source = Array.isArray(site?.i18n?.locales) ? site.i18n.locales : [];
  const seen = new Set();
  const result = [];
  for (const item of source) {
    const code = String(item?.code || "").trim().toLowerCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    result.push({ code, label: String(item?.label || code.toUpperCase()).trim() || code.toUpperCase() });
  }
  return result;
}

export function chooseInitialLocale(site, browserLanguages = [], savedLocale = "") {
  const locales = normalizedLocales(site);
  const supported = new Set(locales.map((item) => item.code));
  const saved = String(savedLocale || "").toLowerCase();
  if (supported.has(saved)) return saved;

  for (const raw of browserLanguages) {
    const language = String(raw || "").toLowerCase();
    const exact = locales.find((item) => language === item.code || language.startsWith(item.code + "-"));
    if (exact) return exact.code;
  }

  if (supported.has("en")) return "en";
  return locales[0]?.code || "ru";
}

export function contactOptions(site) {
  const result = [];
  const seen = new Set();

  if (hasUsableLink(site?.contacts?.phoneHref)) {
    const url = String(site.contacts.phoneHref);
    result.push({ kind: "phone", label: String(site?.contacts?.phoneDisplay || "Phone"), url });
    seen.add(`phone|${url}`);
  }

  const pushChannel = (channel) => {
    if (!channel || !hasUsableLink(channel.url)) return;
    const kind = String(channel.type || "messenger").trim().toLowerCase() || "messenger";
    const url = String(channel.url).trim();
    if (kind === "instagram" || url.toLowerCase().includes("instagram.com")) return;

    const key = `${kind}|${url}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ kind, label: String(channel.label || "Messenger"), url });
  };

  const channels = Array.isArray(site?.contacts?.channels) ? site.contacts.channels : [];
  for (const channel of channels) pushChannel(channel);

  // Backward compatibility for older TAN-xxxx repositories.
  pushChannel(site?.contacts?.messenger);

  return result;
}


export function clientTranslationKeys(site) {
  const values = [];
  const add = (value) => {
    const text = String(value || "").trim();
    if (text) values.push(text);
  };

  // Identity fields are source-locked. Brand names are never translated here.
  // Personal names use i18n.masterNames only when a verified local spelling/transliteration exists.
  add(site?.master?.profession);
  add(site?.master?.heroEmphasis);
  add(site?.master?.heroCaption);
  add(site?.master?.imageAlt);
  add(site?.master?.heroCopy);
  const preset = heroPreset(site);
  add(preset.emphasis);
  add(preset.copy);
  add(site?.master?.visitMotto);
  add(site?.master?.aboutTitle);
  const approvedAbout = aboutPreset(site);
  add(approvedAbout.lead);
  for (const value of approvedAbout.paragraphs || []) add(value);
  for (const value of approvedAbout.skills || []) add(value);

  add(site?.location?.city);
  add(site?.location?.metro);
  add(site?.location?.cityMetro);
  // Exact street/address strings stay verbatim to avoid changing route-critical source data.
  add(site?.location?.schedule);
  add(site?.location?.scheduleCapitalized);

  for (const group of visibleServiceGroups(site)) {
    add(group.label);
    for (const service of group.services) {
      add(service?.name);
      add(service?.displayName);
      add(service?.time);
      add(service?.description);
      for (const variant of service?.variants || []) {
        add(variant?.label);
        add(variant?.time);
      }
    }
  }

  for (const item of site?.amenities || []) {
    add(item?.title);
    add(item?.text);
  }

  return [...new Set(values)];
}
