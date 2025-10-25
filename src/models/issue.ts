import { Schema, model } from 'mongoose'
import { Issue } from '@/types/issue'

const issueSchema = new Schema<Issue>({
    status: { 
        type: String, 
        required: true, 
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    uploadUrls: { type: [String], default: [] },
    category: { type: String, required: true, index: true },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: { type: String, required: true }
    },
    upvotes: { type: Number, default: 0 },
    upvotedBy: { type: [String], default: [] },
    resolutionMessage: { type: String },
    resolutionUploadUrls: { type: [String], default: [] },
    resolvedAt: { type: Number },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true }
})

issueSchema.index({ 'location.latitude': 1, 'location.longitude': 1 })

const issueModel = model<Issue>('Issue', issueSchema)

export default issueModel