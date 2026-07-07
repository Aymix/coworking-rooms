import { cookies } from "next/headers";

export const SESSION_COOKIE = "admin_session";

export async function isAdmin() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === process.env.ADMIN_TOKEN;
}
