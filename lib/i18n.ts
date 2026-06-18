// Lightweight i18n — no library, just a dictionary + a tiny lookup.
// Default 简体中文; optional 繁体中文 + English. Strings live in STRINGS below
// (generated from the translation pass). Keep entries' arrays/lengths stable.

export type Lang = "zh-Hans" | "zh-Hant" | "en";

export const LANGS: { id: Lang; label: string }[] = [
  { id: "zh-Hans", label: "简" },
  { id: "zh-Hant", label: "繁" },
  { id: "en", label: "EN" },
];

export const DEFAULT_LANG: Lang = "zh-Hans";

/** html lang attribute value per app language. */
export function htmlLang(l: Lang): string {
  return l === "en" ? "en" : l === "zh-Hant" ? "zh-Hant" : "zh-Hans";
}

import { UI_STRINGS } from "./i18n-strings";

/** key → per-language string. Missing keys fall back to 简体, then the key. */
export const STRINGS: Record<string, Record<Lang, string>> = UI_STRINGS;

/**
 * Look up a string. `params` replaces `{name}` placeholders, e.g.
 * tr(lang, "qian.tier_cost", { burn: "1,000" }).
 */
export function tr(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>,
  fallback?: string
): string {
  const e = STRINGS[key];
  let s = e ? e[lang] ?? e["zh-Hans"] : fallback ?? key;
  if (params) {
    for (const k in params) s = s.split(`{${k}}`).join(String(params[k]));
  }
  return s;
}
