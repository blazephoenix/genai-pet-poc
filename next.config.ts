import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Note: Pages Router API body size cannot be set here in Next 15.
  // We keep this comment and handle payload size client-side instead.
};

export default nextConfig;
