// 回本签 fortune content in 繁体 + English (意译). 简体 source stays in
// lib/fortune.ts (canonical, used by the server + the Chinese card PNG).
// Arrays MUST stay the same length per outcome as the 简体 ones, so the
// deterministic index (derived from the tx hash) maps to the same slot.
import type { Outcome } from "./fortune";
import type { Lang } from "./i18n";

export const VERDICTS_HANT: Record<Outcome, string[]> = {
  上上签: [
    "金狗搖尾，霉運退散，套牢的影子被一縷狗光照穿。",
    "今日狗氣沖天，回本的路忽然變短了一截。",
    "天狗食霉，舊賬翻篇，久違的微笑掛回臉上。",
    "狗神拍了拍你的肩：穩住，你比昨天更接近岸邊。",
    "一柱狗香直沖雲霄，連情緒都忍不住抬了抬頭。",
    "黑洞收下你的誠意，回贈你一身好運。",
    "上上大吉：狗在燒，運在漲，心情先回本。",
    "狗王為你點燈，前路忽然不那麼黑了。",
    "霉氣清零，狗氣滿格，今天適合相信奇蹟。",
    "你燒的不是幣，是命運給你讓出的一條路。",
    "祖傳狗運今日到賬，連空氣都是回甜的。",
    "烏雲裂開一條狗形的縫，光正好照在你頭上。",
  ],
  上签: [
    "狗運回暖，雖未大富，心頭先鬆了半口氣。",
    "穩中有狗，今日諸事順一點點，別小看這一點點。",
    "小吉到家：賬戶沒動，心態先回了血。",
    "狗尾輕搖，好事在路上，記得開門。",
    "今日風向偏暖，套牢的繩子鬆了一格。",
    "積小狗成大運，今天的香沒白上。",
    "方向對了，剩下的交給時間這條老狗。",
    "雲開見狗，前路漸明，步子可以穩一點。",
    "好運像狗一樣趕來，雖然慢，但忠誠。",
    "今日宜微笑，霉運正在打包離場。",
  ],
  中签: [
    "平平是福，狗子今天選擇躺平陪你。",
    "不上不下，正是修心好時節，香照上。",
    "風浪不大，適合喝口奶茶看看遠方。",
    "狗在觀望，你也別急，路還長。",
    "今日無功無過，守住手別亂動，就是贏。",
    "運勢如老狗散步，慢悠悠，但沒走丟。",
    "中規中矩的一天，適合積攢下一次的狗運。",
    "黑洞收下了，回響還在路上，耐心點。",
    "盈虧不過一念，狗也是這麼想的。",
    "不溫不火，剛好夠你睡個安穩覺。",
  ],
  下签: [
    "下籤別慌，狗最擅長的就是絕地翻身。",
    "今日狗氣偏弱，正好歇歇，明天再戰。",
    "霉是暫時的，狗是永遠的，香接著上。",
    "跌到底的好處是：再往下也沒多少路了。",
    "今天宜認慫，明天宜支棱。",
    "狗子摔了一跤，拍拍土，尾巴還在搖。",
    "運勢在打盹，別吵醒它，安靜持有。",
    "今日不宜衝動，宜抱緊你的狗與你的幣。",
    "黑暗裡也有狗在守夜，天會亮的。",
    "觸底才有反彈的故事可講，記下今天。",
  ],
};

