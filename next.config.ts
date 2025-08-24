import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default nextConfig;
