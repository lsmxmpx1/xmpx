import { useId } from "react";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/constants";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon" | "text";
  theme?: "light" | "dark";
  className?: string;
}

const SIZE_MAP = {
  sm: { icon: 40, main: "text-sm", sub: "text-xs", gap: "gap-2" },
  md: { icon: 48, main: "text-lg", sub: "text-base", gap: "gap-2.5" },
  lg: { icon: 60, main: "text-2xl", sub: "text-lg", gap: "gap-3" },
};

// xmpx X 网络节点图标：紫色渐变圆角方块 + 交叉节点徽章
function LogoMark({ size = 72, theme = "light" }: { size?: number; theme?: "light" | "dark" }) {
  const uid = useId();
  const gradId = `xmpxBdg-${uid}`;
  const isDark = theme === "dark";
  const stopA = isDark ? "#A78BFA" : "#7C3AED";
  const stopB = isDark ? "#C084FC" : "#A855F7";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={stopA} />
          <stop offset="1" stopColor={stopB} />
        </linearGradient>
      </defs>
      {/* 圆角方块底色 */}
      <rect x="0" y="0" width="120" height="120" rx="28" fill={`url(#${gradId})`} />
      {/* X 交叉主笔画 */}
      <path d="M34 34 L86 86" stroke="white" strokeWidth="14" strokeLinecap="round" />
      <path d="M86 34 L34 86" stroke="white" strokeWidth="14" strokeLinecap="round" />
      {/* 四端节点 */}
      <circle cx="34" cy="34" r="6" fill="white" />
      <circle cx="86" cy="34" r="6" fill="white" />
      <circle cx="34" cy="86" r="6" fill="white" />
      <circle cx="86" cy="86" r="6" fill="white" />
      {/* 中心连接点（橙色点缀） */}
      <circle cx="60" cy="60" r="10" fill="#F97316" />
    </svg>
  );
}

export default function Logo({
  size = "md",
  variant = "full",
  theme = "light",
  className = "",
}: LogoProps) {
  const s = SIZE_MAP[size];
  const mainColor = theme === "dark" ? "text-white" : "text-gray-900";
  const subColor = "text-orange-600";

  if (variant === "icon") {
    return <LogoMark size={s.icon} theme={theme} />;
  }

  if (variant === "text") {
    return (
      <span className={`font-bold leading-tight ${mainColor} ${s.main} ${className}`}>
        {SITE_DOMAIN}
      </span>
    );
  }

  return (
    <Link href="/" className={`flex items-center ${s.gap} shrink-0 ${className}`}>
      <LogoMark size={s.icon} theme={theme} />
      <div className="leading-tight">
        <div className={`font-bold ${mainColor} ${s.main}`}>{SITE_DOMAIN}</div>
        <div className={`${subColor} ${s.sub}`}>{SITE_NAME}</div>
      </div>
    </Link>
  );
}
