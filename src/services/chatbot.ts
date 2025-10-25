import { ChatGroq } from "@langchain/groq";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { z } from "zod";
import { getIssues } from "./issue";
import issueModel from "@/models/issue";
import conversationModel from "@/models/conversation";
import { GROQ_API_KEY } from "@/config/env";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// Initialize the LLM
const llm = new ChatGroq({
    model: "moonshotai/kimi-k2-instruct",
    temperature: 0.2,
    apiKey: GROQ_API_KEY,
});

// Tool 1: Get user's own issues
const getUserIssuesToolSchema = z.object({
    userId: z.string().describe("The ID of the user whose issues to retrieve"),
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional().describe("Filter by issue status"),
});

const getUserIssuesTool = new DynamicStructuredTool({
    name: "get_user_issues",
    description: "Retrieve all issues reported by a specific user. Useful when user asks about 'my issues', 'my complaints', or 'my reports'. Can filter by status (open, in_progress, resolved, closed).",
    schema: getUserIssuesToolSchema,
    func: async ({ userId, status }) => {
        try {
            const result = await getIssues({
                userId,
                status,
                limit: 100,
            });
            
            if (result.data.length === 0) {
                return "The user hasn't reported any issues yet.";
            }

            const summary = {
                total: result.total,
                issues: result.data.map(issue => ({
                    id: issue._id,
                    title: issue.title,
                    category: issue.category,
                    status: issue.status,
                    upvotes: issue.upvotes || 0,
                    createdAt: new Date(issue.createdAt).toLocaleDateString(),
                    location: issue.location.address,
                }))
            };

            return JSON.stringify(summary, null, 2);
        } catch (error: any) {
            return `Error fetching user issues: ${error.message}`;
        }
    },
});

// Tool 2: Get all issues with filters
const getAllIssuesToolSchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional().describe("Filter by issue status"),
    category: z.string().optional().describe("Filter by issue category"),
    page: z.number().optional().default(1).describe("Page number for pagination"),
    limit: z.number().optional().default(20).describe("Number of issues per page"),
    sortBy: z.enum(['createdAt', 'upvotes']).optional().default('createdAt').describe("Field to sort by"),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc').describe("Sort order"),
});

const getAllIssuesTool = new DynamicStructuredTool({
    name: "get_all_issues",
    description: "Retrieve issues with filters, pagination, and sorting (createdAt, upvotes). Useful for dashboard-like views.",
    schema: getAllIssuesToolSchema,
    func: async ({ status, category, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' }) => {
        try {
            const result = await getIssues({
                status,
                category,
                page,
                limit,
                sortBy,
                sortOrder,
            });

            if (result.data.length === 0) {
                return "No issues found matching the criteria.";
            }

            const summary = {
                total: result.total,
                totalPages: result.totalPages,
                issues: result.data.map(issue => ({
                    id: issue._id,
                    title: issue.title,
                    category: issue.category,
                    status: issue.status,
                    upvotes: issue.upvotes || 0,
                    reportedBy: issue.reportedByName,
                    createdAt: new Date(issue.createdAt).toLocaleDateString(),
                    location: issue.location.address,
                }))
            };

            return JSON.stringify(summary, null, 2);
        } catch (error: any) {
            return `Error fetching all issues: ${error.message}`;
        }
    },
});

// Tool 3: Search issues near a location
const getNearbyIssuesToolSchema = z.object({
    latitude: z.number().describe("Latitude coordinate of the location"),
    longitude: z.number().describe("Longitude coordinate of the location"),
    radiusKm: z.number().optional().default(5).describe("Search radius in kilometers (default: 5km)"),
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional().describe("Filter by issue status"),
    limit: z.number().optional().default(20).describe("Number of issues to return"),
});

const getNearbyIssuesTool = new DynamicStructuredTool({
    name: "search_nearby_issues",
    description: "Search for issues near a specific location. Useful when user asks about 'issues near me', 'nearby problems', or 'local issues'. Requires latitude and longitude coordinates.",
    schema: getNearbyIssuesToolSchema,
    func: async ({ latitude, longitude, radiusKm = 5, status, limit = 20 }) => {
        try {
            const result = await getIssues({
                latitude,
                longitude,
                radiusKm,
                status,
                limit,
            });

            if (result.data.length === 0) {
                return `No issues found within ${radiusKm}km of the specified location.`;
            }

            const summary = {
                searchRadius: `${radiusKm}km`,
                total: result.total,
                issues: result.data.map(issue => ({
                    id: issue._id,
                    title: issue.title,
                    category: issue.category,
                    status: issue.status,
                    distance: issue.distance ? `${issue.distance.toFixed(2)}km` : 'N/A',
                    upvotes: issue.upvotes || 0,
                    reportedBy: issue.reportedByName,
                    location: issue.location.address,
                    createdAt: new Date(issue.createdAt).toLocaleDateString(),
                }))
            };

            return JSON.stringify(summary, null, 2);
        } catch (error: any) {
            return `Error searching nearby issues: ${error.message}`;
        }
    },
});

// Tool 4: Get popular issues (most upvoted)
const getPopularIssuesToolSchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional().describe("Filter by issue status"),
});

