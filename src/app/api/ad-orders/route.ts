import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { ownedInstitution: true },
    });

    if (!user?.ownedInstitution) {
      return NextResponse.json({ error: "您还没有机构" }, { status: 403 });
    }

    const orders = await prisma.adOrder.findMany({
      where: { institutionId: user.ownedInstitution.id },
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true, level: true, duration: true } } },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { ownedInstitution: { include: { adOrders: { where: { status: "ACTIVE" }, take: 1 } } } },
    });

    if (!user?.ownedInstitution) {
      return NextResponse.json({ error: "您还没有机构，请先入驻" }, { status: 403 });
    }

    const { planId } = await req.json();
    if (!planId) {
      return NextResponse.json({ error: "请选择推广套餐" }, { status: 400 });
    }

    const plan = await prisma.adPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "推广套餐不存在或已下架" }, { status: 404 });
    }

    const institution = user.ownedInstitution;

    // Check if already has active order
    const activeOrder = await prisma.adOrder.findFirst({
      where: { institutionId: institution.id, status: "ACTIVE" },
    });
    if (activeOrder) {
      return NextResponse.json({
        error: "您已有进行中的推广订单，请等待到期后再购买新套餐",
        activeOrderId: activeOrder.id,
      }, { status: 400 });
    }

    const order = await prisma.adOrder.create({
      data: {
        institutionId: institution.id,
        planId: plan.id,
        amount: plan.price,
        status: "PENDING",
      },
      include: { plan: { select: { name: true, level: true, price: true, duration: true } } },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
