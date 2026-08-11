/**
 * 留言内容安全审核（基础版）
 * 依据《网络信息内容生态治理规定》等法规，对违法不良信息进行拦截。
 * 命中即拒绝写入。生产环境建议接入腾讯云/阿里云内容安全做 AI 识别 + 人工复审。
 */

export type SensitiveCategory =
  | "political" | "rumor" | "cyberbullying" | "infringement"
  | "porn" | "violence" | "gambling" | "loan" | "scam"
  | "drug" | "illegal" | "externallink";

const CATEGORY_LABEL: Record<SensitiveCategory, string> = {
  political: "敏感言论", rumor: "谣言", cyberbullying: "网络暴力",
  infringement: "侵权内容", porn: "色情低俗", violence: "暴力恐怖",
  gambling: "赌博", loan: "违规贷款", scam: "诈骗",
  drug: "毒品违禁", illegal: "违法违规", externallink: "外链内容",
};

const DICTIONARY: Record<SensitiveCategory, string[]> = {
  political: ["分裂国家","颠覆国家","造反","暴动","推翻政府","独立建国","港独","台独","疆独","藏独","法轮","邪教"],
  rumor: ["谣言","谣传","造谣","传谣","散布谣言","不实消息","虚假信息"],
  cyberbullying: ["人肉搜索","网络暴力","网暴","地域黑","恶意攻击","死亡威胁"],
  infringement: ["侵权","盗版","抄袭","侵犯版权","盗用","山寨"],
  porn: ["裸聊","约炮","一夜情","黄色网站","色情网站","性交","强奸","嫖娼","援交","性爱","自慰","淫荡"],
  violence: ["杀人","杀光","爆炸","炸弹","恐怖袭击","持刀行凶","放火","纵火","砍人","虐杀","暴力革命"],
  gambling: ["赌博","博彩","六合彩","私彩","网络赌博","赌球","老虎机","地下赌场","彩票私庄","杀猪盘"],
  loan: ["贷款","借款","网贷","小额贷款","高利贷","套路贷","714高炮","现金贷","借钱免息"],
  scam: ["诈骗","兼职刷单","刷单返利","中奖短信","冒充客服","钓鱼","返利","充值返现"],
  drug: ["毒品","冰毒","海洛因","大麻","摇头丸","可卡因","罂粟","吸毒","贩毒","制毒"],
  illegal: ["代开发票","虚开增值税发票","办假证","假文凭","枪支","军火","贩卖人口","人体器官","非法集资","传销","网络诈骗"],
  externallink: [],
};

export interface ModerationResult {
  blocked: boolean;
  category?: SensitiveCategory;
  label?: string;
  matched?: string;
}

/** 归一化：转小写、去空白与常见分隔符、全角转半角，以抵抗简单绕过 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s　.·\-_|]/g, "")
    .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

/** 检测文本是否含外链（http/https/www. 或常见域名后缀） */
export function containsExternalLink(text: string): boolean {
  const t = (text || "").toLowerCase();
  if (/https?:\/\//.test(t)) return true;
  if (/www\.[a-z0-9-]+\./.test(t)) return true;
  if (/[a-z0-9-]+\.(com|cn|net|org|xyz|top|vip|cc|info|link|shop|club)\b/.test(t)) return true;
  return false;
}

/**
 * 检测文本是否含敏感词 / 外链。命中返回 blocked=true 及类别信息。
 * 先查外链（正则），再查关键词字典（归一化后子串匹配）。
 */
export function checkSensitiveContent(raw: string): ModerationResult {
  const text = normalize(raw ?? "");
  if (!text) return { blocked: false };

  if (containsExternalLink(raw ?? "")) {
    return { blocked: true, category: "externallink", label: CATEGORY_LABEL.externallink };
  }

  for (const [cat, words] of Object.entries(DICTIONARY) as [SensitiveCategory, string[]][]) {
    for (const w of words) {
      if (!w) continue;
      const nw = normalize(w);
      if (nw && text.includes(nw)) {
        return { blocked: true, category: cat, label: CATEGORY_LABEL[cat], matched: w };
      }
    }
  }
  return { blocked: false };
}
