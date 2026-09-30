"use client";

import React, { useState } from "react";
import { getAllMockOrders } from "@/lib/orders/database";
import { ChevronDown, ChevronUp, Package } from "lucide-react";

export const TestOrdersDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const orders = getAllMockOrders();

  return (
    <div className="w-full max-w-lg mx-auto mt-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2.5 px-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-[#746C78] hover:text-[#241329] transition cursor-pointer select-none"
      >
        <span className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-[#3B1F4A]" />
          Test Orders
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-white rounded-2xl border border-[#EDE5F2] space-y-2 animate-fade-in shadow-xs">
          {orders.map((o) => {
            const isSelected = activeOrderId === o.id;

            return (
              <div
                key={o.id}
                className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE5F2] transition cursor-pointer hover:border-[#3B1F4A]/30"
                onClick={() => setActiveOrderId(isSelected ? null : o.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#241329]">{o.id}</span>
                    <span className="text-xs text-[#746C78]">— {o.product}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#3B1F4A] px-2 py-0.5 rounded-full bg-[#EDE5F2]">
                    {o.status}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-[#EDE5F2] text-[11px] text-[#17131A] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#746C78]">Customer:</span>
                      <span className="font-medium text-[#241329]">{o.customerName}</span>
                    </div>
                    {o.courier && (
                      <div className="flex justify-between">
                        <span className="text-[#746C78]">Courier & Tracking:</span>
                        <span className="font-mono text-[#241329]">{o.courier} ({o.trackingNumber})</span>
                      </div>
                    )}
                    {o.expectedDelivery && (
                      <div className="flex justify-between">
                        <span className="text-[#746C78]">Expected:</span>
                        <span className="font-medium text-[#241329]">{o.expectedDelivery}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#746C78]">Cancellation:</span>
                      <span className="font-medium text-[#3B1F4A]">
                        {o.cancellationEligible ? "Eligible (In Processing)" : "Not eligible"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
