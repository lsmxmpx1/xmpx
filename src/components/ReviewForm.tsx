"use client";

import { useState } from "react";

interface ReviewFormProps {
  courseId?: string;
  institutionId?: string;
  /** Existing review (if user already reviewed) for edit mode */
  existingReview?: {
    id: string;
    rating: number;
    content: string | null;
  } | null;
  onSubmitted?: () => void;
}

export default function ReviewForm({
  courseId,
  institutionId,
  existingReview,
  onSubmitted,
}: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState(existingReview?.content || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isEditMode = !!existingReview;

  function resetForm() {
    setRating(existingReview?.rating || 0);
    setContent(existingReview?.content || "");
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (rating < 1 || rating > 5) {
      setError("请选择评分（1-5星）");
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode
        ? `/api/reviews/${existingReview!.id}`
        : "/api/reviews";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          content,
          courseId: courseId || undefined,
          institutionId: institutionId || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          onSubmitted?.();
        }, 1500);
      } else {
        setError(data.error || "提交失败");
      }
    } catch {
      setError("网络错误，请稍后再试");
    }

    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          isEditMode
            ? "text-sm text-blue-600 hover:underline"
            : "btn-secondary"
        }
      >
        {isEditMode ? "编辑评价" : "✍️ 写评价"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          onClick={() => { setOpen(false); resetForm(); }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold mb-2">
                  {isEditMode ? "评价已更新！" : "评价成功！"}
                </h3>
                <p className="text-gray-500 text-sm">感谢您的反馈</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-1">
                  {isEditMode ? "编辑评价" : "写评价"}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  分享您的真实体验，帮助其他学员做出选择
                </p>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Star rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      评分 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="text-3xl transition-transform hover:scale-110"
                        >
                          <span className={
                            (hoverRating || rating) >= star
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }>
                            ★
                          </span>
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-sm text-gray-500 self-center">
                          {["", "很差", "较差", "还行", "不错", "很好"][rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      评价内容 <span className="text-gray-400">（选填）</span>
                    </label>
                    <textarea
                      placeholder="说说您的上课体验、教学质量、服务态度等..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="input-field"
                      rows={4}
                      maxLength={500}
                    />
                    <div className="text-right text-xs text-gray-400 mt-1">
                      {content.length}/500
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setOpen(false); resetForm(); }}
                      className="btn-secondary flex-1"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={loading || rating === 0}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "提交中..." : isEditMode ? "更新" : "发布"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
