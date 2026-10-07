import { SITE_TITLE } from "../lib/config";
export default function manifest() {
  return {
    name: SITE_TITLE, short_name: "Absen X.E 2", description: "Absensi kelas dengan token dari wali kelas",
    start_url: "/", scope: "/", display: "standalone", background_color: "#eaf1fb", theme_color: "#2563eb",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
