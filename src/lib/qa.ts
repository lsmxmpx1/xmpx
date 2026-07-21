export interface QaCategory {
  key: string;
  name: string;
  icon: string;
  desc: string;
}

// 问答社区五大板块（人工审核防广告）
export const QA_CATEGORIES: QaCategory[] = [
  {
    key: "welfare",
    name: "福利活动区",
    icon: "🎁",
    desc: "培训机构发布体验课、优惠、开班通知",
  },
  {
    key: "review",
    name: "机构测评专区",
    icon: "⭐",
    desc: "学员点评本地培训班，吐槽坑店、分享靠谱机构",
  },
  {
    key: "policy",
    name: "政策答疑区",
    icon: "📋",
    desc: "会计、电工、学历、公考、人力证相关政策、报名流程提问",
  },
  {
    key: "subsidy",
    name: "本地补贴问答",
    icon: "💰",
    desc: "厦门技能补贴、学历补贴申领流程",
  },
  {
    key: "other",
    name: "其他培训问题",
    icon: "💡",
    desc: "其他有关培训的相关问题",
  },
];

export function getQaCategory(key: string): QaCategory | undefined {
  return QA_CATEGORIES.find((c) => c.key === key);
}

// 提问状态映射（用于前台/后台展示）
export const QUESTION_STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
  TAKEDOWN: "已下架",
};
