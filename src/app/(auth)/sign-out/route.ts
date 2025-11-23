import { signOut } from "@workos-inc/authkit-nextjs"
import { Route } from "next"
import { redirect } from "next/navigation"

export async function GET() {
  await signOut()
  return redirect("/" as Route)
}
