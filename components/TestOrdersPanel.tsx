"use client";

import React, { useState } from "react";
import { getAllMockOrders, Order } from "@/lib/orders/database";
import { Package, Truck, CheckCircle2, Clock, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface TestOrdersPanelProps {
  onSelectOrderPrompt?: (orderId: string) => void;
}

export const TestOrdersPanel: React.FC<TestOrdersPanelProps> = ({ onSelectOrderPrompt }) => {
  const orders = getAllMockOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>("ORD-101");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "Out for Delivery":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F3FA] text-[#4A2365] border border-[#E8DFED]">
            <Truck className="w-3 h-3 text-[#6D3A91]" />
            Out for Delivery
          </span>
        );
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F3FA] text-[#2B123F] border border-[#E8DFED]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Delivered
          </span>
        );
      case "Processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F3FA] text-[#6D3A91] border border-[#E8DFED]">
            <Clock className="w-3 h-3 text-[#6D3A91]" />
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F7F3FA] text-[#2B123F]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-[#E8DFED] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#F7F3FA] border-b border-[#E8DFED] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#4A2365]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B123F]">
            Mock Test Orders (Database)
          </h3>
        </div>
        <span className="text-[10px] uppercase font-semibold text-[#6D3A91] bg-white px-2 py-0.5 rounded border border-[#E8DFED]">
          Click to inspect
        </span>
      </div>

      {/* Orders List */}
      <div className="divide-y divide-[#E8DFED]">
        {orders.map((order) => {
          const isExpanded = selectedOrderId === order.id;

          return (
            <div key={order.id} className="transition-colors hover:bg-[#F7F3FA]/40">
              <button
                type="button"
                onClick={() => setSelectedOrderId(isExpanded ? null : order.id)}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-[#2B123F]">
                        {order.id}
                      </span>
                      <button
                        onClick={(e) => handleCopy(order.id, e)}
                        className="text-[#6F6575] hover:text-[#2B123F] p-0.5 rounded transition"
                        title="Copy Order ID"
                      >
                        {copiedId === order.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <span className="text-xs text-[#6F6575] font-medium">
                      {order.customerName} • {order.product}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#6F6575]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#6F6575]" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 bg-[#F7F3FA]/60 border-t border-[#E8DFED]/70 text-xs text-[#1A1220] space-y-2">
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-[#6F6575] block text-[11px]">Product & Amount:</span>
                      <span className="font-semibold text-[#2B123F]">
                        {order.product} ({order.value})
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6F6575] block text-[11px]">Status:</span>
                      <span className="font-semibold text-[#2B123F]">{order.status}</span>
                    </div>

                    {order.courier && (
                      <div>
                        <span className="text-[#6F6575] block text-[11px]">Courier & Tracking:</span>
                        <span className="font-mono text-[#2B123F]">
                          {order.courier} • {order.trackingNumber}
                        </span>
                      </div>
                    )}

                    {order.expectedDelivery && (
                      <div>
                        <span className="text-[#6F6575] block text-[11px]">Expected Delivery:</span>
                        <span className="font-medium text-[#2B123F]">{order.expectedDelivery}</span>
                      </div>
                    )}

                    {order.deliveredAgo && (
                      <div>
                        <span className="text-[#6F6575] block text-[11px]">Delivery Time:</span>
                        <span className="font-medium text-[#2B123F]">{order.deliveredAgo}</span>
                      </div>
                    )}

                    {order.orderedAgo && (
                      <div>
                        <span className="text-[#6F6575] block text-[11px]">Order Placed:</span>
                        <span className="font-medium text-[#2B123F]">{order.orderedAgo}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-[#6F6575] block text-[11px]">Cancellation Status:</span>
                      <span
                        className={`font-semibold ${
                          order.cancellationEligible ? "text-emerald-700" : "text-amber-800"
                        }`}
                      >
                        {order.cancellationEligible
                          ? "Eligible (In Processing)"
                          : "Not Eligible (Shipped/Delivered)"}
                      </span>
                    </div>
                  </div>

                  {/* Suggestion action */}
                  {onSelectOrderPrompt && (
                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectOrderPrompt(`Where is my order ${order.id}?`)}
                        className="text-[11px] px-2.5 py-1 bg-white hover:bg-[#F7F3FA] text-[#4A2365] border border-[#E8DFED] rounded-md font-medium transition cursor-pointer"
                      >
                        Ask: "Where is my order {order.id}?"
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectOrderPrompt(`Cancel ${order.id}.`)}
                        className="text-[11px] px-2.5 py-1 bg-white hover:bg-[#F7F3FA] text-[#4A2365] border border-[#E8DFED] rounded-md font-medium transition cursor-pointer"
                      >
                        Ask: "Cancel {order.id}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
