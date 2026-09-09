import type { NextConfig } from "next";

// Force le fuseau horaire du Cambodge (UTC+7) quel que soit l'hébergeur (Vercel utilise UTC par défaut).
process.env.TZ = "Asia/Phnom_Penh";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
