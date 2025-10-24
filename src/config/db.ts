import logger from "@/utils/logger"
import mongoose from "mongoose"

export const connectDB = async (MONGO_URI: string) => {
    await mongoose.connect(MONGO_URI)
        .then(() => {
            logger.info('Connected to MongoDB')
        })
        .catch((error) => {
            logger.error('Failed to connect to MongoDB', { error })
            process.exit(1)
        })
}