const getPopularIssuesTool = new DynamicStructuredTool({
    name: "get_popular_issues",
    description: "Get the most popular (most upvoted) issues. Useful when user asks about 'popular issues', 'trending issues', 'most upvoted', or 'top issues'.",
    schema: getPopularIssuesToolSchema,
    func: async ({ status }) => {
        try {
            const query: any = {};
            if (status) {
                query.status = status;
            }

            const issues = await issueModel.find(query)
                .sort({ upvotes: -1 })
                .limit(10)
                .lean();

            if (issues.length === 0) {
                return "No popular issues found.";
            }

            const summary = {
                total: issues.length,
                issues: issues.map(issue => ({
                    id: issue._id,
                    title: issue.title,
                    category: issue.category,
                    status: issue.status,
                    upvotes: issue.upvotes || 0,
                    location: issue.location.address,
                    createdAt: new Date(issue.createdAt).toLocaleDateString(),
                }))
            };
console.log(summary);
            return JSON.stringify(summary, null, 2);
        } catch (error: any) {
            return `Error fetching popular issues: ${error.message}`;
        }
    },
});

// Tool 5: Get issue statistics
const getIssueStatsToolSchema = z.object({
    userId: z.string().optional().describe("If provided, get stats for a specific user's issues only"),
});

const getIssueStatsTool = new DynamicStructuredTool({
    name: "get_issue_statistics",
    description: "Get comprehensive statistics about issues including counts by status, category breakdown, and trends. If userId is provided, returns stats for that specific user only.",
    schema: getIssueStatsToolSchema,
    func: async ({ userId }) => {
        try {
            const query: any = userId ? { userId } : {};

            const [
                totalCount,
                openCount,
                inProgressCount,
                resolvedCount,
                closedCount,
                allIssues
            ] = await Promise.all([
                issueModel.countDocuments(query),
                issueModel.countDocuments({ ...query, status: 'open' }),
                issueModel.countDocuments({ ...query, status: 'in_progress' }),
                issueModel.countDocuments({ ...query, status: 'resolved' }),
                issueModel.countDocuments({ ...query, status: 'closed' }),
                issueModel.find(query).select('category').lean()
            ]);

            // Category breakdown
            const categoryMap: Record<string, number> = {};
            allIssues.forEach(issue => {
                categoryMap[issue.category] = (categoryMap[issue.category] || 0) + 1;
            });

            const stats = {
                scope: userId ? "user" : "community",
                total: totalCount,
                byStatus: {
                    open: openCount,
                    in_progress: inProgressCount,
                    resolved: resolvedCount,
                    closed: closedCount,
                },
                byCategory: categoryMap,
                resolutionRate: totalCount > 0 ? `${((resolvedCount / totalCount) * 100).toFixed(1)}%` : "0%",
            };

            return JSON.stringify(stats, null, 2);
        } catch (error: any) {
            return `Error fetching issue statistics: ${error.message}`;
        }
    },
});

