/**
 * 演示数据种子脚本（仅用于本地截图 / 演示，不影响生产库）。
 * 运行：DATABASE_URL="file:./dev.db" node_modules/.bin/tsx scripts/seed-guide.ts
 *
 * 账号：
 *   机构：demo-jigou@xmpx.cn / Xmpx@123456   （角色 INSTITUTION）
 *   老师：demo-laoshi@xmpx.cn / Xmpx@123456   （角色 TEACHER）
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || "file:./dev.db" });
const prisma = new PrismaClient({ adapter });
const PW = "Xmpx@123456";
const ORG_EMAIL = "demo-jigou@xmpx.cn";
const TCH_EMAIL = "demo-laoshi@xmpx.cn";

async function main() {
  const hash = bcrypt.hashSync(PW, 10);

  // ── 幂等清理：删掉旧演示数据（按标识） ──
  await prisma.teacherReview.deleteMany({ where: { user: { email: { in: [ORG_EMAIL, TCH_EMAIL, "stu1@xmpx.cn", "stu2@xmpx.cn"] } } } }).catch(() => {});
  await prisma.teacherEmployment.deleteMany({}).catch(() => {});
  await prisma.teacher.deleteMany({ where: { user: { email: TCH_EMAIL } } }).catch(() => {});
  await prisma.contact.deleteMany({ where: { institution: { owner: { email: ORG_EMAIL } } } }).catch(() => {});
  await prisma.campus.deleteMany({ where: { institution: { owner: { email: ORG_EMAIL } } } }).catch(() => {});
  await prisma.course.deleteMany({ where: { institution: { owner: { email: ORG_EMAIL } } } }).catch(() => {});
  await prisma.adOrder.deleteMany({ where: { institution: { owner: { email: ORG_EMAIL } } } }).catch(() => {});
  await prisma.institution.deleteMany({ where: { owner: { email: ORG_EMAIL } } }).catch(() => {});
  await prisma.adPlan.deleteMany({ where: { level: { in: ["BASIC", "PREMIUM", "FLAGSHIP"] } } }).catch(() => {});
  await prisma.category.deleteMany({ where: { slug: { in: ["language", "ielts", "toefl", "exam", "kaoyan", "gongkao", "hobby", "coding", "art"] } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: { in: [ORG_EMAIL, TCH_EMAIL, "stu1@xmpx.cn", "stu2@xmpx.cn"] } } }).catch(() => {});

  // ── 分类（父+子） ──
  const lang = await prisma.category.create({ data: { name: "语言培训", slug: "language", icon: "🗣️" } });
  const exam = await prisma.category.create({ data: { name: "升学考试", slug: "exam", icon: "🎓" } });
  const hobby = await prisma.category.create({ data: { name: "兴趣特长", slug: "hobby", icon: "🎨" } });
  const ielts = await prisma.category.create({ data: { name: "雅思", slug: "ielts", parentId: lang.id } });
  const toefl = await prisma.category.create({ data: { name: "托福", slug: "toefl", parentId: lang.id } });
  const kaoyan = await prisma.category.create({ data: { name: "考研", slug: "kaoyan", parentId: exam.id } });
  const gongkao = await prisma.category.create({ data: { name: "公考", slug: "gongkao", parentId: exam.id } });
  const coding = await prisma.category.create({ data: { name: "少儿编程", slug: "coding", parentId: hobby.id } });
  const art = await prisma.category.create({ data: { name: "美术", slug: "art", parentId: hobby.id } });

  // ── 机构主账号 ──
  const orgUser = await prisma.user.create({
    data: { email: ORG_EMAIL, phone: "13800000001", name: "厦门优学教育", password: hash, role: "INSTITUTION", roles: "USER,INSTITUTION" },
  });

  // ── 机构 ──
  const inst = await prisma.institution.create({
    data: {
      name: "厦门优学教育",
      slug: "xiamen-youxue",
      district: "思明区",
      address: "厦门市思明区软件园二期观日路 1 号",
      phone: "0592-8888888",
      website: "https://www.youxue.example.com",
      description: "专注雅思 / 托福 / 考研英语培训 12 年，累计服务学员超 2 万名。金牌师资 + 小班教学 + 一对一规划，助你高效提分。",
      status: "APPROVED",
      featured: true,
      adLevel: "PREMIUM",
      rating: 4.8,
      reviewCount: 126,
      courseCount: 8,
      ownerId: orgUser.id,
    },
  });

  // ── 课程 ──
  const courses = [
    { title: "雅思 7 分冲刺小班", slug: "ielts-7", price: "6800", originalPrice: "8800", tags: "小班|保分", categoryId: ielts.id, description: "针对雅思目标 7 分的学员，4-6 人小班，名师精讲听说读写四项。" },
    { title: "托福 100 分全程班", slug: "toefl-100", price: "7200", originalPrice: "9200", tags: "全程", categoryId: toefl.id, description: "从基础到冲刺，系统化提升托福听说读写，配套模考与讲评。" },
    { title: "考研英语一 VIP 一对一", slug: "ky-en-1v1", price: "12000", originalPrice: "", tags: "一对一", categoryId: kaoyan.id, description: "资深考研英语讲师一对一规划，针对性突破长难句与作文。" },
    { title: "公务员行测申论冲刺", slug: "gk-cs", price: "5600", originalPrice: "6800", tags: "冲刺", categoryId: gongkao.id, description: "紧扣考纲，行测秒杀技巧 + 申论模板，考前高效提分。" },
    { title: "少儿 Scratch 编程启蒙", slug: "kid-scratch", price: "2980", originalPrice: "", tags: "启蒙", categoryId: coding.id, description: "适合 7-12 岁，趣味编程启蒙，培养逻辑思维与创造力。" },
    { title: "少儿创意美术周末班", slug: "kid-art", price: "2680", originalPrice: "", tags: "周末", categoryId: art.id, description: "专业美术老师带教，油画 / 水彩 / 素描系统入门。" },
    { title: "雅思口语 1 对 1 陪练", slug: "ielts-speak", price: "3000", originalPrice: "", tags: "口语|陪练", categoryId: ielts.id, description: "外教 + 中教双师口语陪练，Part1-3 全真模拟。" },
    { title: "托福写作精批 10 篇", slug: "toefl-write", price: "1980", originalPrice: "", tags: "写作|精批", categoryId: toefl.id, description: "托福独立 / 综合写作逐句精批，覆盖高频话题模板。" },
  ];
  const createdCourses = [];
  for (const c of courses) {
    createdCourses.push(await prisma.course.create({ data: { ...c, institutionId: inst.id, status: "ACTIVE" } }));
  }

  // ── 校区 ──
  await prisma.campus.create({ data: { institutionId: inst.id, name: "软件园主校区", address: "厦门市思明区软件园二期观日路 1 号", district: "思明区", phone: "0592-8888888", isMain: true, sortOrder: 0, lng: 118.19, lat: 24.49 } });
  await prisma.campus.create({ data: { institutionId: inst.id, name: "湖里校区", address: "厦门市湖里区枋湖西路 18 号", district: "湖里区", phone: "0592-6666666", isMain: false, sortOrder: 1, lng: 118.13, lat: 24.52 } });

  // ── 咨询线索 ──
  const contacts = [
    { name: "陈女士", phone: "13900001111", message: "想咨询雅思 7 分小班，孩子基础一般，多久能出分？", courseId: createdCourses[0].id },
    { name: "王先生", phone: "13900002222", message: "托福 100 全程班最近有试听课吗？", courseId: createdCourses[1].id },
    { name: "李同学", phone: "13900003333", message: "考研英语一对一怎么收费，能先体验一节课吗？", courseId: createdCourses[2].id },
    { name: "匿名用户", phone: "13900004444", message: "请问贵机构在集美有校区吗？想就近上课。" },
    { name: "张妈妈", phone: "13900005555", message: "少儿编程和美术可以都报吗？有没有联报优惠？", courseId: createdCourses[4].id },
    { name: "赵先生", phone: "13900006666", message: "公考冲刺班什么时候开课，名额还有吗？", courseId: createdCourses[3].id },
  ];
  for (const ct of contacts) {
    await prisma.contact.create({ data: { ...ct, institutionId: inst.id } });
  }

  // ── 广告套餐 + 生效订单 ──
  const basic = await prisma.adPlan.create({ data: { name: "基础套餐", level: "BASIC", price: 299, duration: 30, features: "课程列表优先展示|机构页基础标识", description: "适合刚入驻、想提升基础曝光的机构", active: true, sortOrder: 0 } });
  const premium = await prisma.adPlan.create({ data: { name: "推荐套餐", level: "PREMIUM", price: 699, duration: 30, features: "首页推荐位展示|搜索结果优先排序|机构页认证标识|课程列表优先展示", description: "性价比之选，显著提升曝光与咨询量", active: true, sortOrder: 1 } });
  await prisma.adPlan.create({ data: { name: "旗舰套餐", level: "FLAGSHIP", price: 1599, duration: 30, features: "首页顶部轮播|全站优先曝光|专属客服|数据周报", description: "旗舰级曝光，抢占本地培训流量入口", active: true, sortOrder: 2 } });
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  await prisma.adOrder.create({ data: { institutionId: inst.id, planId: premium.id, amount: 699, status: "ACTIVE", startDate: now, endDate: end, note: "演示订单" } });

  // ── 老师主账号 ──
  const tchUser = await prisma.user.create({
    data: { email: TCH_EMAIL, phone: "13800000002", name: "张明", password: hash, role: "TEACHER", roles: "USER,TEACHER" },
  });

  // ── 老师档案 ──
  const teacher = await prisma.teacher.create({
    data: {
      userId: tchUser.id,
      name: "张明",
      title: "资深雅思 / 托福讲师",
      bio: "英语专业八级，12 年一线教学经验，曾任知名机构教研主管。擅长雅思口语、托福写作，学员平均提分 1.5 分。",
      expertise: "雅思,托福,考研英语",
      district: "思明区",
      slug: "zhang-ming",
      rating: 4.9,
      reviewCount: 58,
      currentInstitutionId: inst.id,
      status: "ACTIVE",
    },
  });

  // ── 任职履历 ──
  await prisma.teacherEmployment.create({ data: { teacherId: teacher.id, institutionId: inst.id, title: "教学主管", startDate: new Date("2020-03-01") } });
  await prisma.teacherEmployment.create({ data: { teacherId: teacher.id, institutionId: inst.id, title: "雅思讲师", startDate: new Date("2014-09-01"), endDate: new Date("2020-02-28") } });

  // ── 学员评价 ──
  const stu1 = await prisma.user.create({ data: { email: "stu1@xmpx.cn", phone: "13700001111", name: "刘同学", roles: "USER", role: "USER" } });
  const stu2 = await prisma.user.create({ data: { email: "stu2@xmpx.cn", phone: "13700002222", name: "黄女士", roles: "USER", role: "USER" } });
  const reviews = [
    { userId: stu1.id, rating: 5, content: "张老师的口语课太有用了，Part2 逻辑一下子清晰了，首考就 7 分！", status: "RESOLVED", isPublic: true },
    { userId: stu2.id, rating: 5, content: "托福写作从 22 提到 28，精批真的细致，强烈推荐。", status: "RESOLVED", isPublic: true },
    { userId: stu1.id, rating: 4, content: "上课氛围轻松，知识点讲得很透，就是作业有点多哈哈。", status: "RESOLVED", isPublic: true },
    { userId: stu2.id, rating: 5, content: "一对一规划很负责，帮我制定了详细的备考时间表。", status: "RESOLVED", isPublic: true },
  ];
  for (const r of reviews) {
    await prisma.teacherReview.create({ data: { ...r, teacherId: teacher.id } });
  }

  console.log("✅ 演示数据播种完成");
  console.log("   机构后台登录：", ORG_EMAIL, "/", PW);
  console.log("   老师后台登录：", TCH_EMAIL, "/", PW);
  console.log("   机构 slug:", inst.slug, " 老师 slug:", teacher.slug);
}

main()
  .catch((e) => { console.error("❌ seed 失败:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
