"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile, updateAvatar, changePassword } from "./actions";

type UserData = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  role: string;
  createdAt: string;
};

/** 头像展示组件 */
function AvatarDisplay({ src, name, size = 80 }: { src?: string | null; name?: string | null; size?: number }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  if (src) {
    return (
      <img src={src} alt="头像" className="rounded-full object-cover border-2 border-white shadow" style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold border-2 border-white shadow"
      style={{ width: size, height: size, fontSize: Math.max(size * 0.35, 16) }}>
      {initial}
    </div>
  );
}

/** 把头像图片压到最大边 256px 的 JPEG base64，避免体积过大触发 Server Action 请求体限制 */
function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read error"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode error"));
      img.onload = () => {
        const MAX = 256;
        let { width, height } = img;
        if (width > height && width > MAX) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else if (height > MAX) {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("toBlob failed"));
            const r2 = new FileReader();
            r2.onerror = () => reject(new Error("read2 error"));
            r2.onload = () => resolve(r2.result as string);
            r2.readAsDataURL(blob);
          },
          "image/jpeg",
          0.85
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileForm({ user }: { user: UserData }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // 基本信息表单
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [avatar, setAvatar] = useState(user.image || null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [profilePending, startProfileTransition] = useTransition();
  const [profileDone, setProfileDone] = useState(false);
  const [profileErr, setProfileErr] = useState("");

  // 密码表单
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdPending, startPwdTransition] = useTransition();
  const [pwdDone, setPwdDone] = useState(false);
  const [pwdErr, setPwdErr] = useState("");

  /* ---------- 头像上传（转 base64）---------- */
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 限制大小 2MB，格式 jpg/png/gif/webp
    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      alert("仅支持 JPG / PNG / GIF / WebP 格式");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("图片大小不能超过 2MB");
      return;
    }

    // 压缩后再存为预览（避免原始大图 base64 超出 Server Action 默认 1MB 限制）
    try {
      const dataUrl = await compressAvatar(file);
      setAvatarPreview(dataUrl);
    } catch {
      alert("图片处理失败，请换一张试试");
    }
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr("");
    setProfileDone(false);

    startProfileTransition(async () => {
      // 如果有新头像先保存
      let finalAvatar = avatar;
      if (avatarPreview) {
        const res = await updateAvatar(avatarPreview);
        if (res.error) { setProfileErr("头像保存失败: " + res.error); return; }
        finalAvatar = avatarPreview;
        setAvatar(avatarPreview);
        setAvatarPreview(null);
      }

      const fd = new FormData();
      fd.set("name", name);
      fd.set("email", email);
      fd.set("phone", phone);

      const res = await updateProfile(fd);
      if (res.error) { setProfileErr(res.error); return; }
      setProfileDone(true);
      router.refresh();
      setTimeout(() => setProfileDone(false), 3000);
    });
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdErr("");
    setPwdDone(false);

    startPwdTransition(async () => {
      const fd = new FormData();
      fd.set("oldPassword", oldPwd);
      fd.set("newPassword", newPwd);
      fd.set("confirmPassword", confirmPwd);

      const res = await changePassword(fd);
      if (res.error) { setPwdErr(res.error); return; }
      setPwdDone(true);
      setOldPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => setPwdDone(false), 3000);
    });
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* 面包屑 */}
      <div className="mb-6 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-blue-600">用户中心</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-medium">个人设置</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">个人设置</h1>

      {/* ===== 基本信息 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">基本信息</h2>

        {/* 头像区域 */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
          <AvatarDisplay src={avatarPreview || avatar} name={name} />
          <div>
            <p className="text-sm text-gray-600 mb-2">头像</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100"
              >
                上传头像
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => { setAvatarPreview(null); }}
                  className="px-4 py-1.5 text-gray-500 text-sm rounded-lg hover:bg-gray-100"
                >
                  取消
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG/GIF/WebP，最大 2MB</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">昵称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="你的昵称"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">手机号</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="用于登录和通知"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">邮箱</label>
            <div className="flex items-center gap-3">
              <input
                value={email}
                readOnly
                type="email"
                className="w-full sm:max-w-md border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500 focus:outline-none"
                placeholder="your@email.com"
              />
              <Link
                href="/dashboard/security"
                className="text-sm text-primary-600 hover:underline whitespace-nowrap shrink-0"
              >
                更换邮箱
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-1">更换邮箱需验证，请前往「账号安全」</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={profilePending}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {profilePending ? "保存中…" : "保存修改"}
            </button>
            {profileDone && <span className="text-green-600 text-sm">✓ 已保存</span>}
          </div>
          {profileErr && <p className="text-red-600 text-sm">{profileErr}</p>}
        </form>
      </div>

      {/* ===== 修改密码 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">修改密码</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-gray-600 mb-1">当前密码</label>
            <input
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              type="password"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">新密码</label>
            <input
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              type="password"
              required minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="至少 6 位"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">确认新密码</label>
            <input
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              type="password"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="再次输入新密码"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={pwdPending}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {pwdPending ? "修改中…" : "修改密码"}
            </button>
            {pwdDone && <span className="text-green-600 text-sm">✓ 密码已更新</span>}
          </div>
          {pwdErr && <p className="text-red-600 text-sm">{pwdErr}</p>}
        </form>
      </div>

      {/* 账号信息（只读） */}
      <div className="mt-6 text-xs text-gray-400 space-y-1">
        <p>角色：{user.role === "ADMIN" ? "管理员" : "普通用户"}</p>
        <p>注册时间：{new Date(user.createdAt).toLocaleDateString("zh-CN")}</p>
      </div>
    </div>
  );
}
