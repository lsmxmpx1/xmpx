"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface AdPlan {
  id: string;
  name: string;
  level: string;
  price: number;
  duration: number;
  features: string;
  description: string;
}

interface AdOrder {
  id: string;
  amount: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  plan: { name: string; level: string; duration: number };
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  BASIC: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-100 text-blue-600" },
  PREMIUM: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-100 text-purple-600" },
  FLAGSHIP: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-600" },
};

const LEVEL_BADGES: Record<string, string> = {
  BASIC: "基础",
  PREMIUM: "推荐",
  FLAGSHIP: "旗舰",
};

export default function AdBuyPanel() {
  const [plans, setPlans] = useState<AdPlan[]>([]);
  const [orders, setOrders] = useState<AdOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buying, setBuying] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<AdPlan | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, ordersRes] = await Promise.all([
        fetch("/api/ad-plans"),
        fetch("/api/ad-orders"),
      ]);
      const plansData = await plansRes.json();
      const ordersData = await ordersRes.json();

      if (plansRes.ok) setPlans(Array.isArray(plansData) ? plansData : []);
      else setError(plansData.error || "加载套餐失败");

      if (ordersRes.ok) setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (e) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBuy = (plan: AdPlan) => {
    setSelectedPlan(plan);
    setShowConfirm(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedPlan) return;
    setBuying(selectedPlan.id);
    setError("");
    try {
      const res = await fetch("/api/ad-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowConfirm(false);
        setPaying(data.id);
      } else {
        setError(data.error || "下单失败");
      }
    } catch (e) {
      setError("网络错误，请稍后重试");
    } finally {
      setBuying(null);
    }
  };

  const handlePay = async (orderId: string) => {
    setBuying(orderId);
    setError("");
    try {
      const res = await fetch(`/api/ad-orders/${orderId}`, { method: "PUT" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "支付成功！");
        setPaying(null);
        fetchData();
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setError(data.error || "支付失败");
      }
    } catch (e) {
      setError("网络错误，请稍后重试");
    } finally {
      setBuying(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/ad-orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      // ignore
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "待支付",
      ACTIVE: "进行中",
      EXPIRED: "已到期",
      CANCELLED: "已取消",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-700",
      ACTIVE: "bg-green-100 text-green-700",
      EXPIRED: "bg-gray-100 text-gray-500",
      CANCELLED: "bg-red-50 text-red-400",
    };
    return map[status] || "bg-gray-100 text-gray-500";
  };

  const hasActiveOrder = orders.some((o) => o.status === "ACTIVE");

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-400 text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Order Banner */}
      {hasActiveOrder && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">推广已生效</p>
              <p className="text-green-600 text-sm mt-0.5">
                您的机构正在享受推广服务，当前有效期至{" "}
                {orders.find((o) => o.status === "ACTIVE")?.endDate
                  ? new Date(orders.find((o) => o.status === "ACTIVE")!.endDate!).toLocaleDateString("zh-CN")
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium animate-pulse">
          🎉 {successMsg}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Payment Pending Modal */}
      {paying && (
        <div className="bg-white border-2 border-amber-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="text-5xl mb-4">💳</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">确认支付</h3>
          <p className="text-gray-500 mb-2">
            {orders.find((o) => o.id === paying)?.plan.name}
          </p>
          <p className="text-2xl font-bold text-amber-600 mb-6">
            ¥{orders.find((o) => o.id === paying)?.amount}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handlePay(paying)}
              disabled={buying !== null}
              className="bg-amber-500 text-white font-semibold px-8 py-3 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {buying ? "处理中..." : "确认支付（模拟）"}
            </button>
            <button
              onClick={() => handleCancelOrder(paying)}
              className="text-gray-400 px-6 py-3 rounded-xl hover:text-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">演示环境，点击确认即可模拟支付完成</p>
        </div>
      )}

      {/* Confirm Order Modal */}
      {showConfirm && selectedPlan && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-3">确认下单</h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm">套餐</span>
                <span className="font-semibold text-gray-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm">时长</span>
                <span className="text-gray-800">{selectedPlan.duration} 天</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-500 text-sm">金额</span>
                <span className="text-xl font-bold text-purple-600">¥{selectedPlan.price}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              下单后请在 24 小时内完成支付，过期订单将自动取消。
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmOrder}
                disabled={buying !== null}
                className="flex-1 bg-purple-600 text-white font-semibold py-2.5 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {buying ? "处理中..." : "确认下单"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2.5 text-gray-500 hover:text-gray-700 rounded-xl border border-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad Plans Grid */}
      <div>
        <h3 className="font-semibold text-lg mb-1">选择推广套餐</h3>
        <p className="text-sm text-gray-400 mb-5">
          选择适合您的推广方案，提升机构曝光度，获取更多学员
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const colors = LEVEL_COLORS[plan.level] || LEVEL_COLORS.BASIC;
            const features = plan.features.split("|");

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 ${colors.border} overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col ${
                  plan.level === "PREMIUM" ? "md:-mt-2 md:mb-2 shadow-md" : ""
                }`}
              >
                {/* Header */}
                <div className={`${colors.bg} p-5 text-center`}>
                  <span className={`inline-block ${colors.badge} text-xs font-bold px-3 py-1 rounded-full mb-2`}>
                    {LEVEL_BADGES[plan.level]}
                  </span>
                  <h4 className={`text-lg font-bold ${colors.text}`}>{plan.name}</h4>
                  <div className="mt-2">
                    <span className={`text-3xl font-extrabold ${colors.text}`}>¥{plan.price}</span>
                    <span className="text-sm text-gray-400">/{plan.duration}天</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    日均 ¥{(plan.price / plan.duration).toFixed(2)}
                  </p>
                </div>

                {/* Features */}
                <div className="p-5 flex-1">
                  <p className="text-xs text-gray-500 mb-3">{plan.description}</p>
                  <ul className="space-y-2">
                    {features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleBuy(plan)}
                    disabled={hasActiveOrder}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                      hasActiveOrder
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : plan.level === "PREMIUM"
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : plan.level === "FLAGSHIP"
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : `border-2 ${colors.border} ${colors.text} hover:bg-gray-50`
                    }`}
                  >
                    {hasActiveOrder ? "已有进行中订单" : "立即购买"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA for institutions without active order */}
      {!hasActiveOrder && plans.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <div className="text-4xl mb-3">📢</div>
          <p className="text-gray-400">暂无可用推广套餐</p>
        </div>
      )}

      {/* Order History */}
      {orders.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4">订单记录</h3>
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">套餐</th>
                    <th className="text-left px-5 py-3 font-medium">金额</th>
                    <th className="text-left px-5 py-3 font-medium">状态</th>
                    <th className="text-left px-5 py-3 font-medium">有效期</th>
                    <th className="text-left px-5 py-3 font-medium">时间</th>
                    <th className="text-right px-5 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {order.plan.name}
                      </td>
                      <td className="px-5 py-3 text-gray-700">¥{order.amount}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {order.startDate
                          ? `${new Date(order.startDate).toLocaleDateString("zh-CN")} ~ ${new Date(order.endDate!).toLocaleDateString("zh-CN")}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {order.status === "PENDING" && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setPaying(order.id)}
                              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                            >
                              去支付
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-xs text-gray-300 hover:text-red-400"
                            >
                              取消
                            </button>
                          </div>
                        )}
                        {order.status === "ACTIVE" && (
                          <span className="text-xs text-green-500">生效中</span>
                        )}
                        {(order.status === "EXPIRED" || order.status === "CANCELLED") && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
