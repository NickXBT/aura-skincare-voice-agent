"use client";

import React from "react";
import { Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Order } from "@/lib/orders/database";

interface OrderSummaryCardProps {
  order: Order;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ order }) => {
  const getStatusStyle = (status: Order["status"]) => {
    switch (status) {
      case "Out for Delivery":
        return {
          bg: "bg-[#F0EAF4] text-[#4B2859] border-[#4B2859]/20",
          icon: Truck,
        };
      case "Delivered":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: CheckCircle2,
        };
      case "Processing":
        return {
          bg: "bg-amber-50 text-amber-900 border-amber-200",
          icon: Clock,
        };
      case "Cancelled":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-zinc-100 text-zinc-800 border-zinc-200",
          icon: Package,
        };
    }
  };

  const style = getStatusStyle(order.status);
  const StatusIcon = style.icon;

  return (
    <div className="my-3 rounded-2xl bg-[#FAF9FB] border border-[#E9E5EB] p-4 max-w-sm text-left shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-bold text-[#17131A] tracking-wider">
          {order.id}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style.bg}`}
        >
          <StatusIcon className="w-3 h-3" />
          <span>{order.status}</span>
        </span>
      </div>

      <div className="text-sm font-semibold text-[#17131A] leading-tight">
        {order.product}
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#E9E5EB]/80 text-xs text-[#716A77] space-y-1">
        {order.expectedDelivery && (
          <div className="flex justify-between">
            <span>Expected:</span>
            <span className="font-medium text-[#17131A]">{order.expectedDelivery}</span>
          </div>
        )}
        {order.deliveredAgo && (
          <div className="flex justify-between">
            <span>Delivered:</span>
            <span className="font-medium text-[#17131A]">{order.deliveredAgo}</span>
          </div>
        )}
        {order.courier && order.trackingNumber && (
          <div className="flex justify-between">
            <span>Courier:</span>
            <span className="font-medium text-[#17131A]">
              {order.courier} · {order.trackingNumber}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Customer:</span>
          <span className="font-medium text-[#17131A]">{order.customerName}</span>
        </div>
      </div>
    </div>
  );
};
