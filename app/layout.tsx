import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "./template.css";
import site from "../site-data.mjs";
import { masterImageSources } from "../template-rules.mjs";

const resolvedImages = masterImageSources(site);
const systemFavicon = `${site.basePath}/favicon-source.png`;

export const metadata: Metadata = {
  metadataBase: new URL(site.seo.siteUrl || "https://example.com/"),
  title: site.seo.title,
  description: site.seo.description,
  keywords: site.seo.keywords,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.seo.title,
    description: site.seo.description,
    type: "website",
    locale: site.seo.locale,
    images: [resolvedImages.hero],
  },
  icons: {
    icon: systemFavicon,
    shortcut: systemFavicon,
    apple: systemFavicon,
  },
};

const yandexMetrikaCode = `
(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${site.analytics.yandexMetrikaId}', 'ym');

ym(${site.analytics.yandexMetrikaId}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
`;

const mapCardText = `${site.location.mapCardAddress}\\A ${site.location.cityMetro}   ↗`.replace(/"/g, '\\"');
const mapHrefMatch = String(site.links.yandexMapHrefMatch).replace(/"/g, '\\"');

const mapCleanupStyles = `
  .mct-map-wrap {
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    margin-top: 18px !important;
    overflow: visible !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .mct-map-wrap iframe {
    display: none !important;
  }

  .mct-map-wrap > a {
    position: relative !important;
    inset: auto !important;
    display: grid !important;
    grid-template-columns: 52px minmax(0, 1fr) !important;
    width: 100% !important;
    min-height: 94px !important;
    align-items: center !important;
    gap: 15px !important;
    padding: 18px 20px !important;
    border: 1px solid rgba(73, 56, 50, .13) !important;
    border-radius: 22px !important;
    background: linear-gradient(145deg, rgba(255,255,255,.82), rgba(238,226,217,.76)) !important;
    color: transparent !important;
    box-shadow: 0 16px 36px rgba(62, 47, 41, .08) !important;
    font-size: 0 !important;
    text-decoration: none !important;
    backdrop-filter: blur(14px) !important;
  }

  .mct-map-wrap > a::before {
    display: grid;
    width: 52px;
    height: 52px;
    place-items: center;
    border: 1px solid rgba(120, 91, 79, .18);
    border-radius: 50%;
    background: rgba(139, 113, 103, .09);
    color: #715b53;
    content: "⌖";
    font: 500 27px/1 "Cormorant Garamond", Georgia, serif;
  }

  .mct-map-wrap > a::after {
    color: #3f3430;
    content: "${mapCardText}";
    font: 600 14px/1.55 "Manrope", Arial, sans-serif;
    letter-spacing: -.01em;
    white-space: pre-line;
  }

  .mct-map-wrap > a:focus-visible {
    outline: 2px solid rgba(113, 91, 83, .55);
    outline-offset: 3px;
  }

  .mct-visit-details {
    min-height: 0 !important;
  }

  [href*="${mapHrefMatch}"] .mct-contact-copy strong {
    font-size: 0 !important;
  }

  [href*="${mapHrefMatch}"] .mct-contact-copy strong::after {
    content: "Локация";
    font-size: 13px;
  }

  [href*="${mapHrefMatch}"] .mct-contact-copy small {
    font-size: 0 !important;
  }

  [href*="${mapHrefMatch}"] .mct-contact-copy small::after {
    content: "${site.location.city}";
    font-size: 9px;
  }

  @media (max-width: 767px) {
    .mct-visit .mct-map-wrap {
      width: auto !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 16px var(--mct-shell-pad, 16px) 0 !important;
    }

    .mct-map-wrap > a {
      min-height: 88px !important;
      border-radius: 20px !important;
    }
  }

  @media (min-width: 768px) {
    .mct-visit-details {
      min-height: 0 !important;
      align-self: center !important;
    }

    .mct-map-wrap {
      flex: 0 0 auto !important;
      height: auto !important;
      min-height: 0 !important;
      margin-top: 28px !important;
    }

    .mct-map-wrap > a {
      grid-template-columns: 66px minmax(0, 1fr) !important;
      min-height: 148px !important;
      gap: 22px !important;
      padding: 30px 32px !important;
      border-radius: 28px !important;
    }

    .mct-map-wrap > a::before {
      width: 66px;
      height: 66px;
      font-size: 33px;
    }

    .mct-map-wrap > a::after {
      font-size: 16px;
      line-height: 1.65;
    }
  }
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <style dangerouslySetInnerHTML={{ __html: mapCleanupStyles }} />
      </head>
      <body>
        {children}
        {site.analytics.yandexMetrikaId ? (
          <>
            <script
              type="text/javascript"
              dangerouslySetInnerHTML={{ __html: yandexMetrikaCode }}
            />
            <noscript>
              <div>
                <img
                  src={`https://mc.yandex.ru/watch/${site.analytics.yandexMetrikaId}`}
                  style={{ position: "absolute", left: "-9999px" }}
                  alt=""
                />
              </div>
            </noscript>
          </>
        ) : null}
        <script src={`${site.basePath}/template-runtime.js`} defer />
      </body>
    </html>
  );
}
