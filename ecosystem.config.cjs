module.exports = {
  apps: [
    {
      name: "opendatacompare",
      cwd: "/home/deploy/opendatacompare",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
