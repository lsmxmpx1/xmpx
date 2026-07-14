import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { verifyCode } from "./sms-store";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 生产/托管环境信任实际请求的 host（适配 CDN、反向代理及本地验证，避免 UntrustedHost 导致 500）
  trustHost: true,
  providers: [
    // 短信验证码登录（自动注册）
    CredentialsProvider({
      id: "phonecode",
      name: "短信验证码",
      credentials: {
        phone: { label: "手机号", type: "text" },
        code: { label: "验证码", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { phone, code } = credentials;
        const phoneStr = phone as string;
        const codeStr = code as string;

        if (!phoneStr || !codeStr) return null;

        // 校验短信验证码
        const result = verifyCode(phoneStr, codeStr);
        if (!result.success) return null;

        // 查找已有用户
        let user = await prisma.user.findUnique({
          where: { phone: phoneStr },
        });

        // 不存在则自动注册
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone: phoneStr,
              name: `用户${phoneStr.slice(-4)}`,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          image: user.image,
          role: user.role,
        };
      },
    }),

    // 邮箱/手机号 + 密码登录
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        phone: { label: "手机号", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const { email, phone, password } = credentials;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              email ? { email: email as string } : {},
              phone ? { phone: phone as string } : {},
            ].filter((c) => Object.keys(c).length > 0),
          },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password as string, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // 允许所有通过 credentials 登录的用户
      // 微信 OAuth 通过 wechat-callback API 单独处理
      if (user) return true;
      return false;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id || "";
        token.role = (user.role as string) || "USER";
        token.phone = user.phone || null;
      }
      // 支持客户端更新 session（如绑定手机号后）
      if (trigger === "update" && session) {
        token.phone = session.phone ?? token.phone;
        token.role = session.role ?? token.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = (token.phone as string | null) || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
});
