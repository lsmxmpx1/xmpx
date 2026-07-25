"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CourseForm from "./CourseForm";

interface Course {
  id: string;
  title: string;
  price: string | null;
  originalPrice: string | null;
  description: string | null;
  tags: string | null;
  cover: string | null;
  categoryId: string;
  status: string;
  createdAt: string;
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentName: string;
}

interface CourseManagerProps {
  categories: Category[];
  institutionId: string;
  canPublish: boolean;
}

export default function CourseManager({ categories, institutionId, canPublish }: CourseManagerProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editCourse, setEditCourse] = useState<Course | null>(null);

  async function loadCourses() {
    setLoading(true);
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCourses();
  }, []);

  function handleEdit(course: Course) {
    setEditCourse(course);
    setView("edit");
  }

  function handleBack() {
    setView("list");
    setEditCourse(null);
    loadCourses();
    router.refresh();
  }

  if (view === "create") {
    return (
      <div>
        <button onClick={handleBack} className="text-sm text-gray-500 hover:text-purple-600 mb-4">
          ← 返回课程列表
        </button>
        {!canPublish ? (
          <div className="bg-yellow-50 text-yellow-700 rounded-lg p-4 text-sm">
            ⚠️ 机构审核通过后才能发布课程，请耐心等待审核。
          </div>
        ) : (
          <CourseForm mode="create" categories={categories} institutionId={institutionId} onSuccess={handleBack} />
        )}
      </div>
    );
  }

  if (view === "edit" && editCourse) {
    return (
      <div>
        <button onClick={handleBack} className="text-sm text-gray-500 hover:text-purple-600 mb-4">
          ← 返回课程列表
        </button>
        <CourseForm mode="edit" initialData={editCourse} categories={categories} institutionId={institutionId} onSuccess={handleBack} />
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">课程管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {courses.length} 门课程
            {!canPublish && "（审核通过后可发布新课程）"}
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          disabled={!canPublish}
          className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + 发布课程
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-gray-400 mb-4">还没有发布课程</p>
          {canPublish && (
            <button onClick={() => setView("create")} className="btn-primary">
              发布第一门课程
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-purple-50 flex items-center justify-center">
                {course.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.cover} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">📖</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 truncate">{course.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${course.status === "ACTIVE" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {course.status === "ACTIVE" ? "上架中" : "已下架"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                  <span>{course.category?.name}</span>
                  <span>·</span>
                  <span>{course.price ? `¥${course.price}` : "价格面议"}</span>
                  {course.tags && (
                    <>
                      <span>·</span>
                      <span>{course.tags}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleEdit(course)}
                className="text-sm text-purple-600 hover:underline shrink-0"
              >
                编辑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
