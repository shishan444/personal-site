import { defineRouting } from "next-intl/routing";

export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/login": { zh: "/login", en: "/login" },
    "/change-password": { zh: "/change-password", en: "/change-password" },
    "/writing": { zh: "/writing", en: "/writing" },
    "/agents": { zh: "/agents", en: "/agents" },
    "/timeline": { zh: "/timeline", en: "/timeline" },
    "/admin": { zh: "/admin", en: "/admin" },
  },
});
