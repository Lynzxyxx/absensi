import "./globals.css";
import Daftar from "./Daftar";
import { SITE_TITLE, SITE_DESC } from "../lib/config";
export const metadata = { title: SITE_TITLE, description: SITE_DESC };
export const viewport = { themeColor: "#2563eb" };
export default function RootLayout({ children }) {
  return <html lang="id"><body><Daftar />{children}</body></html>;
}
