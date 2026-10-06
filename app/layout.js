import "./globals.css";
import { SITE_TITLE, SITE_DESC } from "../lib/config";
export const metadata = { title: SITE_TITLE, description: SITE_DESC };
export default function RootLayout({ children }) {
  return <html lang="id"><body>{children}</body></html>;
}
