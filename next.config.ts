import type { NextConfig } from "next";

// Force le fuseau horaire du Cambodge (UTC+7) quel que soit l'hébergeur (Vercel utilise UTC par défaut).
process.env.TZ = "Asia/Phnom_Penh";

const nextConfig: NextConfig = {
  experimental: {
    // Les photos de profil (jusqu'à 4 Mo) transitent par les Server Actions.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
