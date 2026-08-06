import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import Logo from "@/components/Logo";

const FOOTER_LINKS = {
  "热门分类": [
    { label: "中小学辅导", href: "/courses/category/k12" },
    { label: "艺术兴趣培训", href: "/courses/category/art" },
    { label: "英语培训", href: "/courses/category/language" },
    { label: "职业技能培训", href: "/courses/category/vocational" },
    { label: "考证培训", href: "/courses/category/certification" },
  ],
  "关于我们": [
    { label: "机构入驻", href: "/dashboard/institution" },
    { label: "找课程", href: "/courses" },
    { label: "找机构", href: "/institutions" },
    { label: "培训资讯", href: "/articles" },
  ],
  "帮助中心": [
    { label: "搜索课程", href: "/search" },
    { label: "网站留言板", href: "/feedback" },
    { label: "注册账号", href: "/auth/register" },
    { label: "登录", href: "/auth/login" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="container-main py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo theme="dark" className="mb-4" />
            <p className="text-sm text-gray-400 mb-4">
              厦门本地教育培训一站式信息平台。找培训班、选机构、查课程，我们帮你。
            </p>
            <p className="text-xs text-gray-500">
              © 2026 {SITE_NAME} All Rights Reserved
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-medium mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
          <p>
            免责声明：本站仅为信息展示平台，请用户自行核实机构资质。如发现违规内容请及时在
            <Link href="/feedback" className="text-gray-400 hover:text-white underline mx-1">
              网站留言板
            </Link>
            联系我们做下架处理。
          </p>
        </div>
      </div>
    </footer>
  );
}
