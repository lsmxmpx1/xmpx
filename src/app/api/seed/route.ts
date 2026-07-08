import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Parent categories with subcategories
const CATEGORY_TREE = [
  {
    name: "中小学辅导", slug: "k12", icon: "📚",
    children: [
      { name: "小学辅导", slug: "k12-primary", icon: "✏️" },
      { name: "初中辅导", slug: "k12-junior", icon: "📘" },
      { name: "高中辅导", slug: "k12-senior", icon: "📕" },
      { name: "中考冲刺", slug: "k12-zhongkao", icon: "🎯" },
      { name: "高考冲刺", slug: "k12-gaokao", icon: "🏆" },
      { name: "奥数竞赛", slug: "k12-olympiad", icon: "🧮" },
      { name: "作文阅读", slug: "k12-chinese", icon: "✍️" },
    ],
  },
  {
    name: "艺术兴趣", slug: "art", icon: "🎨",
    children: [
      { name: "少儿美术", slug: "art-children", icon: "🖍️" },
      { name: "素描水彩", slug: "art-sketch", icon: "🖼️" },
      { name: "舞蹈培训", slug: "art-dance", icon: "💃" },
      { name: "钢琴培训", slug: "art-piano", icon: "🎹" },
      { name: "声乐培训", slug: "art-vocal", icon: "🎤" },
      { name: "书法培训", slug: "art-calligraphy", icon: "🖌️" },
      { name: "乐器培训", slug: "art-instrument", icon: "🎸" },
    ],
  },
  {
    name: "体育运动", slug: "sports", icon: "⚽",
    children: [
      { name: "游泳培训", slug: "sports-swimming", icon: "🏊" },
      { name: "篮球培训", slug: "sports-basketball", icon: "🏀" },
      { name: "足球培训", slug: "sports-football", icon: "⚽" },
      { name: "羽毛球", slug: "sports-badminton", icon: "🏸" },
      { name: "武术跆拳道", slug: "sports-martial", icon: "🥋" },
      { name: "体能训练", slug: "sports-fitness", icon: "💪" },
      { name: "网球培训", slug: "sports-tennis", icon: "🎾" },
    ],
  },
  {
    name: "职业技能", slug: "vocational", icon: "💼",
    children: [
      { name: "IT编程", slug: "vocational-it", icon: "💻" },
      { name: "UI设计", slug: "vocational-design", icon: "🎨" },
      { name: "电商运营", slug: "vocational-ecommerce", icon: "📦" },
      { name: "财务会计", slug: "vocational-accounting", icon: "📊" },
      { name: "厨师烹饪", slug: "vocational-cooking", icon: "👨‍🍳" },
      { name: "美容美发", slug: "vocational-beauty", icon: "💇" },
      { name: "电工焊工", slug: "vocational-electrician", icon: "🔌" },
      { name: "驾驶培训", slug: "vocational-driving", icon: "🚗" },
    ],
  },
  {
    name: "学历提升", slug: "degree", icon: "🎓",
    children: [
      { name: "成人高考", slug: "degree-chengkao", icon: "📝" },
      { name: "自学考试", slug: "degree-zikao", icon: "📖" },
      { name: "远程教育", slug: "degree-remote", icon: "🖥️" },
      { name: "考研辅导", slug: "degree-kaoyan", icon: "🎓" },
      { name: "专升本", slug: "degree-zhuanshengben", icon: "📚" },
      { name: "MBA/MPA", slug: "degree-mba", icon: "👔" },
    ],
  },
  {
    name: "考证培训", slug: "certification", icon: "📋",
    children: [
      { name: "教师资格证", slug: "cert-teacher", icon: "👩‍🏫" },
      { name: "建造师", slug: "cert-builder", icon: "🏗️" },
      { name: "消防工程师", slug: "cert-fire", icon: "🚒" },
      { name: "注册会计师", slug: "cert-cpa", icon: "🧾" },
      { name: "医药护药", slug: "cert-medical", icon: "⚕️" },
      { name: "公务员考试", slug: "cert-civil", icon: "🏛️" },
      { name: "心理咨询", slug: "cert-psychology", icon: "🧠" },
    ],
  },
  {
    name: "语言留学", slug: "language", icon: "🌍",
    children: [
      { name: "英语培训", slug: "language-english", icon: "🗣️" },
      { name: "雅思托福", slug: "language-ielts", icon: "✈️" },
      { name: "日语培训", slug: "language-japanese", icon: "🗾" },
      { name: "韩语培训", slug: "language-korean", icon: "🇰🇷" },
      { name: "少儿英语", slug: "language-children", icon: "👶" },
      { name: "商务英语", slug: "language-business", icon: "💼" },
      { name: "留学申请", slug: "language-abroad", icon: "🎓" },
    ],
  },
];

