# 厦门培训网（xmpx.cn）SEO 优化策略

> 状态：技术地基阶段已完成（commit `e0a4686`）；详情页结构化数据、内容、外链为后续阶段。
> 本文档为策略总纲 + 落地清单，可按阶段指派执行。

---

## 一、现状诊断（代码审查结论）

**已有基础（保留）**
- `robots.ts` 已屏蔽 `/api/`、`/dashboard/`
- `sitemap.ts` 动态生成（课程/机构/文章/问答）—— 本轮已补全
- 详情页已用 `generateMetadata`（课程/机构/老师/文章/分类）
- 首页与详情页 ISR `revalidate=60`，利于收录与速度
- 已接 SpeedInsights + Analytics
- 部分图片使用 `next/image`

**核心短板（按影响排序）**
1. **结构化数据 JSON-LD 全缺** —— 无 Organization / Course / LocalBusiness / Article / BreadcrumbList，丧失富结果（评分星、价格、面包屑）流量红利。⚠️ 最大短板。
2. **全站 canonical 缺失** —— 列表页带 `?category=`/`?district=`/分页等 query 产生大量近似重复页且权重分散。
3. **Open Graph / Twitter Card 全缺** —— 社交/IM 分享无预览，点击率受损。
4. **列表页 metadata 不齐** —— `/courses`、`/institutions`、`/articles` 无独立 title/description；`/search` 应收录垃圾页。
5. **sitemap 不全** —— 缺老师、分类静态页、静态信息页。
6. **内链结构** —— 首页分类用 query 形式 `/courses?category=x`，静态路由 `/courses/category/x` 被冷落。
7. **内容深度不足** —— 详情正文偏短，缺 FAQ、缺长尾词内容。
8. **未提交 GSC/Bing** —— 需在 Search Console 提交 sitemap 并验证所有权。

---

## 二、本轮已完成：技术地基（已上线待 push）

| 改动 | 文件 | 作用 |
|---|---|---|
| Organization JSON-LD + OG/Twitter 默认 + 根 canonical | `src/app/layout.tsx`、`src/components/seo/JsonLd.tsx`（新） | 品牌实体、社交预览、规范首页 |
| 列表页 metadata + canonical 收敛 | `courses/page.tsx`、`institutions/page.tsx`、`articles/page.tsx` | 独立标题/描述，query 页收敛到基础 URL |
| `/search` 加 `noindex` | `search/page.tsx` | 不收录动态搜索结果 |
| sitemap 补全 | `sitemap.ts` | 新增 teachers、分类静态页、about/contact/feedback/recommend/privacy/terms |
| 分类链接改静态 slug | `page.tsx`、`courses/page.tsx` | 首页与列表分类统一指向 `/courses/category/[slug]` |

**验证**：`npx tsc --noEmit` 通过（Teacher 模型确认含 `updatedAt`）。

---

## 三、下一阶段 1：详情页 JSON-LD（高优先，富结果核心）

在对应详情页注入 `<JsonLd data={...} />`，类型建议：

- **课程** `courses/[id]` → `Course` + `CourseInstance`/`Offer`
  ```json
  {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "课程标题",
    "description": "课程介绍",
    "provider": { "@type": "EducationalOrganization", "name": "机构名" },
    "offers": { "@type": "Offer", "price": "1999", "priceCurrency": "CNY",
                "availability": "https://schema.org/InStock", "url": "课程URL" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "120" }
  }
  ```
- **机构** `institutions/[id]` → `LocalBusiness`（或 `EducationalOrganization`）：name / address / telephone / aggregateRating / geo
- **文章** `articles/[id]` → `Article`（或 `BlogPosting`）：headline / image / datePublished / author / publisher
- **老师** `teachers/[id]` → `Person`：name / jobTitle / worksFor / knowsAbout / aggregateRating
- **问答** `questions/[id]` → `QAPage`：mainEntity(Question + acceptedAnswer)
- **全站** → `BreadcrumbList`（详情页面包屑）

> 实施时需读取各详情页字段确认（课程/机构/老师/文章/问答详情页已部分审查）。完成后用 Google Rich Results Test 验证。

---

## 四、下一阶段 2：内容与长尾词（决定流量上限）

1. **详情正文加厚**：课程/机构详情增加「适合人群、课程亮点、师资、环境、退费政策」等多段内容，避免单段描述。
2. **FAQ 模块**：每个详情页加 FAQ（JSON-LD `FAQPage`），覆盖「费用、课时、是否包就业、试听」等高频疑问——直接命中长尾搜索。
3. **区域长尾落地页**：如「厦门思明区英语培训」「厦门湖里区少儿编程」，可用分类+区域组合生成静态/半静态页，承接本地精准流量。
4. **教育资讯持续产出**：政策解读、考试日历、选课攻略（已搭 articles 渠道），保持更新频率。
5. **标题/描述模板优化**：列表页与详情页 title 含「厦门 + 品类 + 区域」，提升相关性与点击率。

---

## 五、下一阶段 3：外链与权威（信任信号）

1. **本地目录/黄页**：提交到厦门本地生活站、工商目录，获取权威外链。
2. **口碑平台**：大众点评/知乎/小红书等发布机构评测内容并回链。
3. **友链**：与互补非竞争本地站互换友链。
4. **品牌统一**：各平台 NAP（名称/地址/电话）一致，利于本地 SEO。

---

## 六、下一阶段 4：技术体验与监控

- **Core Web Vitals**：用 SpeedInsights 监控 LCP/CLS/INP；图片统一走 `next/image`、补 `alt`、懒加载。
- **HTTPS / 移动端**：Vercel 已提供 HTTPS；确认移动端渲染无横向溢出。
- **www 规范化**：确认 `xmpx.cn` → `www.xmpx.cn` 301 重定向（Vercel 域名设置），与 sitemap/OG 的 www 一致。
- **结构化数据测试**：Rich Results Test + Schema Markup Validator。
- **抓取监控**：GSC「网址检查」「覆盖率」定期排查 404/软 404。

---

## 七、必须你本机操作（无法在沙箱完成）

1. `git push origin main`（部署本轮 + Analytics 改动）。
2. **Google Search Console**：添加 `www.xmpx.cn`、验证所有权、提交 `https://www.xmpx.cn/sitemap.xml`、申请 sitemap 索引。
3. **Bing Webmaster Tools**：同样提交 sitemap（承接国内必应/微信搜索流量）。
4. **Vercel 域名**：设置 `xmpx.cn` → `www.xmpx.cn` 重定向，强制 www。
5. 吊销临时 GitHub PAT `ghp_NJ5...`。

---

## 执行优先级建议

```
P0（本周）: 详情页 JSON-LD + 本机 push + GSC/Bing 提交 sitemap
P1（2 周）: FAQ 模块 + 区域长尾页 + 内容加厚
P2（持续）: 外链建设 + Core Web Vitals 优化 + 资讯更新
```
