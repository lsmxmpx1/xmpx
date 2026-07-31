import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// 文章浏览量 +1（无需登录，客户端挂载时调用）
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await prisma.article
    .update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    })
    .catch(() => {});
  revalidatePath("/articles");
  return NextResponse.json({ ok: true });
}
