import { formatPrice } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

interface CourseLite {
  title: string;
  price?: string | null;
}
interface InstitutionLite {
  name: string;
  district?: string | null;
  address?: string | null;
  courseCount?: number | null;
}
interface TeacherLite {
  name: string;
  title?: string | null;
  district?: string | null;
  expertise?: string | null;
  currentInstitution?: { name: string } | null;
}

/**
 * 课程详情高频 FAQ：命中「费用/线上还是线下/试听/包就业/课时/退费」等长尾搜索。
 * 答案随机构名、区域、价格动态填充，避免千篇一律。
 */
export function getCourseFaqs(course: CourseLite, institution?: InstitutionLite | null): FaqItem[] {
  const instName = institution?.name || "本机构";
  const district = institution?.district || "厦门";
  const price = course.price ? formatPrice(course.price) : "待咨询";
  return [
    {
      question: `${instName}的「${course.title}」课程费用是多少？`,
      answer: `该课程参考价格为 ${price}。具体优惠、班型及最新活动以机构实际报价为准，建议先咨询了解。`,
    },
    {
      question: `「${course.title}」是线上还是线下上课？`,
      answer: `${instName}位于${district}，以线下授课为主，部分科目支持线上或线上线下结合，具体上课形式可在咨询时与老师确认。`,
    },
    {
      question: `这门课程可以免费试听吗？`,
      answer: `支持预约试听，详情请联系${instName}预约，试听安排以机构实际排课为准。`,
    },
    {
      question: `学完包就业吗？`,
      answer: `机构提供就业指导与推荐服务，是否“包就业”以报名协议约定为准，报名前可与课程顾问详细确认。`,
    },
    {
      question: `课时和上课时间怎么安排？`,
      answer: `开课时间灵活，有平日班、周末班等多种班型可选，具体课表与课时安排建议咨询${instName}获取。`,
    },
    {
      question: `报名后如何退费？`,
      answer: `退费按机构报名协议执行，建议报名前仔细阅读退费条款并与机构确认，保障自身权益。`,
    },
  ];
}

/**
 * 机构详情高频 FAQ：命中「地址/课程/学费/师资/试听」等长尾搜索。
 */
export function getInstitutionFaqs(institution: InstitutionLite): FaqItem[] {
  const name = institution.name;
  const district = institution.district || "厦门";
  const courseCount = institution.courseCount || 0;
  return [
    {
      question: `${name}地址在哪里？怎么去？`,
      answer: institution.address
        ? `${name}位于${district}${institution.address}，可导航前往，建议到访前先电话确认营业时间。`
        : `${name}位于${district}，具体地址请在咨询时向机构获取，到访前建议先电话预约。`,
    },
    {
      question: `${name}有哪些课程？`,
      answer: `机构共开设约 ${courseCount} 门课程，涵盖多个培训品类，可在本页「开设课程」查看详情并对比选择。`,
    },
    {
      question: `学费怎么算？有优惠吗？`,
      answer: `不同课程价格不同，机构会不定期推出优惠活动，最新学费与优惠建议直接咨询${name}了解。`,
    },
    {
      question: `师资怎么样？`,
      answer: `${name}拥有专业师资团队，部分老师可在站内「找老师」频道查看履历与评价，建议结合试听综合判断。`,
    },
    {
      question: `可以预约试听吗？`,
      answer: `支持预约试听，联系机构即可安排，试听名额以实际排课为准。`,
    },
  ];
}

/**
 * 老师详情高频 FAQ：命中「教什么/怎么约课/上课地点/试听」等长尾搜索。
 */
export function getTeacherFaqs(teacher: TeacherLite): FaqItem[] {
  const name = teacher.name;
  const title = teacher.title || "培训老师";
  const district = teacher.district || "厦门";
  const inst = teacher.currentInstitution?.name;
  return [
    {
      question: `${name}老师主要教什么？`,
      answer: teacher.expertise
        ? `${name}（${title}）擅长${teacher.expertise}，可在本页查看擅长课程与学员评价。`
        : `${name}（${title}）在${inst || "厦门"}从事培训工作，擅长科目见上方「擅长课程」。`,
    },
    {
      question: `怎么约${name}老师的课？`,
      answer: inst
        ? `可通过站内私信联系${name}老师，或前往其任职机构「${inst}」咨询报名。`
        : `可通过站内私信联系${name}老师预约课程与试听。`,
    },
    {
      question: `${name}老师上课地点在哪里？`,
      answer: `${name}老师目前在${district}授课${inst ? `，任职于${inst}` : ""}，具体上课地点以机构安排为准。`,
    },
    {
      question: `可以试听吗？`,
      answer: `是否支持试听以老师与机构安排为准，建议先私信沟通确认。`,
    },
  ];
}

/**
 * 资讯文章通用 FAQ：引导到机构/课程频道，承接「厦门靠谱培训机构/报名/价格」类搜索。
 */
export function getArticleFaqs(): FaqItem[] {
  return [
    {
      question: "厦门有哪些靠谱的培训机构？",
      answer: "可在厦门培训网「机构」频道按区域、品类筛选对比，查看评分与学员评价后再做决定。",
    },
    {
      question: "如何咨询报名课程？",
      answer: "在课程或机构详情页点击「立即咨询」或「私信」，即可联系机构/老师了解报名事宜。",
    },
    {
      question: "厦门培训课程价格大概多少？",
      answer: "不同品类与班型价格差异较大，可在本站按品类筛选查看各家机构报价并对比。",
    },
  ];
}
