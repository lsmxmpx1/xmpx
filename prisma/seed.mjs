import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始播种数据...");

  const categories = await Promise.all([
    prisma.category.create({ data: { name: "中小学辅导", slug: "k12", icon: "📚" } }),
    prisma.category.create({ data: { name: "艺术兴趣", slug: "art", icon: "🎨" } }),
    prisma.category.create({ data: { name: "体育运动", slug: "sports", icon: "⚽" } }),
    prisma.category.create({ data: { name: "职业技能", slug: "vocational", icon: "💼" } }),
    prisma.category.create({ data: { name: "学历提升", slug: "degree", icon: "🎓" } }),
    prisma.category.create({ data: { name: "考证培训", slug: "certification", icon: "📋" } }),
    prisma.category.create({ data: { name: "语言留学", slug: "language", icon: "🌍" } }),
  ]);
  console.log(`✅ ${categories.length} 个分类`);

  const insts = [
    { name: "思明区新东方培训学校", slug: "xindongfang-siming", district: "思明区", phone: "0592-1234567", description: "全国知名教育培训机构，提供K12全科辅导、留学考试、职业技能等全方位培训服务。" },
    { name: "湖里区学而思培优", slug: "xueersi-huli", district: "湖里区", phone: "0592-2345678", description: "专注中小学课外辅导，小班教学，名师授课。" },
    { name: "集美学村艺术中心", slug: "jimei-art", district: "集美区", phone: "0592-3456789", description: "集美大学片区优质艺术培训机构，开设美术、舞蹈、钢琴、书法等课程。" },
    { name: "海沧区卓越教育", slug: "zhuoyue-haicang", district: "海沧区", phone: "0592-4567890", description: "海沧区知名培训机构，课程涵盖文化课辅导、兴趣班、托管等一站式服务。" },
    { name: "厦门环球雅思", slug: "global-ielts-xm", district: "思明区", phone: "0592-5678901", description: "专注雅思、托福、GRE等出国留学考试培训，名师授课，高通过率。" },
    { name: "同安区博识教育", slug: "boshi-tongan", district: "同安区", phone: "0592-6789012", description: "同安区老牌培训机构，提供中小学全科辅导、晚托、寒暑假集训营。" },
    { name: "翔安区未来之星少儿培训", slug: "weilai-xiangan", district: "翔安区", phone: "0592-7890123", description: "专注3-12岁少儿兴趣培养，开设美术、舞蹈、口才、编程等课程。" },
    { name: "厦门华图教育", slug: "huatu-xm", district: "思明区", phone: "0592-8901234", description: "专注公务员、事业单位、教师资格证等公职类考试培训。" },
    { name: "厦门达内科技", slug: "tarena-xm", district: "思明区", phone: "0592-9012345", description: "IT职业教育培训，开设Java、Python、前端、UI设计等课程，保就业。" },
    { name: "湖里区恒大驾校", slug: "hengda-jiaxiao", district: "湖里区", phone: "0592-0123456", description: "正规驾校，自有训练场，教学规范，通过率高。" },
    { name: "集美区零基础编程营", slug: "jimei-coding", district: "集美区", phone: "0592-1357924", description: "面向青少年的编程教育，Scratch、Python、C++竞赛培训。" },
    { name: "厦门新航道英语", slug: "newchannel-xm", district: "思明区", phone: "0592-2468013", description: "专业英语培训机构，涵盖商务英语、成人英语、企业团训等。" },
  ];

  const institutions = [];
  for (const data of insts) {
    const inst = await prisma.institution.create({
      data: {
        ...data,
        status: "APPROVED",
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 200) + 10,
        courseCount: Math.floor(Math.random() * 15) + 3,
      },
    });
    institutions.push(inst);
  }
  console.log(`✅ ${institutions.length} 个机构`);

  const courseData = [
    { title: "小学三年级数学思维训练班", cat: "k12", price: "3800" },
    { title: "中考英语冲刺班", cat: "k12", price: "5200" },
    { title: "小学语文阅读与写作", cat: "k12", price: "3200" },
    { title: "高中物理一对一辅导", cat: "k12", price: "8000" },
    { title: "少儿创意美术班", cat: "art", price: "2800" },
    { title: "成人钢琴速成班", cat: "art", price: "4500" },
    { title: "少儿中国舞考级班", cat: "art", price: "3600" },
    { title: "青少年游泳培训", cat: "sports", price: "2000" },
    { title: "少儿篮球训练营", cat: "sports", price: "3000" },
    { title: "Python全栈开发就业班", cat: "vocational", price: "16800" },
    { title: "UI设计速成班", cat: "vocational", price: "9800" },
    { title: "初级会计职称培训", cat: "vocational", price: "2200" },
    { title: "成人高考辅导班", cat: "degree", price: "4500" },
    { title: "考研数学全程班", cat: "degree", price: "6800" },
    { title: "教师资格证面试培训", cat: "certification", price: "1800" },
    { title: "二级建造师培训", cat: "certification", price: "5200" },
    { title: "CPA注册会计师培训", cat: "certification", price: "12000" },
    { title: "商务英语口语班", cat: "language", price: "5800" },
    { title: "日语N2考级班", cat: "language", price: "6800" },
    { title: "雅思6.5分冲刺班", cat: "language", price: "12800" },
  ];

  for (const data of courseData) {
    const cat = categories.find((c) => c.slug === data.cat);
    if (!cat) continue;
    const inst = institutions[Math.floor(Math.random() * institutions.length)];
    await prisma.course.create({
      data: {
        title: data.title,
        slug: data.title.replace(/[^\w\u4e00-\u9fa5]/g, "-").toLowerCase() + "-" + Date.now().toString(36),
        description: "专业培训课程，欢迎咨询报名",
        price: data.price,
        originalPrice: String(Math.round(parseFloat(data.price) * 1.3)),
        categoryId: cat.id,
        institutionId: inst.id,
        tags: "热门推荐",
      },
    });
  }
  console.log(`✅ ${courseData.length} 个课程`);

  const articles = [
    { title: "2026年厦门市中考政策解读：这些变化家长必须知道", summary: "2026年厦门中考政策迎来多项调整，包括总分变化、体育中考改革等。", category: "教育政策" },
    { title: "暑假给孩子报培训班，这5个坑千万别踩", summary: "暑假是培训班的旺季，家长们在选择时要注意避开虚假宣传、资质不全等常见陷阱。", category: "家长必读" },
    { title: "2026年全国教师资格证考试时间安排及备考攻略", summary: "2026年教师资格证考试时间已公布，笔试在下半年10月举行。", category: "考试资讯" },
    { title: "少儿编程到底要不要学？一线老师这样说", summary: "编程教育越来越火，但孩子到底多大适合学编程？听听专业老师的建议。", category: "学习方法" },
    { title: "厦门思明区培训机构白名单公布（2026年最新）", summary: "思明区教育局公布最新培训机构白名单，共120家机构通过年检。", category: "机构动态" },
    { title: "如何选择靠谱的驾校？厦门学车避坑指南", summary: "厦门驾校众多，如何选择最合适的驾校？从价格、场地、教练、通过率等维度帮你分析。", category: "学习方法" },
  ];

  for (const a of articles) {
    await prisma.article.create({
      data: {
        title: a.title,
        slug: a.title.replace(/[^\w\u4e00-\u9fa5]/g, "-").toLowerCase().slice(0, 50),
        summary: a.summary,
        content: a.summary + "\n\n（文章正文建设中...）",
        category: a.category,
        published: true,
        publishedAt: new Date(),
      },
    });
  }
  console.log(`✅ ${articles.length} 篇文章`);

  const hashed = await bcrypt.hash("123456", 12);
  await prisma.user.create({
    data: { name: "测试用户", email: "test@example.com", password: hashed, role: "USER" },
  });
  console.log("✅ 测试用户 (test@example.com / 123456)");

  console.log("\n🎉 种子数据完成！");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
