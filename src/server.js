const app = require('./app');
const config = require('./config');
const { testConnection } = require('./config/database');
const { initCronJobs } = require('./cron');

const startServer = async () => {
  // Test database connection
  await testConnection();

  // Start Express server
  const server = app.listen(config.port, () => {
    console.log(`\n🚀 Plotlynn API Server`);
    console.log(`   Environment : ${config.env}`);
    console.log(`   Port        : ${config.port}`);
    console.log(`   URL         : http://localhost:${config.port}`);
    console.log(`   Health      : http://localhost:${config.port}/api/health\n`);
  });

  // Initialize cron jobs
  initCronJobs();

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n⚡ ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('👋 Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle unhandled rejections
  process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
};

startServer();
