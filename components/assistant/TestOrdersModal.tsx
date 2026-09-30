"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllMockOrders } from "@/lib/orders/database";
import { X, Package, Truck, CheckCircle2, Clock } from "lucide-react";

interface TestOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrderPrompt?: (orderId: string) => void;
}

export const TestOrdersModal: React.FC<TestOrdersModalProps> = ({
  isOpen,
  onClose,
  onSelectOrderPrompt,
}) => {
  const orders = getAllMockOrders();

  if (!isOpen) return null;

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
          className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E9E5EB] shadow-2xl p-6 overflow-hidden z-10 text-left max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E9E5EB]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F0EAF4] flex items-center justify-center text-[#4B2859]">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#17131A]">Test Orders Database</h3>
                <p className="text-xs text-[#716A77]">Live orders available for ARIA lookup</p>
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
                className="p-3.5 rounded-2xl bg-[#FAF9FB] border border-[#E9E5EB] hover:border-[#4B2859]/30 hover:bg-[#F0EAF4]/30 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#17131A]">{o.id}</span>
                    <span className="text-xs text-[#716A77]">• {o.customerName}</span>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#E9E5EB] text-[#4B2859]">
                    {o.status}
                  </span>
                </div>

                <div className="text-xs font-semibold text-[#17131A]">{o.product}</div>

                <div className="pt-2 border-t border-[#E9E5EB]/70 grid grid-cols-2 gap-1 text-[11px] text-[#716A77]">
                  {o.expectedDelivery && <div>Expected: <span className="font-medium text-[#17131A]">{o.expectedDelivery}</span></div>}
                  {o.deliveredAgo && <div>Delivered: <span className="font-medium text-[#17131A]">{o.deliveredAgo}</span></div>}
                  {o.courier && <div>Courier: <span className="font-medium text-[#17131A]">{o.courier}</span></div>}
                  <div>Value: <span className="font-medium text-[#17131A]">{o.value}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E9E5EB] text-center">
            <span className="text-xs text-[#716A77]">Click any order to test tracking in conversation</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
