"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type Lang, DEFAULT_LANG, htmlLang, tr } from "@/lib/i18n";

const STORAGE_KEY = "ggb-lang";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangContext = createContext<Ctx>({ lang: DEFAULT_LANG, setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  // Start at the default so SSR + first client render match (no hydration
  // mismatch); load the saved choice after mount.
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && saved !== lang) {
        setLangState(saved);
        document.documentElement.lang = htmlLang(saved);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = htmlLang(l);
    } catch {
      /* ignore */
    }
  }, []);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Returns a `t(key, params?)` bound to the current language. */
export function useT() {
  const { lang } = useContext(LangContext);
  return useCallback(
    (key: string, params?: Record<string, string | number>, fallback?: string) =>
      tr(lang, key, params, fallback),
    [lang]
  );
}
