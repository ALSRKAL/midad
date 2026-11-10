/**
 * "Export my data" (the product requirements).
 *
 * A GET route rather than a server action because the browser must receive it as a file download.
 * Authentication is checked here again — a route handler is a public HTTP endpoint, and being linked
 * from a protected page does not protect it.
 */

import { NextResponse } from "next/server";

import { exportAccountData } from "@/server/account";
import { getCurrentSession } from "@/server/session";

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const data = await exportAccountData(user.id);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="midad-account-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
