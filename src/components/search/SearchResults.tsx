"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type CourseItem = {
  id: string;
  title: string;
  price: string | null;
  institution?: { name: string } | null;
  category?: { name: string } | null;
};

type InstitutionItem = {
  id: string;
  name: string;
  district?: string | null;
  rating: number;
  courseCount: number;
};

type TeacherItem = {
  id: string;
  name: string;
  title?: string | null;
  avatar?: string | null;
  expertise?: string | null;
  district?: string | null;
  currentInstitution?: { name: string } | null;
};

type ArticleItem = {
  id: string;
  title: string;
  cover: string | null;
  category: string | null;
  summary: string | null;
  publishedAt?: string | Date | null;
};

type TabKey = "all" | "course" | "institution" | "teacher" | "article";

export default function SearchResults({
  courses,
  institutions,
  teachers,
  articles,
}: {
  courses: CourseItem[];
  institutions: InstitutionItem[];
  teachers: TeacherItem[];
  articles: ArticleItem[];
}) {
  const [tab, setTab] = useState<TabKey>("all");

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "全部", count: courses.length + institutions.length + teachers.length + articles.length },
    { key: "course", label: "课程", count: courses.length },
    { key: "institution", label: "机构", count: institutions.length },
    { key: "teacher", label: "老师", count: teachers.length },
    { key: "article", label: "资讯", count: articles.length },
  ];

  const show = (key: TabKey) => tab === "all" || tab === key;

  return (
    <div>
      {/* Tab 切换 */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-8">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
            <span className="ml-1 text-xs text-gray-400">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="space-y-10">
        {/* Courses */}
        {show("course") && (
          <section>
            <h2 className="text-xl font-bold mb-4">
              相关课程
              <span className="text-gray-400 text-base ml-2">({courses.length})</span>
            </h2>
            {courses.length === 0 ? (
              <p className="text-gray-400">未找到相关课程</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {courses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`} className="card group">
                    <div className="h-36 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-3xl">📖</div>
                    <div className="p-4">
                      <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{course.category?.name}</span>
                      <h3 className="font-semibold mt-2 text-sm group-hover:text-primary-600 line-clamp-2">{course.title}</h3>
                      <div className="text-xs text-gray-400 mt-1">{course.institution?.name}</div>
                      <div className="text-lg font-bold text-accent-600 mt-2">{formatPrice(course.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Institutions */}
        {show("institution") && (
          <section>
            <h2 className="text-xl font-bold mb-4">
              相关机构
              <span className="text-gray-400 text-base ml-2">({institutions.length})</span>
            </h2>
            {institutions.length === 0 ? (
              <p className="text-gray-400">未找到相关机构</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {institutions.map((inst) => (
                  <Link key={inst.id} href={`/institutions/${inst.id}`} className="card p-5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-xl font-bold text-primary-600 shrink-0">{inst.name.slice(0, 2)}</div>
                      <div className="min-w-0">
                        <h3 className="font-bold group-hover:text-primary-600 truncate">{inst.name}</h3>
                        <div className="text-sm text-gray-400">{inst.district}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="text-orange-400">★</span> {inst.rating.toFixed(1)}
                          <span>{inst.courseCount} 课程</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Teachers */}
        {show("teacher") && (
          <section>
            <h2 className="text-xl font-bold mb-4">
              相关老师
              <span className="text-gray-400 text-base ml-2">({teachers.length})</span>
            </h2>
            {teachers.length === 0 ? (
              <p className="text-gray-400">未找到相关老师</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {teachers.map((t) => (
                  <Link key={t.id} href={`/teachers/${t.id}`} className="card p-5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-xl font-bold text-primary-600 shrink-0 overflow-hidden">
                        {t.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          t.name.slice(0, 1)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold group-hover:text-primary-600 truncate">{t.name}</h3>
                        <div className="text-sm text-gray-400 truncate">{t.title}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {t.currentInstitution?.name || t.district || "独立老师"}
                        </div>
                      </div>
                    </div>
                    {t.expertise && (
                      <div className="text-xs text-gray-500 mt-3 line-clamp-2">擅长：{t.expertise}</div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Articles (培训资讯) */}
        {show("article") && (
          <section>
            <h2 className="text-xl font-bold mb-4">
              相关资讯
              <span className="text-gray-400 text-base ml-2">({articles.length})</span>
            </h2>
            {articles.length === 0 ? (
              <p className="text-gray-400">未找到相关资讯</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {articles.map((article) => (
                  <Link key={article.id} href={`/articles/${article.id}`} className="card group overflow-hidden">
                    {article.cover ? (
                      <div className="h-36 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={article.cover}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-36 bg-gradient-to-br from-accent-50 to-accent-100 flex items-center justify-center text-3xl">📰</div>
                    )}
                    <div className="p-4">
                      {article.category && (
                        <span className="text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-full">{article.category}</span>
                      )}
                      <h3 className="font-semibold mt-2 text-sm group-hover:text-primary-600 line-clamp-2">{article.title}</h3>
                      {article.summary && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{article.summary}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
