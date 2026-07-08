"use client";

import { useState, useEffect } from "react";

interface Contact {
  id: string;
  name: string | null;
  phone: string;
  message: string | null;
  courseId: string | null;
  createdAt: string;
  course: { title: string } | null;
}

export default function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "course" | "institution">("all");

  async function loadContacts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `加载失败 (${res.status})`);
      }
    } catch {
      setError("网络错误，请稍后再试");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadContacts();
  }, []);

  const filtered = contacts.filter((c) => {
    if (filter === "course") return c.courseId;
    if (filter === "institution") return !c.courseId;
    return true;
  });

  // Group by date
  const grouped: Record<string, Contact[]> = {};
  filtered.forEach((c) => {
    const date = new Date(c.createdAt).toLocaleDateString("zh-CN");
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(c);
  });

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">咨询线索</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {contacts.length} 条咨询记录
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "全部" },
            { key: "course", label: "课程咨询" },
            { key: "institution", label: "机构咨询" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-purple-600 text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="font-medium">{error}</p>
          <button onClick={loadContacts} className="mt-3 text-sm text-red-600 hover:underline">
            重新加载
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400">暂无咨询记录</p>
          <p className="text-sm text-gray-400 mt-2">当用户对您的课程或机构提交咨询时，记录会显示在这里</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <div className="text-sm text-gray-400 font-medium mb-3 sticky top-0 bg-gray-50 py-1 z-10">
                {date}
                <span className="ml-2 text-gray-300">({grouped[date].length})</span>
              </div>
              <div className="space-y-3">
                {grouped[date].map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-purple-600 shrink-0">
                        {contact.name?.slice(0, 1) || "匿"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-800">{contact.name || "匿名用户"}</span>
                          <span className="text-sm text-gray-500">📞 {contact.phone}</span>
                          {contact.course && (
                            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                              课程：{contact.course.title}
                            </span>
                          )}
                          {!contact.course && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              机构咨询
                            </span>
                          )}
                        </div>
                        {contact.message && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">
                            {contact.message}
                          </p>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(contact.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-sm text-purple-600 hover:underline shrink-0"
                      >
                        联系
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
