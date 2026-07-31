import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: [
      "@node-rs/argon2",
      "@node-rs/bcrypt",
      "@electric-sql/pglite",
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

export default withNextIntl(nextConfig);
