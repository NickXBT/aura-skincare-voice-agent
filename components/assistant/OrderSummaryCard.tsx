"use client";

import React from "react";
import { Package, Truck, CheckCircle2, Clock, XCircle, MapPin, CreditCard } from "lucide-react";
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
      case "Shipped":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
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
        {order.items && order.items.length > 0 ? order.items.join(" + ") : order.product}
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
        {order.delivery_address && (
          <div className="flex justify-between items-start gap-2">
            <span className="shrink-0 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#716A77]" /> Address:</span>
            <span className="font-medium text-[#17131A] text-right truncate">
              {order.city} ({order.pincode})
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-[#716A77]" /> Payment:</span>
          <span className="font-medium text-[#17131A]">
            {order.payment_method} · {order.value || `₹${order.total_amount}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span className="font-medium text-[#17131A]">{order.customerName}</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-[#E9E5EB]/60">
          <span>Cancellation:</span>
          <span className={`text-[11px] font-semibold ${order.cancellation_eligible ? "text-emerald-700" : "text-zinc-600"}`}>
            {order.cancellation_eligible ? "Cancellation eligible" : "Cancellation unavailable"}
          </span>
        </div>
      </div>
    </div>
  );
};
