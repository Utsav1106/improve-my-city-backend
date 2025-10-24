import { ValidationError } from '@/utils/errors'
import logger from '@/utils/logger'
import 'dotenv/config'

const required = (key: string, value?: string): string => {
    if (!value) {
        const errMessage = `Environment variable "${key}" is missing or invalid.`
        logger.error(errMessage)
        throw new ValidationError(errMessage)
    }
    return value
}

export const PORT = process.env.PORT || '8095'
export const MONGO_URI = required('MONGO_URI', process.env.MONGO_URI)
export const JWT_SECRET_KEY = required('JWT_SECRET_KEY', process.env.JWT_SECRET_KEY)