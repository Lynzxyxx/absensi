import { json } from "../../../../lib/server";
export const dynamic = "force-dynamic";
export async function GET() { return json({ key: process.env.VAPID_PUBLIC_KEY || "" }); }
