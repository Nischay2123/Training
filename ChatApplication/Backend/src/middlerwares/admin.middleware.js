import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Conversations from "../models/Conversation.model.js";


// to verify that the user is admin of the group or not 
export const verifyGroupAdmin = asyncHandler(async (req, res, next) => {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Conversations.findById(groupId);

    if (!group) {
        throw new ApiError(404, "Group conversation not found");
    }

    if (!group.admin || group.admin.toString() !== userId.toString()) {
        throw new ApiError(403, "Access Denied: Only the group admin can perform this action");
    }

    req.group = group;
    
    next();
});


