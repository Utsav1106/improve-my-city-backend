import cors from 'cors'
import express, { Express } from 'express'
import helmet from 'helmet'
import rateLimiter from './middlewares/rateLimiter'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import issueRoutes from './routes/issue'
import chatbotRoutes from './routes/chatbot'

const app: Express = express()
app.set('trust proxy', true)

app.use(cors())
app.use(helmet())
app.use(express.json({ limit: "50mb" }))
app.use(rateLimiter)

app.use('/uploads', (_, res, next) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static('uploads'));

const v1Router = express.Router()
v1Router.use('/auth', authRoutes)
v1Router.use('/users', userRoutes)
v1Router.use('/issues', issueRoutes)
v1Router.use('/chatbot', chatbotRoutes)
app.use('/v1', v1Router)

export { app }