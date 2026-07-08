import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Confirm payment (simulated)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: "您没有机构" }, { status: 403 });
    }

    const order = await prisma.adOrder.findUnique({
      where: { id: params.id },
      include: { plan: true },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.institutionId !== user.ownedInstitution.id) {
      return NextResponse.json({ error: "无权操作此订单" }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "订单状态不正确" }, { status: 400 });
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + order.plan.duration * 24 * 60 * 60 * 1000);

    // Update order status
    const updatedOrder = await prisma.adOrder.update({
      where: { id: params.id },
      data: {
        status: "ACTIVE",
        startDate: now,
        endDate,
      },
    });

    // Update institution: featured + adLevel
    await prisma.institution.update({
      where: { id: user.ownedInstitution.id },
      data: {
        featured: true,
        adLevel: order.plan.level,
      },
    });

    // Create or update advertisement record
    const position = order.plan.level === "FLAGSHIP"
      ? "HOME_BANNER"
      : order.plan.level === "PREMIUM"
        ? "HOME_FEATURED"
        : "LISTING_BOOST";

    await prisma.advertisement.upsert({
      where: { id: `ad-inst-${user.ownedInstitution.id}` },
      update: {
        title: `${user.ownedInstitution.name} - ${order.plan.name}`,
        position,
        institutionId: user.ownedInstitution.id,
        startDate: now,
        endDate,
        active: true,
      },
      create: {
        id: `ad-inst-${user.ownedInstitution.id}`,
        title: `${user.ownedInstitution.name} - ${order.plan.name}`,
        position,
        institutionId: user.ownedInstitution.id,
        startDate: now,
        endDate,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `支付成功！${order.plan.name}已激活，有效期至 ${endDate.toLocaleDateString("zh-CN")}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Cancel order
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: "您没有机构" }, { status: 403 });
    }

    const order = await prisma.adOrder.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }
    if (order.institutionId !== user.ownedInstitution.id) {
      return NextResponse.json({ error: "无权操作此订单" }, { status: 403 });
    }
    if (order.status === "ACTIVE") {
      return NextResponse.json({ error: "进行中的订单不能取消" }, { status: 400 });
    }

    await prisma.adOrder.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true, message: "订单已取消" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
