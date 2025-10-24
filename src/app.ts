import cors from 'cors'
import express, { Express } from 'express'
import helmet from 'helmet'
import rateLimiter from './middlewares/rateLimiter'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'

const app: Express = express()
app.set('trust proxy', true)

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(rateLimiter)

const v1Router = express.Router()
v1Router.use('/auth', authRoutes)
v1Router.use('/users', userRoutes)
app.use('/v1', v1Router)

export { app }