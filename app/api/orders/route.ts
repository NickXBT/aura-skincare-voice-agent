import { NextRequest, NextResponse } from "next/server";
import {
  getAllMockOrders,
  getOrderById,
  cancelOrderInDb,
  applyClientCancelledOrders,
  getAuditLog,
  getCancelledOrderIds,
} from "@/lib/orders/database";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const order = getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: `Order ${id} not found` }, { status: 404 });
    }
    return NextResponse.json({
      order,
      cancelledOrderIds: getCancelledOrderIds(),
      auditLog: getAuditLog(),
    });
  }

  return NextResponse.json({
    orders: getAllMockOrders(),
    cancelledOrderIds: getCancelledOrderIds(),
    auditLog: getAuditLog(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, orderId, cancelledOrderIds, auditEvents } = body;

    if (cancelledOrderIds && Array.isArray(cancelledOrderIds)) {
      applyClientCancelledOrders(cancelledOrderIds, auditEvents);
    }

    if (action === "cancel" && orderId) {
      const cancelResult = cancelOrderInDb(orderId);
      return NextResponse.json({
        ...cancelResult,
        orders: getAllMockOrders(),
        auditLog: getAuditLog(),
        cancelledOrderIds: getCancelledOrderIds(),
      });
    }

    return NextResponse.json({
      success: true,
      orders: getAllMockOrders(),
      auditLog: getAuditLog(),
      cancelledOrderIds: getCancelledOrderIds(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to process order request" },
      { status: 500 }
    );
  }
}
