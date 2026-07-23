import JsonLd from "./JsonLd";
import type { FaqItem } from "@/lib/faq";

/**
 * 通用 FAQ 区块：同时渲染可见 FAQ 与 FAQPage 结构化数据，
 * 命中「费用/试听/包就业/地址」等长尾搜索并争取富结果展示。
 */
export default function Faq({ items }: { items: FaqItem[] }) {
  if (!items || items.length === 0) return null;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };

  return (
    <>
      <JsonLd data={faqLd} />
      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 mt-8">
        <h2 className="text-xl font-bold mb-6">常见问题</h2>
        <div className="space-y-4">
          {items.map((it, i) => (
            <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <h3 className="font-semibold text-gray-900 mb-2">Q：{it.question}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">A：{it.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
