import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createTransfer, parseAccountType, parseLedgerAmount } from "@/lib/accounts";
import { requireSession } from "@/lib/auth";
import { ensureSavingsInterestUpToDate } from "@/lib/interest";
import { appendMessage, sanitizeReturnTo } from "@/lib/url";

export async function POST(request: Request) {
  const session = await requireSession("child");

  const formData = await request.formData();
  const returnTo = sanitizeReturnTo(formData.get("returnTo"), "/dashboard");
  const fromAccount = parseAccountType(formData.get("fromAccount"));
  const toAccount = parseAccountType(formData.get("toAccount"));
  const amountHkd = parseLedgerAmount(formData.get("amount"));
  const description = String(formData.get("description") ?? "");

  if (!fromAccount || !toAccount || !amountHkd) {
    return NextResponse.redirect(
      new URL(appendMessage(returnTo, "error", "Choose both accounts and a valid amount."), request.url)
    );
  }

  try {
    await ensureSavingsInterestUpToDate();
    await createTransfer({
      userId: session.userId,
      fromAccount,
      toAccount,
      amountHkd,
      description
    });

    revalidatePath("/dashboard");
    revalidatePath("/checking");
    revalidatePath("/savings");
    revalidatePath("/investments");
    revalidatePath("/history");
    revalidatePath("/admin");

    return NextResponse.redirect(
      new URL(appendMessage(returnTo, "message", "Transfer completed."), request.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        appendMessage(
          returnTo,
          "error",
          error instanceof Error ? error.message : "Could not complete that transfer."
        ),
        request.url
      )
    );
  }
}
