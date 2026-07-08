"use client";

import { useState, useEffect, useCallback } from "react";
import ReviewForm from "./ReviewForm";

interface Review {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewListProps {
  courseId?: string;
  institutionId?: string;
  /** current user id (from server) — to identify own reviews */
  currentUserId?: string;
}

export default function ReviewList({
  courseId,
  institutionId,
  currentUserId,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchReviews = useCallback(async () => {
    const params = new URLSearchParams();
    if (courseId) params.set("courseId", courseId);
    if (institutionId) params.set("institutionId", institutionId);

    try {
      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      // silent fail
    }
    setLoading(false);
  }, [courseId, institutionId, refreshKey]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Stats
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  // Find current user's existing review
  const myReview = reviews.find((r) => r.user.id === currentUserId) || null;

  return (
    <div>
      {/* Rating summary */}
      <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b">
        <div className="text-center sm:text-left">
          <div className="text-4xl font-bold text-gray-900">{avgRating}</div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={parseFloat(avgRating) >= s ? "text-yellow-400" : "text-gray-300"}>★</span>
            ))}
          </div>
          <div className="text-sm text-gray-400 mt-1">{reviews.length} 条评价</div>
        </div>

        {/* Rating distribution */}
        <div className="flex-1 space-y-1">
          {ratingDist.map((d) => (
            <div key={d.star} className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 w-8">{d.star}星</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="text-gray-400 w-8 text-right">{d.count}</span>
            </div>
          ))}
        </div>

        {/* Write review button */}
        <div className="flex items-center">
          {!myReview && (
            <ReviewForm
              courseId={courseId}
              institutionId={institutionId}
              onSubmitted={handleRefresh}
            />
          )}
        </div>
      </div>

      {/* My review (if exists) */}
      {myReview && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-700">我的评价</span>
              <span className="text-yellow-400 text-sm">
                {"★".repeat(myReview.rating)}{"☆".repeat(5 - myReview.rating)}
              </span>
            </div>
            <ReviewForm
              courseId={courseId}
              institutionId={institutionId}
              existingReview={myReview}
              onSubmitted={handleRefresh}
            />
          </div>
          {myReview.content && (
            <p className="text-gray-700 text-sm">{myReview.content}</p>
          )}
          <div className="text-xs text-gray-400 mt-1">
            {new Date(myReview.createdAt).toLocaleDateString("zh-CN")}
          </div>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">💬</div>
          <p>暂无评价，快来抢沙发吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  {review.user?.name?.slice(0, 1) || "匿"}
                </div>
                <span className="text-sm font-medium">
                  {review.user?.name || "匿名用户"}
                </span>
                {review.user.id === currentUserId && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">我</span>
                )}
                <span className="text-yellow-400 text-sm">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </span>
              </div>
              {review.content && (
                <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {new Date(review.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
