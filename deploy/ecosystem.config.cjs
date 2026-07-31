module.exports = {
  apps: [
    {
      name: "atelier",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/atelier/app",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL,
        AUTH_SECRET: process.env.AUTH_SECRET,
        APP_URL: "https://atelier.com",
        NEXT_PUBLIC_SITE_NAME: "ATELIER",
        NEXT_PUBLIC_DEFAULT_LOCALE: "zh",
      },
      error_file: "/var/log/atelier/error.log",
      out_file: "/var/log/atelier/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true,
    },
  ],
};
