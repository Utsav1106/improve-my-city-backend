import { Schema, model } from 'mongoose'
import { User } from '@/types/user'

const userSchema = new Schema<User>({
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    data: { type: Object, required: true }
})
const userModel = model<User>('User', userSchema)

export default userModel