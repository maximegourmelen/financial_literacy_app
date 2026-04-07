import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { ensureSavingsInterestUpToDate } from "@/lib/interest";
import { executeTrade } from "@/lib/investments";
import { parsePositiveAmount } from "@/lib/money";
import { appendMessage, sanitizeReturnTo } from "@/lib/url";

export async function POST(request: Request) {
  const session = await requireSession("child");

  const formData = await request.formData();
  const returnTo = sanitizeReturnTo(formData.get("returnTo"), "/investments");
  const side = formData.get("side") === "sell" ? "sell" : "buy";
  const symbol = String(formData.get("symbol") ?? "").trim().toUpperCase();
  const orderMode = formData.get("orderMode") === "quantity" ? "quantity" : "amount";
  const amount = parsePositiveAmount(formData.get("amount"));
  const quantity = parsePositiveAmount(formData.get("quantity"));

  if (!symbol) {
    return NextResponse.redirect(
      new URL(appendMessage(returnTo, "error", "Choose an asset before trading."), request.url)
    );
  }

  if ((orderMode === "amount" && !amount) || (orderMode === "quantity" && !quantity)) {
    return NextResponse.redirect(
      new URL(
        appendMessage(returnTo, "error", "Enter the field that matches your selected order mode."),
        request.url
      )
    );
  }

  try {
    await ensureSavingsInterestUpToDate();
    await executeTrade({
      userId: session.userId,
      symbol,
      side,
      orderMode,
      amountHkd: amount ?? undefined,
      quantity: quantity ?? undefined
    });

    revalidatePath("/dashboard");
    revalidatePath("/investments");
    revalidatePath("/history");
    revalidatePath("/admin");

    return NextResponse.redirect(
      new URL(
        appendMessage(returnTo, "message", `${side === "buy" ? "Buy" : "Sell"} order recorded.`),
        request.url
      )
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        appendMessage(
          returnTo,
          "error",
          error instanceof Error ? error.message : "Could not execute that trade."
        ),
        request.url
      )
    );
  }
}
