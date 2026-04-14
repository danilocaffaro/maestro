// PM2 ecosystem config for Maestro
module.exports = {
  apps: [{
    name: "maestro",
    script: ".next/standalone/server.js",
    cwd: "/home/opc/maestro",  // adjust to your Oracle VM path
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      HOSTNAME: "0.0.0.0",
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "512M",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "/home/opc/logs/maestro-error.log",
    out_file: "/home/opc/logs/maestro-out.log",
  }]
};
