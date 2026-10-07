import { json } from "../../../lib/server";
import { buatCaptcha } from "../../../lib/captcha";
export const dynamic = "force-dynamic";
export async function GET() { return json(buatCaptcha()); }
