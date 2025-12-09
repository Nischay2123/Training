import {asyncHandler} from "../utils/asyncHandler.js"
import Conversations from "../models/Conversation.model.js"
import Messages from "../models/Message.model.js"
import {ApiResoponse }from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"


// to get or create a new one-to-one convo
export const getChat = asyncHandler(async (req, res) => {
    const { targetId } = req.body;
    const userId = req.user._id;

    let conversation = await Conversations.findOne({
        participants: { $all: [userId, targetId] },
        name: "One-to-One"
    }).populate("participants", "firstName lastName userName photo email");

    if (conversation) {
        const unreadCount = await Messages.countDocuments({
            conversationId: conversation._id,
            sender: { $ne: userId },
            "seen.userId": { $ne: userId }
        });

        return res.status(200).json(
            new ApiResoponse(200, { ...conversation.toObject(), unreadCount }, "Conversation already exists")
        );
    }

    const newChat = await Conversations.create({
        participants: [userId, targetId],
        name: "One-to-One"
    });

    const populated = await Conversations.findById(newChat._id)
        .populate("participants", "firstName lastName userName photo email");

    return res.status(201).json(
        new ApiResoponse(201, populated, "Conversation created")
    );
});

// to get the user all conversations
export const getAllConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const conversations = await Conversations.find({
        participants: userId
    }).populate("participants", "firstName lastName userName photo email").sort({ updatedAt: -1 });

    const withUnread = await Promise.all(
        conversations.map(async convo => {
            const unread = await Messages.countDocuments({
                conversationId: convo._id,
                sender: { $ne: userId },
                "seen.userId": { $ne: userId }
            });

            return { ...convo.toObject(), unreadCount: unread };
        })
    );

    return res.status(200).json(
        new ApiResoponse(200, withUnread, "Conversations fetched")
    );
});

// to create new group 
export const createGroup = asyncHandler(async (req, res) => {
    const { name, participants } = req.body;

    const newGroup = await Conversations.create({
        name,
        admin: req.user._id,
        participants: [req.user._id, ...participants]
    });

    const populated = await Conversations.findById(newGroup._id)
        .populate("participants", "firstName lastName userName photo email");

    return res.status(201).json(
        new ApiResoponse(201, populated, "Group created")
    );
});

// to get the user's all group 
export const getAllGroups = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;

    const groups = await Conversations.find({
        $and: [
            { 
                "participants.userId": currentUserId 
            },
            {
                $or: [
                    { "participants.2": { $exists: true } },
                    { name: { $ne: "One-to-One" } }
                ]
            }
        ]
    }).sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResoponse(200, groups, "Group chats retrieved successfully")
    );
});

// to search a group by name (not used)
export const getGroupByName = asyncHandler(async (req, res) => {
    const { name } = req.query;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Group name is required");
    }

    const currentUserId = req.user._id;
    console.log(name, currentUserId);
    

    const groups = await Conversations.find({
        $and: [
            { 
                "participants.userId": currentUserId 
            },
            { 
                name: { $regex: name } 
            },
            { 
                name: { $ne: "One-to-One" } 
            }
        ]
    });
    console.log(groups);
    

    if (groups.length === 0) {
        return res.status(200).json(
            new ApiResoponse(200, [], "No groups found with that name")
        );
    }

    return res.status(200).json(
        new ApiResoponse(200, groups, "Groups retrieved successfully")
    );
});

// to add the member in the group (only admin is allowed , not used)
export const addMembersToGroup = asyncHandler(async (req, res) => {
    const { newMemberIds } = req.body;
    const group = req.group;

    if (!newMemberIds || !Array.isArray(newMemberIds) || newMemberIds.length === 0) {
        throw new ApiError(400, "Please provide valid member IDs to add");
    }

    const existingIds = new Set(group.participants.map(id => id.toString()));

    const validToAdd = newMemberIds.filter(id => !existingIds.has(id));

    if (validToAdd.length === 0) {
        throw new ApiError(400, "All selected users are already in the group");
    }

    group.participants.push(...validToAdd);

    await group.save();

    const populated = await Conversations.findById(group._id)
        .populate("participants", "firstName lastName userName photo email");

    return res.status(200).json(
        new ApiResoponse(200, populated, "Members added successfully")
    );
});

// to remove the member (only admin is allowed, not used)
export const removeMemberFromGroup = asyncHandler(async (req, res) => {
    const { memberIdToRemove } = req.body;
    const group = req.group;

    if (!memberIdToRemove) {
        throw new ApiError(400, "Member ID is required");
    }

    if (memberIdToRemove.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot remove yourself. Use 'Leave Group' instead.");
    }

    group.participants = group.participants.filter(
        id => id.toString() !== memberIdToRemove
    );

    await group.save();

    const populated = await Conversations.findById(group._id)
        .populate("participants", "firstName lastName userName photo email");

    return res.status(200).json(
        new ApiResoponse(200, populated, "Member removed successfully")
    );
});

//  to delete the group (only admin is allowed, not used)
export const deleteGroup = asyncHandler(async (req, res) => {
    const group = req.group; 

    await group.deleteOne(); 

    return res.status(200).json(
        new ApiResoponse(200, {}, "Group deleted successfully")
    );
});

//  to exit/leave the group by the user (not used)
export const leaveGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Conversations.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    if (group.admin.toString() === userId.toString()) {

        const remaining = group.participants.filter(
            id => id.toString() !== userId.toString()
        );

        if (remaining.length === 0) {
            await Conversations.findByIdAndDelete(groupId);
            return res.status(200).json(
                new ApiResoponse(200, {}, "Group deleted (Last member left)")
            );
        }

        group.admin = remaining[0];
    }

    group.participants = group.participants.filter(
        id => id.toString() !== userId.toString()
    );

    await group.save();

    const populated = await Conversations.findById(group._id)
        .populate("participants", "firstName lastName userName photo email");

    return res.status(200).json(
        new ApiResoponse(200, populated, "You have left the group")
    );
});
