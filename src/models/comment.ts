import { Schema, model } from 'mongoose'
import { Comment } from '@/types/comment'

const commentSchema = new Schema<Comment>({
    userId: { type: String, required: true, index: true },
    issueId: { type: String, required: true, index: true },
    comment: { type: String, required: true },
    createdAt: { type: Number, required: true },
    uploadUrls: { type: [String], default: [] },
    isAdmin: { type: Boolean, default: false }
})

const commentModel = model<Comment>('Comment', commentSchema)

export default commentModel
