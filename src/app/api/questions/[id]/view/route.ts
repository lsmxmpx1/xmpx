import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// 浏览量 +1（无需登录，客户端挂载时调用）
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await prisma.question
    .update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    })
    .catch(() => {});
  // 使问答列表（含浏览量）的 Router Cache 失效，返回列表即显示最新
  revalidatePath("/questions");
  return NextResponse.json({ ok: true });
}
