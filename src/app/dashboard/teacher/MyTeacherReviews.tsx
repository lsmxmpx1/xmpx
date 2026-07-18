"use client";

interface Review {
  id: string;
  rating: number;
  content: string | null;
  status: string;
  isPublic: boolean;
  adminReply: string | null;
  createdAt: string;
  userName: string;
  userImage: string | null;
}

export default function MyTeacherReviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-400">暂无学员评价</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="border-b pb-4 last:border-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {r.userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.userImage} alt={r.userName} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                  {r.userName.slice(0, 1)}
                </span>
              )}
              <span className="text-sm font-medium text-gray-700">{r.userName}</span>
              {!r.isPublic && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
                  已被下架
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(r.createdAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
          <div className="text-yellow-400 text-sm mb-1">
            {"★".repeat(r.rating)}
            {"☆".repeat(5 - r.rating)}
          </div>
          {r.content && <p className="text-gray-600 text-sm">{r.content}</p>}
          {r.adminReply && (
            <div className="mt-2 text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-2">
              管理员回复：{r.adminReply}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
