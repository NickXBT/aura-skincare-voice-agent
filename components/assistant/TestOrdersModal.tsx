"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllMockOrders, Order } from "@/lib/orders/database";
import { X, Package, Truck, CheckCircle2, Clock, XCircle, MapPin, CreditCard } from "lucide-react";

interface TestOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrderPrompt?: (orderId: string) => void;
  orders?: Order[];
}

export const TestOrdersModal: React.FC<TestOrdersModalProps> = ({
  isOpen,
  onClose,
  onSelectOrderPrompt,
  orders: ordersProp,
}) => {
  const [liveOrders, setLiveOrders] = useState<Order[]>(ordersProp || getAllMockOrders());

  useEffect(() => {
    if (ordersProp) {
      setLiveOrders(ordersProp);
    } else {
      setLiveOrders(getAllMockOrders());
    }
  }, [ordersProp, isOpen]);

  // Listen to live cancellation event so UI updates immediately without refresh
  useEffect(() => {
    const handleOrderCancelled = () => {
      setLiveOrders([...getAllMockOrders()]);
    };
    window.addEventListener("aura-order-cancelled", handleOrderCancelled);
    return () => window.removeEventListener("aura-order-cancelled", handleOrderCancelled);
  }, []);

  const orders = liveOrders;

  if (!isOpen) return null;

  const getStatusBadge = (status: string, cancelEligible: boolean) => {
    switch (status) {
      case "Out for Delivery":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Processing":
        return cancelEligible
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-zinc-100 text-zinc-700 border-zinc-200";
      case "Cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E9E5EB] shadow-2xl p-6 overflow-hidden z-10 text-left max-h-[88vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E9E5EB]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F0EAF4] flex items-center justify-center text-[#4B2859]">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#17131A]">Aura Orders Database (10 Realistic Orders)</h3>
                <p className="text-xs text-[#716A77]">Live in-memory database with status, address, payments & cancellation state</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#716A77] hover:text-[#17131A] hover:bg-[#F0EAF4] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Orders */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => {
                  if (onSelectOrderPrompt) onSelectOrderPrompt(o.id);
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-[#FAF9FB] border border-[#E9E5EB] hover:border-[#4B2859]/40 hover:bg-[#F0EAF4]/25 transition-all cursor-pointer space-y-2 group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#17131A]">{o.id}</span>
                    <span className="text-xs text-[#716A77]">· {o.customerName}</span>
                    <span className="text-xs text-[#716A77]">({o.phone_last4 ? `••${o.phone_last4}` : ""})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {o.cancellation_eligible ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Cancellation eligible
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                        Cancellation unavailable
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(o.status, o.cancellation_eligible)}`}>
                      {o.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-[#17131A]">
                  {o.items && o.items.length > 0 ? o.items.join(" + ") : o.product}
                </div>

                <div className="pt-2 border-t border-[#E9E5EB]/70 grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-[#716A77]">
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-[#716A77] shrink-0" />
                    <span className="truncate">{o.city} ({o.pincode})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-[#716A77] shrink-0" />
                    <span>{o.payment_method} · {o.value || `₹${o.total_amount}`}</span>
                  </div>
                  <div>
                    {o.status === "Out for Delivery" && (
                      <span className="text-purple-700 font-medium">ETA: {o.expectedDelivery}</span>
                    )}
                    {o.status === "Shipped" && (
                      <span className="text-blue-700 font-medium">{o.courier} ({o.trackingNumber || o.tracking_id})</span>
                    )}
                    {o.status === "Delivered" && (
                      <span className="text-emerald-700 font-medium">{o.deliveredAgo}</span>
                    )}
                    {o.status === "Processing" && (
                      <span className="text-amber-800 font-medium">Ordered {o.orderedAgo}</span>
                    )}
                    {o.status === "Cancelled" && (
                      <span className="text-rose-700 font-medium">Refund: {o.payment_status}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E9E5EB] flex items-center justify-between text-xs text-[#716A77]">
            <span>Click any order to ask ARIA about it</span>
            <span className="text-[11px] text-[#4B2859] font-medium">10 Live Orders</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