// Tool 6: Get issue details by ID
const getIssueDetailToolSchema = z.object({
    issueId: z.string().describe("The ID of the issue to retrieve details for"),
});

const getIssueDetailTool = new DynamicStructuredTool({
    name: "get_issue_details",
    description: "Get detailed information about a specific issue by ID. Useful when user asks about a specific issue or wants more details.",
    schema: getIssueDetailToolSchema,
    func: async ({ issueId }) => {
        try {
            const issue = await issueModel.findById(issueId).lean();
            
            if (!issue) {
                return "Issue not found.";
            }

            const details = {
                id: issue._id,
                title: issue.title,
                description: issue.description,
                category: issue.category,
                status: issue.status,
                upvotes: issue.upvotes || 0,
                location: issue.location,
                uploadUrls: issue.uploadUrls,
                createdAt: new Date(issue.createdAt).toLocaleString(),
                updatedAt: new Date(issue.updatedAt).toLocaleString(),
                resolvedAt: issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleString() : null,
                resolutionMessage: issue.resolutionMessage,
            };

            return JSON.stringify(details, null, 2);
        } catch (error: any) {
            return `Error fetching issue details: ${error.message}`;
        }
    },
});

// Tool 7: Trigger issue creation flow
const triggerIssueCreationSchema = z.object({});

// We'll create a factory function for this tool that accepts the conversation
const createTriggerIssueCreationTool = (conversation: any) => {
    return new DynamicStructuredTool({
        name: "trigger_issue_creation_form",
        description: "Use this ONLY when user explicitly wants to report, create, or submit a new civic issue (e.g., 'report a pothole', 'create an issue', 'submit a complaint', 'I want to report', etc.). This opens the issue creation form.",
        schema: triggerIssueCreationSchema,
        func: async () => {
            // Set the context when this tool is invoked
            conversation.context.set('creatingIssue', true);
            
            return "FORM_TRIGGER_MARKER";
        },
    });
};

// Create the agent with all tools
const createToolsArray = (conversation: any) => [
    getUserIssuesTool,
    getAllIssuesTool,
    getNearbyIssuesTool,
    getPopularIssuesTool,
    getIssueStatsTool,
    getIssueDetailTool,
    createTriggerIssueCreationTool(conversation),
];

const systemPrompt = `You are the City Assistant for the "Improve My City" platform.

CRITICAL RULES:
1. When user says "report issue", "create issue", "submit complaint", "I want to report", "log an issue" or similar phrases about CREATING/REPORTING a NEW issue, you MUST call the trigger_issue_creation_form tool immediately.
2. When user asks about EXISTING issues (my issues, all issues, nearby issues, etc.), use the appropriate query tools instead.
3. Answer queries briefly and directly. Use bullet points only when listing multiple results.
4. Use the available tools for facts (issues, stats, details). If a tool doesn't cover it, say you don't know.
5. Only talk about real features: checking issues, viewing community issues, nearby search, popular issues, statistics, and reporting new issues.

DON'T:
- Don't claim to open windows, buttons, maps, or forms in your responses.
- Don't invent data or actions. If unsure, ask a short clarifying question.
- Don't describe what you're doing when calling trigger_issue_creation_form - just call it.

Navigation hints (for reference when asked):
- Dashboard: see all issues with filters (Home)
- Report Issue: /report — create a new report
- My Issues: /my-issues — your reports
- Resolved: /resolved — finished issues
- Admin: /admin (admins only)

User context variables you can reference: userId and userName.`;

