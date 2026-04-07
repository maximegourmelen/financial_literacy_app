import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSavingsRate } from "@/lib/interest";
import { getSession } from "@/lib/session";
import { appendMessage, sanitizeReturnTo } from "@/lib/url";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const formData = await request.formData();
  const returnTo = sanitizeReturnTo(formData.get("returnTo"), "/admin");
  const aprPercent = Number(formData.get("aprPercent") ?? "");
  const effectiveDate = String(formData.get("effectiveDate") ?? "");

  if (!Number.isFinite(aprPercent) || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
    return NextResponse.redirect(
      new URL(appendMessage(returnTo, "error", "Enter a valid APR and effective date."), request.url)
    );
  }

  try {
    await createSavingsRate({
      aprPercent,
      effectiveDate,
      createdBy: session.userId
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/savings");

    return NextResponse.redirect(
      new URL(appendMessage(returnTo, "message", "Savings APR updated."), request.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        appendMessage(
          returnTo,
          "error",
          error instanceof Error ? error.message : "Could not save the new savings rate."
        ),
        request.url
      )
    );
  }
}
