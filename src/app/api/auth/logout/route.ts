import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  await deleteSession();
  // 303 so the browser follows up with GET — a plain <form> POST would
  // otherwise be re-sent to /login as POST (307 preserves the method).
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
