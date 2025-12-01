import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResoponse} from "../utils/ApiResponse.js"
import Messages from "../models/Message.model.js"
import mongoose from "mongoose"; 

export const getConversationMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { limit = 20, before } = req.query; 

    const query = { conversationId: conversationId };

    if (before && before !== "undefined") {
        query.createdAt = { $lt: new Date(before) }; 
    }

    const messages = await Messages.find(query)
        .sort({ createdAt: -1 }) 
        .limit(parseInt(limit));

    const sortedMessages = messages.reverse();

    return res.status(200).json(
        new ApiResoponse(200, sortedMessages, "Messages fetched successfully")
    );
});



export const markAllAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        
        const userId = req.user._id;

        await Messages.updateMany(
            { 
                conversationId: conversationId, 
                "seen.userId": { $ne: userId } 
            },
            {
                $push: {
                    seen: {
                        name: req.user.userName,
                        userId: userId,
                        seenAt: new Date()
                    }
                }
            }
        );

        return res.status(200).json({ success: true, message: "Messages marked as seen" });
    } catch (error) {
        console.error("Error marking messages as seen:", error);
        return res.status(500).json({ error: error.message });
    }
};