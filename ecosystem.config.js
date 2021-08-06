module.exports = {
  apps: [
    {
      name: "socket-chat",
      script: "./server.js",
      instances: "2",
      exec_mode: "cluster",
      watch: "."
    },
  ],
};
