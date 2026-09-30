"use client";

import React, { useState } from "react";
import { getAllMockOrders } from "@/lib/orders/database";
import { ChevronDown, ChevronUp } from "lucide-react";

export const MinimalTestOrders: React.FC = () => {
  const orders = getAllMockOrders();
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenOrderId(openOrderId === id ? null : id);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-8 pt-6 border-t border-[#EEE7F2]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#77717A]">
          Test Orders
        </h3>
        <span className="text-[11px] text-[#77717A]">Available in mock system</span>
      </div>

      <div className="space-y-2.5">
        {orders.map((order) => {
          const isOpen = openOrderId === order.id;

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-[#EEE7F2] overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => toggle(order.id)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#FAF9F7]/60 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[#241329]">
                    {order.id}
                  </span>
                  <span className="text-xs text-[#77717A]">
                    {order.customerName} • {order.product}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#3B1F4A] px-2.5 py-0.5 rounded-full bg-[#EEE7F2]">
                    {order.status}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#77717A]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#77717A]" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-1 bg-[#FAF9F7] border-t border-[#EEE7F2] text-xs text-[#17131A] space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-[#EEE7F2]/60">
                    <span className="text-[#77717A]">Product & Value:</span>
                    <span className="font-medium text-[#241329]">
                      {order.product} ({order.value})
                    </span>
                  </div>
                  {order.courier && (
                    <div className="flex justify-between py-1 border-b border-[#EEE7F2]/60">
                      <span className="text-[#77717A]">Courier:</span>
                      <span className="font-mono text-[#241329]">
                        {order.courier} ({order.trackingNumber})
                      </span>
                    </div>
                  )}
                  {order.expectedDelivery && (
                    <div className="flex justify-between py-1 border-b border-[#EEE7F2]/60">
                      <span className="text-[#77717A]">Expected Delivery:</span>
                      <span className="font-medium text-[#241329]">{order.expectedDelivery}</span>
                    </div>
                  )}
                  {order.deliveredAgo && (
                    <div className="flex justify-between py-1 border-b border-[#EEE7F2]/60">
                      <span className="text-[#77717A]">Delivered:</span>
                      <span className="font-medium text-[#241329]">{order.deliveredAgo}</span>
                    </div>
                  )}
                  {order.orderedAgo && (
                    <div className="flex justify-between py-1 border-b border-[#EEE7F2]/60">
                      <span className="text-[#77717A]">Ordered:</span>
                      <span className="font-medium text-[#241329]">{order.orderedAgo}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-[#77717A]">Cancellation Eligibility:</span>
                    <span
                      className={`font-semibold ${
                        order.cancellationEligible ? "text-emerald-700" : "text-amber-800"
                      }`}
                    >
                      {order.cancellationEligible ? "Eligible (In Processing)" : "Not Eligible"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
