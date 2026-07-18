"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DISTRICTS } from "@/lib/utils";
import { upsertTeacher } from "./actions";

interface InstitutionOption {
  id: string;
  name: string;
}

interface TeacherData {
  name: string;
  title: string | null;
  bio: string | null;
  expertise: string | null;
  avatar: string | null;
  district: string | null;
  currentInstitutionId: string | null;
}

// 前端压缩头像到最大边 256px 的 JPEG，避免超 Server Action 请求体限制
async function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 256;
        let { width, height } = img;
        if (width > height && width > max) {
          height = Math.round((height * max) / width);
          width = max;
        } else if (height > max) {
          width = Math.round((width * max) / height);
          height = max;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("无法处理图片"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

export default function TeacherProfileForm({
  mode,
  institutions,
  teacher,
}: {
  mode: "create" | "edit";
  institutions: InstitutionOption[];
  teacher?: TeacherData;
}) {
  const { update } = useSession();
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(teacher?.avatar || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      alert("仅支持 JPG / PNG / GIF / WebP 格式");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }
    try {
      const compressed = await compressAvatar(file);
      setAvatar(compressed);
    } catch {
      alert("图片处理失败，请换一张");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    if (avatar) fd.set("avatar", avatar);
    else fd.delete("avatar");

    const res = await upsertTeacher(fd);
    setSubmitting(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    // 同步 session：激活老师视图 + 更新 roles
    try {
      await update({ activeRole: "TEACHER", roles: res.roles } as never);
    } catch {
      /* ignore */
    }

    setDone(true);
    router.refresh();
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {done && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
          {mode === "create" ? "档案创建成功！已开通老师身份" : "已保存"}
        </div>
      )}

      {/* 头像 */}
      <div className="flex items-center gap-4">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="头像" className="w-20 h-20 rounded-full object-cover border" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            无头像
          </div>
        )}
        <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          上传头像
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            defaultValue={teacher?.name || ""}
            maxLength={20}
            placeholder="真实姓名或艺名"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">头衔</label>
          <input
            name="title"
            defaultValue={teacher?.title || ""}
            maxLength={30}
            placeholder="如：资深雅思讲师 / 高中数学名师"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">所在区域</label>
          <select
            name="district"
            defaultValue={teacher?.district || ""}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">不限 / 未选择</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">当前所属机构</label>
          <select
            name="currentInstitutionId"
            defaultValue={teacher?.currentInstitutionId || ""}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">自由职业 / 暂不关联</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">擅长课程 / 科目</label>
        <input
          name="expertise"
          defaultValue={teacher?.expertise || ""}
          maxLength={100}
          placeholder="用逗号分隔，如：雅思,托福,考研英语"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        <p className="text-xs text-gray-400 mt-1">多个用中/英文逗号分隔，将以标签形式展示</p>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">个人简介</label>
        <textarea
          name="bio"
          rows={5}
          defaultValue={teacher?.bio || ""}
          maxLength={1000}
          placeholder="介绍你的教学经验、教学风格、代表成果等"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary px-8 disabled:opacity-50"
      >
        {submitting ? "保存中…" : mode === "create" ? "创建档案并开通老师身份" : "保存修改"}
      </button>
    </form>
  );
}
