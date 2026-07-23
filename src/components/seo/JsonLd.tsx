// 通用 JSON-LD 结构化数据注入组件。
// 用法：<JsonLd data={{ "@type": "Organization", ... }} />
// Next.js 会在 <body> 内渲染 <script type="application/ld+json">。
export default function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify 输出已转义，避免 </script> 注入；对象本身来自可信服务端数据
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
