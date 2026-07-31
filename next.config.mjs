/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
    serverComponentsExternalPackages: [
      "@node-rs/argon2",
      "@node-rs/bcrypt",
      "@electric-sql/pglite",
      "better-auth",
      "postgres",
      "drizzle-orm",
      "sharp",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
};

export default nextConfig;
