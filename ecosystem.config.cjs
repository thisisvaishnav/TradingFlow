module.exports = {
  apps: [
    {
      name: "tradingflow-backend",
      cwd: "./apps/backend",
      script: "index.ts",
      interpreter: "bun",
      interpreter_args: "--env-file ../../.env",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "tradingflow-executor",
      cwd: "./apps/executor",
      script: "index.ts",
      interpreter: "bun",
      interpreter_args: "--env-file ../../.env",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
