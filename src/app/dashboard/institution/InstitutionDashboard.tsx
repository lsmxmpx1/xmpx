"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import InstitutionForm from "./InstitutionForm";
import CourseManager from "./CourseManager";
import ContactManager from "./ContactManager";
import AdBuyPanel from "./AdBuyPanel";

interface InstitutionData {
  id: string;
  name: string;
  district: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  website: string | null;
  logo: string | null;
  cover: string | null;
  images: string | null;
  status: string;
  rating: number;
  reviewCount: number;
  courseCount: number;
  createdAt: string;
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentName: string;
}

interface InstitutionDashboardProps {
  institution: InstitutionData;
  categories: CategoryData[];
  contactsCount: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "审核中", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "已通过", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "已拒绝", color: "bg-red-100 text-red-700" },
};

type Tab = "overview" | "courses" | "contacts" | "ad" | "settings";

export default function InstitutionDashboard({
  institution,
  categories,
  contactsCount,
}: InstitutionDashboardProps) {
  const [tab, setTab] = useState<Tab>("overview");

  const isApproved = institution.status === "APPROVED";
  const statusInfo = STATUS_MAP[institution.status] || { label: institution.status, color: "bg-gray-100 text-gray-600" };

  const tabs: { key: Tab; label: string; icon: string; badge?: number; highlight?: boolean }[] = [
    { key: "overview", label: "概览", icon: "📊" },
    { key: "courses", label: "课程管理", icon: "📚", badge: institution.courseCount },
    { key: "contacts", label: "咨询线索", icon: "💬", badge: contactsCount },
    { key: "ad", label: "推广中心", icon: "🚀", highlight: true },
    { key: "settings", label: "机构设置", icon: "⚙️" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回用户中心
        </Link>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-purple-600 shrink-0 overflow-hidden relative">
            {institution.logo ? (
              <Image src={institution.logo} alt={institution.name} fill className="rounded-2xl object-cover" sizes="56px" />
            ) : (
              institution.name.slice(0, 2)
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{institution.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span>{institution.district}</span>
              <span>·</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              {!isApproved && (
                <span className="text-xs text-gray-400">（审核通过后可发布课程）</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-purple-600 text-white"
                : t.highlight
                  ? "text-amber-600 hover:bg-amber-50"
                  : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : "bg-gray-100"}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold text-purple-600">{institution.courseCount}</div>
              <div className="text-sm text-gray-500 mt-1">课程数量</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold text-yellow-500">{institution.rating.toFixed(1)}</div>
              <div className="text-sm text-gray-500 mt-1">综合评分</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold text-green-500">{institution.reviewCount}</div>
              <div className="text-sm text-gray-500 mt-1">用户评价</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold text-blue-500">{contactsCount}</div>
              <div className="text-sm text-gray-500 mt-1">咨询线索</div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">机构信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-16 shrink-0">名称：</span>
                <span className="text-gray-800">{institution.name}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-16 shrink-0">区域：</span>
                <span className="text-gray-800">{institution.district}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-16 shrink-0">地址：</span>
                <span className="text-gray-800">{institution.address || "未设置"}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-16 shrink-0">电话：</span>
                <span className="text-gray-800">{institution.phone || "未设置"}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-16 shrink-0">网站：</span>
                <span className="text-gray-800">
                  {institution.website ? (
                    <a href={institution.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                      {institution.website}
                    </a>
                  ) : "未设置"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-16 shrink-0">入驻时间：</span>
                <span className="text-gray-800">
                  {new Date(institution.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
            </div>
            {institution.description && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-gray-400 text-sm">机构简介：</span>
                <p className="text-gray-700 text-sm mt-1 leading-relaxed">{institution.description}</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setTab("settings")}
                className="text-sm text-purple-600 hover:underline"
              >
                编辑机构信息 →
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setTab("courses")}
              className="bg-white rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-shadow group"
            >
              <div className="text-2xl mb-2">📚</div>
              <div className="font-semibold text-gray-800 group-hover:text-purple-600">管理课程</div>
              <div className="text-sm text-gray-400 mt-1">
                {isApproved ? "发布、编辑、下架课程" : "审核通过后可发布课程"}
              </div>
            </button>
            <button
              onClick={() => setTab("contacts")}
              className="bg-white rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-shadow group"
            >
              <div className="text-2xl mb-2">💬</div>
              <div className="font-semibold text-gray-800 group-hover:text-purple-600">查看咨询</div>
              <div className="text-sm text-gray-400 mt-1">
                {contactsCount > 0 ? `${contactsCount} 条新咨询等待查看` : "暂无咨询记录"}
              </div>
            </button>
            <button
              onClick={() => setTab("ad")}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-shadow group border border-amber-100"
            >
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-semibold text-gray-800 group-hover:text-amber-600">推广中心</div>
              <div className="text-sm text-gray-400 mt-1">购买广告位，提升曝光度</div>
            </button>
            <button
              onClick={() => setTab("settings")}
              className="bg-white rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-shadow group"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <div className="font-semibold text-gray-800 group-hover:text-purple-600">机构设置</div>
              <div className="text-sm text-gray-400 mt-1">修改机构基本信息</div>
            </button>
          </div>
        </div>
      )}

      {tab === "courses" && (
        <CourseManager
          categories={categories}
          institutionId={institution.id}
          canPublish={isApproved}
        />
      )}

      {tab === "contacts" && <ContactManager />}

      {tab === "ad" && <AdBuyPanel />}

      {tab === "settings" && (
        <InstitutionForm mode="edit" initialData={institution} />
      )}
    </div>
  );
}
