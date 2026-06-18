// Minimal Telegram Bot API client (free). Used by the daily broadcast cron.
// Needs env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (channel @handle or numeric id).

const API = (token: string, method: string) =>
  `https://api.telegram.org/bot${token}/${method}`;

export type TgConfig = { token: string; chatId: string };

export function tgConfig(): TgConfig | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  return { token, chatId };
}

export async function sendMessage(
  cfg: TgConfig,
  text: string,
  opts?: { disablePreview?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(API(cfg.token, "sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: opts?.disablePreview ?? false,
      }),
    });
    const j = await res.json();
    return j?.ok ? { ok: true } : { ok: false, error: JSON.stringify(j) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function sendPhoto(
  cfg: TgConfig,
  photoUrl: string,
  caption: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(API(cfg.token, "sendPhoto"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        photo: photoUrl,
        caption,
        parse_mode: "HTML",
      }),
    });
    const j = await res.json();
    return j?.ok ? { ok: true } : { ok: false, error: JSON.stringify(j) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
