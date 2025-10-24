import { output } from '@/utils/helpers';
import { Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const rateLimiter = rateLimit({
    legacyHeaders: true,
    limit: 300,
    message: output(false, 'Too many requests, please try again later.', { rateLimited: true }),
    standardHeaders: true,
    windowMs: 60000,
    keyGenerator: (req: Request) => {
        return ipKeyGenerator(req.ip as string);
    }
})

export default rateLimiter