import {asyncHandler} from "../utils/asyncHandler.js"
import Conversations from "../models/Conversation.model.js"
import Users from "../models/User.model.js"
import Messages from "../models/Message.model.js"
import {ApiResoponse }from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import mongoose from "mongoose"

export const getChat = asyncHandler(async(req, res) => {
    const { targetId } = req.body;
    
    const userId = req.user._id;

    // 1. Check if conversation already exists
    const conversation = await Conversations.findOne({
        $and: [
            { "participants.userId": { $all: [userId, targetId] } },
            { "participants": { $size: 2 } }
        ]
    });

    if (conversation) {
        return res.status(200).json(
            new ApiResoponse(200, conversation, "Conversation already exists")
        );
    }

    // 2. Prepare new conversation data
    const targetUser = await Users.findById(targetId);
    if (!targetUser) throw new ApiError(401, "User not found");

    const participants = [
        {
            userId,
            photo: req.user.photo,
            name: req.user.userName
        },
        {
            userId: targetUser._id,
            photo: targetUser.photo,
            name: targetUser.userName
        }
    ];

    // 🔴 YOU MISSED THIS LINE BELOW: 
    const newConverstion = await Conversations.create({
        participants: participants,
    });

    // 3. Now Populate it (This part was correct in your snippet, but needs the ID from above)
    const populatedConversation = await Conversations.findById(newConverstion._id)
        .populate("participants.userId", "firstName lastName userName photo email");

    if (!populatedConversation) {
        throw new ApiError(500, "Failed to create conversation");
    }

    // 4. Format the response to match your other controllers
    const convoObj = populatedConversation.toObject();
    const formattedParticipants = convoObj.participants.map((p) => {
        const userDetails = p.userId || {};
        return {
            _id: userDetails._id,
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            email: userDetails.email,
            userName: userDetails.userName,
            name: userDetails.userName, 
            photo: userDetails.photo
        };
    });

    convoObj.participants = formattedParticipants;

    return res.status(201).json(new ApiResoponse(201, convoObj, "Conversation Created"));
});


export const getAllConversations = asyncHandler(async (req, res) => {
    const currentUserId = new mongoose.Types.ObjectId(String(req.user._id));

    const conversations = await Conversations.find({
        "participants.userId": currentUserId
    })
    .populate("participants.userId", "firstName lastName userName photo email") 
    .sort({ updatedAt: -1 });

    if (!conversations || conversations.length === 0) {
        return res.status(200).json(new ApiResoponse(200, [], "No conversations found"));
    }

    const conversationsWithCount = await Promise.all(
        conversations.map(async (convo) => {
            const convoObj = convo.toObject(); 
            const formattedParticipants = convoObj.participants.map((p) => {
                
                const userDetails = p.userId || {}; 
                
                return {
                    _id: userDetails._id,             
                    firstName: userDetails.firstName, 
                    lastName: userDetails.lastName,
                    email: userDetails.email,
                    userName: userDetails.userName,
                    name: userDetails.name, 
                    photo: userDetails.photo 
                };
            });

            const unreadCount = await Messages.countDocuments({
                conversationId: convo._id,
                sender: { $ne: currentUserId }, 
                "seen.userId": { $ne: currentUserId }
            });

            return {
                ...convoObj,
                participants: formattedParticipants, 
                unreadCount: unreadCount
            };
        })
    );

    return res.status(200).json(
        new ApiResoponse(200, conversationsWithCount, "Conversations retrieved successfully")
    );
});

export const createGroup = asyncHandler(async (req, res) => {
    const { name, participants } = req.body; 

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Group name is required");
    }
    
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
        throw new ApiError(400, "At least one participant is required to form a group");
    }

    const members = await Users.find({ 
        _id: { $in: participants } 
    }).select("userName photo _id");


    const formattedParticipants = members.map((member) => ({
        userId: member._id,
        name: member.userName, 
        photo: member.photo
    }));

    formattedParticipants.unshift({
        userId: req.user._id,
        name: req.user.userName,
        photo: req.user.photo
    });

    const newGroup = await Conversations.create({
        name: name,
        admin: req.user._id,
        participants: formattedParticipants,
    });

    return res.status(201).json(
        new ApiResoponse(201, newGroup, "Group created successfully")
    );
});


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

export const addMembersToGroup = asyncHandler(async (req, res) => {
    const { newMemberIds } = req.body; 
    const group = req.group; 

    if (!newMemberIds || !Array.isArray(newMemberIds) || newMemberIds.length === 0) {
        throw new ApiError(400, "Please provide valid member IDs to add");
    }

    const newMembers = await Users.find({ _id: { $in: newMemberIds } }).select("userName photo _id");
    console.log(newMembers);
    

    if (newMembers.length === 0) throw new ApiError(400, "Users not found");

    const existingIds = group.participants.map(p => p.userId.toString());
    
    const validNewMembers = newMembers.filter(
        user => !existingIds.includes(user._id.toString())
    );

    if (validNewMembers.length === 0) {
        throw new ApiError(400, "All selected users are already in the group");
    }

    const membersToAdd = validNewMembers.map(user => ({
        userId: user._id,
        name: user.userName,
        photo: user.photo
    }));

    group.participants.push(...membersToAdd);
    await group.save(); 

    return res.status(200).json(
        new ApiResoponse(200, group, "Members added successfully")
    );
});


export const removeMemberFromGroup = asyncHandler(async (req, res) => {
    const { memberIdToRemove } = req.body;
    const group = req.group; 

    if (memberIdToRemove === req.user._id.toString()) {
        throw new ApiError(400, "You cannot remove yourself. Use 'Leave Group' instead.");
    }

   console.log(group);
   
    group.participants = group.participants.filter(
        p => p.userId.toString() !== memberIdToRemove
    );

    await group.save();

    return res.status(200).json(
        new ApiResoponse(200, group, "Member removed successfully")
    );
});


export const deleteGroup = asyncHandler(async (req, res) => {
    const group = req.group; 

    await group.deleteOne(); 

    return res.status(200).json(
        new ApiResoponse(200, {}, "Group deleted successfully")
    );
});


export const leaveGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const currentUserId = req.user._id;

    const group = await Conversations.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() === currentUserId.toString()) {
        const remainingMembers = group.participants.filter(
            p => p.userId.toString() !== currentUserId.toString()
        );

        if (remainingMembers.length === 0) {
            await Conversations.findByIdAndDelete(groupId);
            return res.status(200).json(new ApiResoponse(200, {}, "Group deleted (Last member left)"));
        }

        group.admin = remainingMembers[0].userId;
    }

    group.participants = group.participants.filter(
        p => p.userId.toString() !== currentUserId.toString()
    );

    await group.save();

    return res.status(200).json(
        new ApiResoponse(200, group, "You have left the group")
    );
});
