"use client";

import React from "react";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle2, Clock, X, ExternalLink } from "lucide-react";
import { Order } from "@/lib/orders/database";

interface InlineOrderCardProps {
  order: Order;
  onDismiss?: () => void;
}

export const InlineOrderCard: React.FC<InlineOrderCardProps> = ({ order, onDismiss }) => {
  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "Out for Delivery":
        return {
          bg: "bg-[#EDE5F2] text-[#32183F] border-[#32183F]/20",
          icon: <Truck className="w-3.5 h-3.5 text-[#32183F]" />,
          label: "Out for Delivery",
        };
      case "Delivered":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />,
          label: "Delivered",
        };
      case "Processing":
        return {
          bg: "bg-amber-50 text-amber-900 border-amber-200",
          icon: <Clock className="w-3.5 h-3.5 text-amber-700" />,
          label: "Processing",
        };
      case "Cancelled":
        return {
          bg: "bg-red-50 text-red-800 border-red-200",
          icon: <X className="w-3.5 h-3.5 text-red-700" />,
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-zinc-100 text-zinc-800 border-zinc-200",
          icon: <Package className="w-3.5 h-3.5 text-zinc-700" />,
          label: status,
        };
    }
  };

  const badge = getStatusBadge(order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-xl mx-auto rounded-2xl bg-[#FAF9FB] border border-[#EEEAF0] p-4 shadow-[0_4px_20px_-4px_rgba(50,24,63,0.05)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#EEEAF0] flex items-center justify-center text-[#32183F] shadow-xs">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#17131A] tracking-wider">
                {order.id}
              </span>
              <span className="text-xs text-[#706A74]">•</span>
              <span className="text-xs text-[#706A74] font-medium">{order.customerName}</span>
            </div>
            <h4 className="text-sm font-semibold text-[#17131A] mt-0.5">{order.product}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-[#706A74] hover:text-[#17131A] p-1 rounded-md transition-colors"
              aria-label="Dismiss order card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Detail Pills */}
      <div className="mt-3 pt-3 border-t border-[#EEEAF0]/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-[#706A74] block">Amount</span>
          <span className="font-medium text-[#17131A]">{order.value}</span>
        </div>
        {order.courier && (
          <div>
            <span className="text-[#706A74] block">Courier</span>
            <span className="font-medium text-[#17131A]">{order.courier}</span>
          </div>
        )}
        {order.expectedDelivery && (
          <div>
            <span className="text-[#706A74] block">Expected Delivery</span>
            <span className="font-medium text-[#17131A]">{order.expectedDelivery}</span>
          </div>
        )}
        {order.deliveredAgo && (
          <div>
            <span className="text-[#706A74] block">Delivered</span>
            <span className="font-medium text-[#17131A]">{order.deliveredAgo}</span>
          </div>
        )}
        {order.orderedAgo && (
          <div>
            <span className="text-[#706A74] block">Placed</span>
            <span className="font-medium text-[#17131A]">{order.orderedAgo}</span>
          </div>
        )}
        {order.trackingNumber && (
          <div>
            <span className="text-[#706A74] block">Tracking</span>
            <span className="font-mono text-[11px] text-[#17131A]">{order.trackingNumber}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
