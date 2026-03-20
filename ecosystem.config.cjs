module.exports = {
  apps: [
    {
      name: "tradingflow-backend",
      cwd: "./apps/backend",
      script: "index.ts",
      interpreter: "bun",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "tradingflow-executor",
      cwd: "./apps/executor",
      script: "index.ts",
      interpreter: "bun",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
