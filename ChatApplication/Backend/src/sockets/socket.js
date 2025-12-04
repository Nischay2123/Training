import { Server } from "socket.io";
import { socketAuthenticator } from "../middlerwares/auth.middleware.js"; 
import Messages from "../models/Message.model.js"; 
import Conversations from "../models/Conversation.model.js";
import mongoose from "mongoose";

const userSocketIDs = new Map();

export const initializeSocket = (server, corsOptions) => {
    const io = new Server(server, {
        cors: corsOptions
    });

    io.use(async(socket, next) => {
        await socketAuthenticator(socket, next);
    });
    
    io.on("connection", (socket) => {
        const user = socket.user;
        const userId = user._id.toString();

        userSocketIDs.set(userId, socket.id);
        socket.join(userId);
        // const getSocketIds = (members) => {
        //     if (!members || !Array.isArray(members)) return [];
        //     return members
        //         .map((member) => {
        //             const id = member._id ? member._id.toString() : member.toString();
        //             return userSocketIDs.get(id);
        //         })
        //         .filter((socketId) => socketId);
        // };

        socket.on("JOIN_CONVERSATION", ({ conversationId }) => {
            socket.join(conversationId);
        });

        socket.on("SEND_MESSAGE", async ({ conversationId, text, members, tempId }, callback) => {
            try {
                const existingMessage = await Messages.findOne({ tempId: tempId });

                if (existingMessage) {
                    console.log(`Duplicate detected (${tempId}). Returning existing message.`);
                    if (callback) {
                        callback({
                            success: true,
                            serverId: existingMessage._id,
                            savedMessage: existingMessage
                        });
                    }
                    return;
                }

                const explicitTime = new Date();

                const savedMessage = await Messages.create({
                    conversationId,
                    text,
                    sender: userId,
                    tempId,
                    seen: [{
                        userId: userId,
                        name: user.userName,
                        seenAt:explicitTime
                    }],
                    createdAt: explicitTime,
                    updatedAt: explicitTime,
                });

                await Conversations.findByIdAndUpdate(
                    conversationId,
                    {
                        lastMessage: {
                            text,
                            sender: userId,
                            createdAt: explicitTime,
                            updatedAt: explicitTime
                        },
                        updatedAt: explicitTime
                    },
                    { new: true }
                );

                members.forEach((memberId) => {
                    const memberRoom = memberId.toString();
                    io.to(memberRoom).emit("NEW_MESSAGE", {
                        tempId,
                        message: savedMessage
                    });
                });

                if (callback) {
                    callback({
                        success: true,
                        serverId: savedMessage._id,
                        savedMessage: savedMessage
                    });
                }

            } catch (error) {
                console.error("DB Error:", error);
                if (callback) callback({ success: false, error: error.message });
            }
        });

        socket.on("MESSAGE_SEEN", async ({ conversationId, messageId }) => {
            try {
                const userObjectId = new mongoose.Types.ObjectId(String(userId));

                const updatedMessage = await Messages.findOneAndUpdate(
                    {
                        _id: messageId,
                        "seen.userId": { $ne: userObjectId }
                    },
                    {
                        $push: {
                            seen: {
                                userId: userObjectId,
                                name: user.userName,
                                seenAt: new Date(),
                            },
                        },
                    },
                    { new: true }
                );

                if (updatedMessage) {
                    const seenEntry = updatedMessage.seen.find(
                        (s) => s.userId.toString() === userId.toString()
                    );

                    io.to(conversationId).emit("MESSAGE_SEEN", {
                        messageId,
                        userId,
                        name: user.userName,
                        seenAt: seenEntry ? seenEntry.seenAt : new Date()
                    });
                }
            } catch (error) {
                console.error("CRITICAL DB ERROR in MESSAGE_SEEN:", error);
            }
        });
        socket.on("MESSAGES_SEEN", async ({ conversationId }) => {
            try {
                const userObjectId = new mongoose.Types.ObjectId(userId);

                const unseenMessages = await Messages.find({
                    conversationId,
                    "seen.userId": { $ne: userObjectId }
                });

                for (const message of unseenMessages) {
                    message.seen.push({
                        userId: userObjectId,
                        name: user.userName,
                        seenAt: new Date()
                    });
                    await message.save();

                    io.to(conversationId).emit("MESSAGE_SEEN", {
                        messageId: message._id,
                        userId,
                        name: user.userName,
                        seenAt: new Date()
                    });
                }
            } catch (err) {
                console.error("ERROR marking multiple messages as seen:", err);
            }
        });

        socket.on("New_Conversation",async({conversationId})=>{
            try {
                const conversation = await Conversations.findById(conversationId).populate("participants.userId", "firstName lastName userName photo email") ;
            
                if (conversation) {
                    const convoObj=conversation.toObject();
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
            
            
                    const payload= {
                        ...convoObj,
                        participants: formattedParticipants, 
                        unreadCount: 0
                    };
                    const currentUserId = socket.user._id.toString(); 

                    formattedParticipants.forEach((participant) => {
                        const participantId = participant._id.toString();

                        if (participantId !== currentUserId) {
                            
                            const receiverSocketId = userSocketIDs.get(participantId);

                            if (receiverSocketId) {
                                io.to(receiverSocketId).emit("NEW_CONVERSATION_CREATED", payload);
                            }
                        }
                    });
                }
            } catch (error) {
                console.error("error in backend socket in new conversation:", error);
            }
        })
        socket.on("disconnect", () => {
            userSocketIDs.delete(userId);
        });
    });

    return io;
};

export const getReceiverSocketId = (receiverId) => {
    return userSocketIDs.get(receiverId);
};