import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResoponse} from "../utils/ApiResponse.js"
import Messages from "../models/Message.model.js"

export const getConversationMessages = asyncHandler( async(req,res)=>{
    const {coverstaionId } = req.params;

    const messages = await Messages.find({conversationId:coverstaionId}).sort({ createdAt:1});

    if (!messages || messages.length === 0) {
        return res.status(200).json(new ApiResoponse(200, [], "No messages available"));
    }

    return res.status(200).json(new ApiResoponse(200, messages, "Messages fetched successfully"));
});

// src/controllers/message.controller.js

export const markAllAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        // Update ALL messages in this conversation where I am NOT in the 'seen' array
        await Messages.updateMany(
            { 
                conversationId: conversationId, 
                "seen.userId": { $ne: userId } // Only update if I haven't seen it
            },
            {
                $push: {
                    seen: {
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