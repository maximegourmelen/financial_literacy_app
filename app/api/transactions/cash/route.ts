import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createCashTransaction, parseCashDirection, parseLedgerAmount } from "@/lib/accounts";
import { requireSession } from "@/lib/auth";
import { ensureSavingsInterestUpToDate } from "@/lib/interest";
import { appendMessage, sanitizeReturnTo } from "@/lib/url";

export async function POST(request: Request) {
  const session = await requireSession("child");

  const formData = await request.formData();
  const returnTo = sanitizeReturnTo(formData.get("returnTo"), "/checking");
  const direction = parseCashDirection(formData.get("direction"));
  const amountHkd = parseLedgerAmount(formData.get("amount"));
  const description = String(formData.get("description") ?? "");

  if (!direction || !amountHkd) {
    return NextResponse.redirect(
      new URL(appendMessage(returnTo, "error", "Enter a valid cash action and amount."), request.url)
    );
  }

  try {
    await ensureSavingsInterestUpToDate();
    await createCashTransaction({
      userId: session.userId,
      direction,
      amountHkd,
      description
    });

    revalidatePath("/dashboard");
    revalidatePath("/checking");
    revalidatePath("/history");
    revalidatePath("/admin");

    return NextResponse.redirect(
      new URL(
        appendMessage(
          returnTo,
          "message",
          direction === "deposit" ? "Deposit recorded." : "Withdrawal recorded."
        ),
        request.url
      )
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        appendMessage(
          returnTo,
          "error",
          error instanceof Error ? error.message : "Could not save that cash movement."
        ),
        request.url
      )
    );
  }
}
