import { NextRequest, NextResponse } from "next/server";
import { getAllMockOrders, getOrderById } from "@/lib/orders/database";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const order = getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: `Order ${id} not found` }, { status: 404 });
    }
    return NextResponse.json(order);
  }

  return NextResponse.json(getAllMockOrders());
}
