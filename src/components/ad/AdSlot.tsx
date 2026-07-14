import { prisma } from "@/lib/prisma";

export type AdSlotVariant = "banner" | "sidebar" | "card";

/**
 * 根据广告位（position）读取并渲染处于启用状态、且在投放时间范围内的广告。
 * 无匹配广告时返回 null（不占用布局空间）。
 * 用法：<AdSlot position="HOME_TOP" variant="banner" className="container-main" />
 */
export default async function AdSlot({
  position,
  variant = "banner",
  className = "",
  title,
}: {
  position: string | string[];
  variant?: AdSlotVariant;
  className?: string;
  title?: string;
}) {
  const now = new Date();
  const positions = Array.isArray(position) ? position : [position];

  const ads = await prisma.advertisement.findMany({
    where: {
      position: { in: positions },
      active: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: variant === "sidebar" ? 4 : 3,
  });

  if (ads.length === 0) return null;

  // 统计曝光量
  await prisma.advertisement.updateMany({
    where: { id: { in: ads.map((a) => a.id) } },
    data: { views: { increment: 1 } },
  });

  return (
    <div className={className}>
      {title && <h3 className="mb-3 text-sm font-medium text-gray-500">{title}</h3>}
      <div
        className={
          variant === "sidebar"
            ? "space-y-3"
            : variant === "card"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
        }
      >
        {ads.map((ad) => (
          <AdItem key={ad.id} ad={ad} />
        ))}
      </div>
    </div>
  );
}

function AdItem({ ad }: { ad: { id: string; title: string; image: string | null; link: string | null } }) {
  const media = ad.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ad.image} alt={ad.title} className="h-36 w-full object-cover" />
  ) : (
    <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4 text-center text-lg font-semibold text-white">
      {ad.title}
    </div>
  );

  const node = (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
      {media}
      <span className="absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">广告</span>
    </div>
  );

  return ad.link ? (
    <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block">
      {node}
    </a>
  ) : (
    <div>{node}</div>
  );
}
