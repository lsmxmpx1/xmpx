"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { geocodeAddress } from "@/lib/amap";
import { DISTRICTS } from "@/lib/utils";

// 从地址串中识别厦门六区，用于地图/区域筛选（无匹配则返回 null，视为全市）
function detectDistrict(address: string | null | undefined): string | null {
  if (!address) return null;
  for (const d of DISTRICTS) {
    if (address.includes(d.replace("区", ""))) return d;
  }
  return null;
}

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) || "").trim();
  return v || null;
}

/* 管理员后台新增「系统机构名录」条目：标识(id)由系统生成，默认前台可见。
 * 保存时自动将「学校地址」经高德地理编码为经纬度，并在页面地图标注。 */
export async function createSchoolDirectoryAdmin(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("无权限执行该操作");
  }

  const name = str(formData, "name");
  if (!name) throw new Error("学校名称不能为空");
  if (name.length < 2) throw new Error("学校名称至少 2 个字符");

  const address = str(formData, "address");

  // 地址地理编码（非阻塞：失败仅无坐标，页面仍展示文字地址）
  let lng: number | null = null;
  let lat: number | null = null;
  if (address) {
    try {
      const geo = await geocodeAddress(address, "厦门");
      if (geo) {
        lng = geo.lng;
        lat = geo.lat;
      }
    } catch {
      /* 高德 Key 未配置或解析失败，忽略坐标 */
    }
  }

  const district = detectDistrict(address);

  await prisma.schoolDirectory.create({
    data: {
      name,
      authority: str(formData, "authority"),
      educationalContent: str(formData, "educationalContent"),
      licenseNo: str(formData, "licenseNo"),
      organizer: str(formData, "organizer"),
      address,
      legalPerson: str(formData, "legalPerson"),
      contact: str(formData, "contact"),
      lng,
      lat,
      district,
      status: "PUBLISHED",
    },
  });

  // 失效后台列表与前台「找机构」合并列表的缓存
  revalidatePath("/admin/school-directories");
  revalidatePath("/institutions");
}

/* 删除系统机构条目 */
export async function deleteSchoolDirectory(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;
  try {
    await prisma.schoolDirectory.delete({ where: { id } });
  } catch {
    /* 已不存在则忽略 */
  }
  revalidatePath("/admin/school-directories");
  revalidatePath("/institutions");
}