export const VERDICTS_EN: Record<Outcome, string[]> = {
  上上签: [
    "Golden dog wags its tail—bad luck scatters, shadows of losses pierced by dog-light.",
    "Dog energy peaks today—the road to breakeven suddenly feels closer.",
    "Celestial dog devours bad luck—old debts turn the page, forgotten smiles return.",
    "Dog god pats your shoulder: Hold steady—you're closer to shore than yesterday.",
    "One stick of dog-incense pierces the sky—even your mood lifts its head.",
    "The black hole accepts your sincerity and gifts you fortune in return.",
    "Great good fortune: dogs burn, luck rises, your mood breaks even first.",
    "The Dog King lights a lamp for you—the path ahead suddenly glows.",
    "Bad luck erased, dog energy full—today is made for miracles.",
    "You're not burning coins—you're burning open a path fate made for you.",
    "Ancestral dog luck lands today—even the air tastes sweet again.",
    "Dark clouds crack open in a dog-shaped slit—light falls right on your head.",
  ],
  上签: [
    "Dog luck warms up—not rich yet, but your heart unclenches.",
    "Steady with dog vibes—things go a little smoother. Don't underestimate the little.",
    "Good fortune arrives: portfolio unchanged, but your mind is refreshed.",
    "The dog tail wags gently—good things are on the way. Remember to open the door.",
    "The wind turns warm today—the rope holding you loosens a notch.",
    "Stack small dog luck into big fortune—today's incense wasn't wasted.",
    "The direction is right—leave the rest to time, that old dog.",
    "Clouds part, dog appears—the path clears, you can step steadier.",
    "Good luck comes like a dog—slow, but loyal.",
    "Today calls for a smile—bad luck is packing up to leave.",
  ],
  中签: [
    "Ordinary is a blessing—the pup chooses to chill with you today.",
    "Neither up nor down—a fine season to settle the mind. Light the incense.",
    "Calm waters—good time for milk tea and gazing afar.",
    "The dog is watching and waiting—don't rush, the road is long.",
    "No gains, no losses today—keep your hands still and you win.",
    "Luck drifts like an old dog on a walk—slow, but not lost.",
    "A textbook day—good for stashing dog luck for next time.",
    "The black hole received it—the echo is still on its way. Be patient.",
    "Profit or loss is just a thought—the dog agrees.",
    "Neither hot nor cold—just right for a sound sleep.",
  ],
  下签: [
    "Lie low, don't panic—dogs are masters of the comeback.",
    "Dog energy is low today—rest up, fight again tomorrow.",
    "Bad luck is temporary, dogs are forever—keep the incense coming.",
    "The upside of hitting bottom: not much further down to go.",
    "Today: fold gracefully. Tomorrow: rise and shine.",
    "The pup takes a tumble, shakes off the dust—tail still wagging.",
    "Luck is napping—don't wake it, just hold quietly.",
    "Avoid rash moves today—hold tight to your dog and your coins.",
    "Even in the dark a dog keeps watch—the sun will rise.",
    "The bottom is where comeback stories begin—remember today.",
  ],
};

export const YI_HANT = [
  "上香求狗運", "抱團取暖", "截圖發群", "安靜持有", "喝杯奶茶",
  "摸摸狗頭", "深呼吸", "看看遠方", "給群友打氣", "記錄今天",
];
export const YI_EN = [
  "Offer incense for dog luck", "Huddle for warmth", "Screenshot & share", "Hold quietly", "Have some milk tea",
  "Pet a dog", "Take a deep breath", "Gaze into the distance", "Cheer up your crew", "Journal today",
];
export const JI_HANT = [
  "追高", "恐慌割肉", "半夜看盤", "梭哈", "盲目暴富夢", "FUD 帶節奏", "熬夜盯線", "和家人吵架",
];
export const JI_EN = [
  "Chase pumps", "Panic-sell", "Watch charts at 3am", "Go all-in", "Get-rich-quick dreams", "Spread FUD", "All-nighter on the charts", "Argue with family",
];

export const OUTCOME_LABEL_I18N: Record<Lang, Record<Outcome, string>> = {
  "zh-Hans": { 上上签: "天降狗运", 上签: "狗运回暖", 中签: "平平是福", 下签: "蓄势待发" },
  "zh-Hant": { 上上签: "天降狗運", 上签: "狗運回暖", 中签: "平平是福", 下签: "蓄勢待發" },
  en: { 上上签: "Great Fortune", 上签: "Good Fortune", 中签: "Fair", 下签: "Lie Low" },
};

export const OUTCOME_NAME_I18N: Record<Lang, Record<Outcome, string>> = {
  "zh-Hans": { 上上签: "上上签", 上签: "上签", 中签: "中签", 下签: "下签" },
  "zh-Hant": { 上上签: "上上籤", 上签: "上籤", 中签: "中籤", 下签: "下籤" },
  en: { 上上签: "Great", 上签: "Good", 中签: "Fair", 下签: "Lie Low" },
};

export const TIER_NAME_I18N: Record<Lang, Record<"common" | "master" | "king", string>> = {
  "zh-Hans": { common: "普通签", master: "大师签", king: "狗王签" },
  "zh-Hant": { common: "普通籤", master: "大師籤", king: "狗王籤" },
  en: { common: "Common", master: "Master", king: "Dog King" },
};

export const TIER_DESC_I18N: Record<Lang, Record<"common" | "master" | "king", string>> = {
  "zh-Hans": { common: "日常小烧，天天可求", master: "诚意加倍，吉签更旺", king: "王者一掷，必有回响" },
  "zh-Hant": { common: "日常小燒，天天可求", master: "誠意加倍，吉籤更旺", king: "王者一擲，必有回響" },
  en: { common: "Daily burn, draw anytime", master: "Double the devotion, better luck", king: "A king's wager, sure to echo" },
};
