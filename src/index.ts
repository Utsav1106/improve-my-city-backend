import { app } from "@/app";
import { connectDB } from "@/config/db";
import { MONGO_URI, PORT } from "@/config/env";
import logger from "@/utils/logger";

const startServer = async () => {
  try {
    await connectDB(MONGO_URI);

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port http://localhost:${PORT}`);
    });

    const onCloseSignal = () => {
      logger.info('SIGINT received, shutting down');
      server.close(() => {
        logger.info('Server closed');
        process.exit();
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGINT', onCloseSignal);
    process.on('SIGTERM', onCloseSignal);
  } catch (error) {
    console.error(error)
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();