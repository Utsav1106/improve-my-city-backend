import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const conversationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    messages: [messageSchema],
    context: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});

// Auto-update updatedAt on save
conversationSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Clean up old conversations (older than 7 days)
conversationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const conversationModel = mongoose.model('Conversation', conversationSchema);

export default conversationModel;