// Helper: Picsum Photos fixed URL by seed (images are consistent for same seed)
function picsum(seed: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export async function GET() {
  try {
    // === 1. Create parent categories and subcategories ===
    const catMap: Record<string, string> = {};

    for (const parent of CATEGORY_TREE) {
      const parentCat = await prisma.category.upsert({
        where: { slug: parent.slug },
        update: { name: parent.name, icon: parent.icon },
        create: { name: parent.name, slug: parent.slug, icon: parent.icon },
      });
      catMap[parent.slug] = parentCat.id;

      for (const child of parent.children) {
        const childCat = await prisma.category.upsert({
          where: { slug: child.slug },
          update: { name: child.name, icon: child.icon, parentId: parentCat.id },
          create: { name: child.name, slug: child.slug, icon: child.icon, parentId: parentCat.id },
        });
        catMap[child.slug] = childCat.id;
      }
    }

    // === 2. Institutions with real images ===
    const instsData = [
      {
        name: "思明区新东方培训学校", slug: "xdf-siming", district: "思明区",
        phone: "0592-1234567", website: "https://www.xdf.cn", featured: true,
        description: "全国知名教育培训机构，提供K12全科辅导、留学考试、职业技能等全方位培训服务。",
        logo: picsum("xdf-logo", 200, 200),
        cover: picsum("xdf-cover", 1200, 400),
        images: [picsum("xdf-1"), picsum("xdf-2"), picsum("xdf-3")].join(","),
      },
      {
        name: "湖里区学而思培优", slug: "xes-huli", district: "湖里区",
        phone: "0592-2345678", website: "https://www.xueersi.com", featured: true,
        description: "专注中小学课外辅导，小班教学，名师授课，培养优秀学习习惯。",
        logo: picsum("xes-logo", 200, 200),
        cover: picsum("xes-cover", 1200, 400),
        images: [picsum("xes-1"), picsum("xes-2"), picsum("xes-3")].join(","),
      },
      {
        name: "集美学村艺术中心", slug: "jm-art", district: "集美区",
        phone: "0592-3456789", featured: false,
        description: "集美大学片区优质艺术培训机构，开设美术、舞蹈、钢琴、书法等课程。",
        logo: picsum("art-center-logo", 200, 200),
        cover: picsum("art-studio", 1200, 400),
        images: [picsum("art-class"), picsum("dance-studio"), picsum("piano-lesson")].join(","),
      },
      {
        name: "海沧区卓越教育", slug: "zy-haicang", district: "海沧区",
        phone: "0592-4567890", featured: false,
        description: "海沧区知名培训机构，课程涵盖文化课辅导、兴趣班、托管等一站式服务。",
        logo: picsum("education-logo", 200, 200),
        cover: picsum("training-center", 1200, 400),
        images: [picsum("classroom"), picsum("kids-learning"), picsum("afterschool")].join(","),
      },
      {
        name: "厦门环球雅思", slug: "gys-xm", district: "思明区",
        phone: "0592-5678901", website: "https://www.gedu.org", featured: true,
        description: "专注雅思、托福、GRE等出国留学考试培训，名师授课，高通过率。",
        logo: picsum("english-training-logo", 200, 200),
        cover: picsum("english-classroom", 1200, 400),
        images: [picsum("english-class"), picsum("language-lab"), picsum("students-english")].join(","),
      },
      {
        name: "同安区博识教育", slug: "bs-tongan", district: "同安区",
        phone: "0592-6789012", featured: false,
        description: "同安区老牌培训机构，提供中小学全科辅导、晚托、寒暑假集训营。",
        logo: picsum("tutoring-logo", 200, 200),
        cover: picsum("school-building", 1200, 400),
        images: [picsum("classroom"), picsum("library"), picsum("study-group")].join(","),
      },
      {
        name: "翔安区未来之星少儿培训", slug: "wl-star", district: "翔安区",
        phone: "0592-7890123", featured: false,
        description: "专注3-12岁少儿兴趣培养，开设美术、舞蹈、口才、编程等课程。",
        logo: picsum("kids-logo", 200, 200),
        cover: picsum("kids-activity", 1200, 400),
        images: [picsum("kids-art"), picsum("kids-dance"), picsum("kids-coding")].join(","),
      },
      {
        name: "厦门华图教育", slug: "ht-xm", district: "思明区",
        phone: "0592-8901234", website: "https://www.huatu.com", featured: true,
        description: "专注公务员、事业单位、教师资格证等公职类考试培训。",
        logo: picsum("exam-prep-logo", 200, 200),
        cover: picsum("exam-classroom", 1200, 400),
        images: [picsum("civil-service-class"), picsum("exam-prep"), picsum("teacher-training")].join(","),
      },
      {
        name: "厦门达内科技", slug: "tarena-xm", district: "思明区",
        phone: "0592-9012345", website: "https://www.tedu.cn", featured: true,
        description: "IT职业教育培训，开设Java、Python、前端、UI设计等课程，保就业。",
        logo: picsum("it-training-logo", 200, 200),
        cover: picsum("coding-bootcamp", 1200, 400),
        images: [picsum("programming-class"), picsum("computer-lab"), picsum("coding-students")].join(","),
      },
      {
        name: "湖里区恒大驾校", slug: "hd-jiaxiao", district: "湖里区",
        phone: "0592-0123456", featured: false,
        description: "正规驾校，自有训练场，教学规范，通过率高，提供C1/C2驾驶证培训。",
        logo: picsum("driving-school-logo", 200, 200),
        cover: picsum("driving-lesson", 1200, 400),
        images: [picsum("driving-training"), picsum("driving-car"), picsum("driving-instructor")].join(","),
      },
      {
        name: "集美区零基础编程营", slug: "jm-coding", district: "集美区",
        phone: "0592-1357924", featured: true,
        description: "面向青少年的编程教育，Scratch、Python、C++竞赛培训，培养编程思维。",
        logo: picsum("coding-kids-logo", 200, 200),
        cover: picsum("kids-coding", 1200, 400),
        images: [picsum("kids-programming"), picsum("scratch-coding"), picsum("python-kids")].join(","),
      },
      {
        name: "厦门新航道英语", slug: "xhd-xm", district: "思明区",
        phone: "0592-2468013", website: "https://www.xhd.cn", featured: true,
        description: "专业英语培训机构，涵盖商务英语、成人英语、企业团训等。",
        logo: picsum("english-logo", 200, 200),
        cover: picsum("business-english", 1200, 400),
        images: [picsum("english-class"), picsum("language-training"), picsum("english-conversation")].join(","),
      },
    ];

    let institutions = [];
    for (const data of instsData) {
      const inst = await prisma.institution.upsert({
        where: { slug: data.slug },
        update: {
          description: data.description,
          logo: data.logo,
          cover: data.cover,
          images: data.images,
          website: data.website || null,
          featured: data.featured,
        },
        create: {
          name: data.name,
          slug: data.slug,
          district: data.district,
          phone: data.phone,
          description: data.description,
          website: data.website || null,
          logo: data.logo,
          cover: data.cover,
          images: data.images,
          featured: data.featured,
          status: "APPROVED",
          rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          reviewCount: Math.floor(Math.random() * 200) + 10,
          courseCount: Math.floor(Math.random() * 15) + 3,
        },
      });
      institutions.push(inst);
    }

    // === 3. Courses with cover images ===
    const courses = [
      { title: "小学三年级数学思维训练班", cat: "k12-primary", price: "3800", desc: "培养数学逻辑思维，掌握解题技巧，小班教学，名师辅导。" },
      { title: "中考英语冲刺班", cat: "k12-zhongkao", price: "5200", desc: "中考英语冲刺辅导，涵盖听力、阅读、写作全模块，历年真题精讲。" },
      { title: "小学语文阅读与写作", cat: "k12-chinese", price: "3200", desc: "提升阅读理解能力，掌握写作技巧，培养语文素养。" },
      { title: "高中物理一对一辅导", cat: "k12-senior", price: "8000", desc: "高中物理重难点突破，一对一辅导，因材施教，快速提分。" },
      { title: "高考数学冲刺班", cat: "k12-gaokao", price: "9800", desc: "高考数学冲刺复习，真题模拟，考点串讲，冲刺高分。" },
      { title: "少儿创意美术班", cat: "art-children", price: "2800", desc: "激发孩子创造力与想象力，学习绘画基础，培养艺术兴趣。" },
      { title: "成人钢琴速成班", cat: "art-piano", price: "4500", desc: "零基础成人钢琴培训，12课时学会弹奏经典曲目。" },
      { title: "少儿中国舞考级班", cat: "art-dance", price: "3600", desc: "专业中国舞培训，考级辅导，培养气质与协调性。" },
      { title: "青少年游泳培训", cat: "sports-swimming", price: "2000", desc: "专业游泳教练，小班教学，学会蛙泳、自由泳等基本泳姿。" },
      { title: "少儿篮球训练营", cat: "sports-basketball", price: "3000", desc: "篮球基础培训，体能训练，团队合作，培养运动习惯。" },
      { title: "跆拳道少儿班", cat: "sports-martial", price: "2600", desc: "跆拳道基础培训，强身健体，培养自信心和纪律性。" },
      { title: "Python全栈开发就业班", cat: "vocational-it", price: "16800", desc: "Python全栈开发培训，涵盖Django、Flask、数据分析，包就业。" },
      { title: "UI设计速成班", cat: "vocational-design", price: "9800", desc: "UI/UX设计培训，学习Figma、Sketch、PS，作品集指导。" },
      { title: "初级会计职称培训", cat: "vocational-accounting", price: "2200", desc: "初级会计职称考试辅导，精讲考点，真题演练。" },
      { title: "C1驾照培训包过班", cat: "vocational-driving", price: "4500", desc: "C1驾驶证培训，自有训练场，金牌教练，通过率高。" },
      { title: "成人高考辅导班", cat: "degree-chengkao", price: "4500", desc: "成人高考全科辅导，涵盖语数英，冲刺录取线。" },
      { title: "考研数学全程班", cat: "degree-kaoyan", price: "6800", desc: "考研数学全程辅导，基础+强化+冲刺，名校名师。" },
      { title: "自考本科助学班", cat: "degree-zikao", price: "5500", desc: "自学考试本科辅导，全科教学，考试通关率高。" },
      { title: "教师资格证面试培训", cat: "cert-teacher", price: "1800", desc: "教资面试技巧培训，模拟演练，结构化问答指导。" },
      { title: "二级建造师培训", cat: "cert-builder", price: "5200", desc: "二建全科培训，法规+管理+实务，精讲+冲刺。" },
      { title: "CPA注册会计师培训", cat: "cert-cpa", price: "12000", desc: "CPA六科全程辅导，名师精讲，真题解析，通过率高。" },
      { title: "公务员省考笔试班", cat: "cert-civil", price: "8800", desc: "公务员考试行测+申论全科培训，小班教学，上岸率高。" },
      { title: "商务英语口语班", cat: "language-business", price: "5800", desc: "商务英语口语培训，外教小班，职场实用场景对话。" },
      { title: "日语N2考级班", cat: "language-japanese", price: "6800", desc: "日语N2考级培训，语法精讲，听力特训，真题模拟。" },
      { title: "雅思6.5分冲刺班", cat: "language-ielts", price: "12800", desc: "雅思6.5分冲刺培训，听说读写全模块，名师授课。" },
      { title: "少儿英语启蒙班", cat: "language-children", price: "3600", desc: "3-6岁少儿英语启蒙，趣味教学，培养语感和兴趣。" },
    ];

    let courseCount = 0;
    for (const data of courses) {
      const catId = catMap[data.cat];
      if (!catId) continue;
      const inst = institutions[Math.floor(Math.random() * institutions.length)];
      const slug = data.title.replace(/[^\w\u4e00-\u9fa5]/g, "-").toLowerCase() + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      
      // Generate course cover image based on category
      let coverKeyword = "education";
      if (data.cat.startsWith("k12")) coverKeyword = "k12-tutoring";
      else if (data.cat.startsWith("art")) coverKeyword = "art-class";
      else if (data.cat.startsWith("sports")) coverKeyword = "sports-training";
      else if (data.cat.startsWith("vocational")) coverKeyword = "vocational-training";
      else if (data.cat.startsWith("degree")) coverKeyword = "university-class";
      else if (data.cat.startsWith("cert")) coverKeyword = "exam-prep";
      else if (data.cat.startsWith("language")) coverKeyword = "language-class";
      
      const coverImg = picsum(coverKeyword, 600, 400);
      
      await prisma.course.create({
        data: {
          title: data.title,
          slug,
          price: data.price,
          originalPrice: String(Math.round(parseFloat(data.price) * 1.3)),
          description: data.desc,
          cover: coverImg,
          categoryId: catId,
          institutionId: inst.id,
          tags: "热门推荐",
        },
      });
      courseCount++;
    }

    // === 4. Articles ===
    const articles = [
      { title: "2026年厦门市中考政策解读：这些变化家长必须知道", summary: "2026年厦门中考政策迎来多项调整，包括总分变化、体育中考改革等。", cat: "教育政策", slug: "2026-zhongkao-zhengce" },
      { title: "暑假给孩子报培训班，这5个坑千万别踩", summary: "暑假是培训班的旺季，家长们在选择时要注意避开虚假宣传、资质不全等常见陷阱。", cat: "家长必读", slug: "shuqi-peixun-bi-keng" },
      { title: "2026年全国教师资格证考试时间安排及备考攻略", summary: "2026年教资考试时间已公布，笔试在下半年10月举行。", cat: "考试资讯", slug: "2026-jiaoshizi-exam" },
      { title: "少儿编程到底要不要学？一线老师这样说", summary: "编程教育越来越火，但孩子到底多大适合学编程？听听专业老师的建议。", cat: "学习方法", slug: "shaoer-biancheng" },
      { title: "厦门思明区培训机构白名单公布（2026年最新）", summary: "思明区教育局公布最新培训机构白名单，共120家机构通过年检。", cat: "机构动态", slug: "siming-baimingdan" },
      { title: "如何选择靠谱的驾校？厦门学车避坑指南", summary: "厦门驾校众多，如何选择最合适的驾校？从价格、场地、教练、通过率帮你分析。", cat: "学习方法", slug: "xiamen-jiaxiao-guide" },
    ];

    for (const a of articles) {
      await prisma.article.upsert({
        where: { slug: a.slug },
        update: {},
        create: {
          title: a.title, slug: a.slug, summary: a.summary,
          content: a.summary + "\n\n文章正文建设中...",
          category: a.cat, published: true, publishedAt: new Date(),
          cover: picsum("education-article", 600, 400),
        },
      });
    }

    // === 5. Ad Plans ===
    const adPlans = [
      {
        name: "基础推广",
        level: "BASIC",
        price: 299,
        duration: 30,
        features: "机构详情页优化展示|首页机构列表优先排序|机构Logo突出显示|1个月有效期",
        description: "适合刚入驻的机构，获得基本曝光加成，让更多学员看到您的机构。",
        sortOrder: 1,
      },
      {
        name: "精品推荐",
        level: "PREMIUM",
        price: 999,
        duration: 30,
        features: "首页精选推荐位展示|精选推荐页品牌卡片|分类页置顶排名|搜索结果优先|机构详情页专属标识|1个月有效期",
        description: "大幅提升曝光度，获得首页和推荐页的优质展示位，是性价比最高的推广方案。",
        sortOrder: 2,
      },
      {
        name: "旗舰推广",
        level: "FLAGSHIP",
        price: 2999,
        duration: 30,
        features: "全站最高曝光权重|首页轮播Banner位|精选推荐页首位展示|所有分类页TOP3|搜索结果置顶|专属品牌徽章|广告投放数据分析|1个月有效期",
        description: "全站最高等级推广，获得所有页面的优先展示权，适合追求最大曝光度的品牌机构。",
        sortOrder: 3,
      },
    ];

    for (const plan of adPlans) {
      await prisma.adPlan.upsert({
        where: { level: plan.level },
        update: {
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
          description: plan.description,
          sortOrder: plan.sortOrder,
        },
        create: plan,
      });
    }

    // === 6. Test user ===
    const hashed = await bcrypt.hash("123456", 12);
    await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: { name: "测试用户", email: "test@example.com", password: hashed, role: "USER" },
    });

    const parentCount = CATEGORY_TREE.length;
    const subCount = CATEGORY_TREE.reduce((sum, c) => sum + c.children.length, 0);

    return NextResponse.json({
      success: true,
      categories: `${parentCount} parent + ${subCount} subcategories`,
      institutions: institutions.length,
      courses: courseCount,
      articles: articles.length,
      adPlans: adPlans.length,
      testUser: "test@example.com / 123456",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
