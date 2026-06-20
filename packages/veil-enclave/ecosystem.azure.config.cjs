/** PM2 config for Azure VM — loads ~/veil/.env */
module.exports = {
  apps: [
    {
      name: "veil-enclave",
      cwd: "/home/azureuser/veil",
      script: "npm",
      args: "run enclave",
      env_file: "/home/azureuser/veil/.env",
      env: {
        NODE_ENV: "production",
        VEIL_ENCLAVE_PORT: "8080",
      },
    },
    {
      name: "veil-api",
      cwd: "/home/azureuser/veil",
      script: "npm",
      args: "run api",
      env_file: "/home/azureuser/veil/.env",
      env: {
        NODE_ENV: "production",
        VEIL_ENCLAVE_URL: "http://127.0.0.1:8080",
        VEIL_API_PORT: "8787",
        ENOKI_SPONSOR_MAX: "1000",
      },
    },
    {
      name: "veil-keeper",
      cwd: "/home/azureuser/veil",
      script: "npm",
      args: "run keeper",
      env_file: "/home/azureuser/veil/.env",
      env: {
        NODE_ENV: "production",
        KEEPER_INTERVAL_MS: "120000",
      },
    },
  ],
};