// Helper function to get or create conversation
async function getOrCreateConversation(userId: string) {
    let conversation = await conversationModel.findOne({
        userId,
        isActive: true,
    }).sort({ updatedAt: -1 });

    if (!conversation) {
        conversation = await conversationModel.create({
            userId,
            messages: [],
            context: {},
        });
    }

    return conversation;
}

// Helper function to summarize old messages to save tokens
function summarizeMessages(messages: any[]): BaseMessage[] {
    // Keep only last 10 messages for context
    const recentMessages = messages.slice(-10);
    
    return recentMessages.map(msg => {
        if (msg.role === 'user') {
            return new HumanMessage(msg.content);
        } else {
            return new AIMessage(msg.content);
        }
    });
}

// Helper function to extract structured data from conversation context
function getContextFromConversation(conversation: any): string {
    const context = conversation.context || new Map();
    const contextObj = context instanceof Map ? Object.fromEntries(context) : context;
    
    if (Object.keys(contextObj).length === 0) {
        return "";
    }

    return `\n\nCurrent conversation context: ${JSON.stringify(contextObj)}`;
}


export const processChatMessage = async (message: string, userId: string, userName?: string): Promise<string> => {
    try {
        if (!GROQ_API_KEY) {
            return "I'm currently offline. Please check your issues in the dashboard or contact support.";
        }

        const conversation = await getOrCreateConversation(userId);

        conversation.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date(),
        });

        const messageHistory = summarizeMessages(conversation.messages);

        const contextInfo = getContextFromConversation(conversation);
        const contextualMessage = `User ID: ${userId}${userName ? `, User Name: ${userName}` : ''}${contextInfo}\n\nUser Question: ${message}`;

        const tools = createToolsArray(conversation);

        const agent = createAgent({
            model: llm,
            tools,
            systemPrompt,
        });
        
        // Create messages array with history
        const allMessages: BaseMessage[] = [
            ...messageHistory.slice(0, -1), // All previous messages except the last user message
            new HumanMessage(contextualMessage), // Current message with full context
        ];

        const result = await agent.invoke({ messages: allMessages });

        // Extract the last message from the agent response
        const messages = result.messages;
        const lastMessage = messages[messages.length - 1];
        
        let responseText = "I'm not sure how to help with that. Could you please rephrase your question?";
        let shouldTriggerForm = false;
        
        // Check if the trigger_issue_creation_form tool was called
        for (const msg of messages) {
            if ('tool_calls' in msg && Array.isArray(msg.tool_calls)) {
                for (const toolCall of msg.tool_calls) {
                    if (toolCall.name === 'trigger_issue_creation_form') {
                        shouldTriggerForm = true;
                        break;
                    }
                }
            }
            if (shouldTriggerForm) break;
        }

        // If form trigger detected, check for the marker in tool responses
        if (shouldTriggerForm) {
            for (const msg of messages) {
                if ('content' in msg && typeof msg.content === 'string') {
                    if (msg.content.includes('FORM_TRIGGER_MARKER')) {
                        // Return special response that frontend will detect
                        responseText = "__OPEN_ISSUE_FORM__";
                        break;
                    }
                }
            }
            // Fallback if marker not found but tool was called
            if (responseText !== "__OPEN_ISSUE_FORM__") {
                responseText = "__OPEN_ISSUE_FORM__";
            }
        } else if (lastMessage && 'content' in lastMessage && typeof lastMessage.content === 'string') {
            responseText = lastMessage.content;
        }

        conversation.messages.push({
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
        });

        // Save conversation (limit message history to last 50 to save DB space)
        if (conversation.messages.length > 50) {
            while (conversation.messages.length > 50) {
                conversation.messages.shift();
            }
        }
        
        await conversation.save();

        return responseText;
    } catch (error: any) {
        console.error("Chatbot error:", error);
        return "I encountered an error processing your request. Please try again or contact support if the issue persists.";
    }
};
