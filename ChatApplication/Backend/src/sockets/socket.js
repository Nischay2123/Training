// src/socket.js
import { Server } from "socket.io";
import { socketAuthenticator } from "../middlerwares/auth.middleware.js"; 
import Messages from "../models/Message.model.js"; 
import Conversations from "../models/Conversation.model.js";
import mongoose from "mongoose";

const userSocketIDs = new Map();
const onlineUsers = new Set();

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
        onlineUsers.add(userId);

        const getSocketIds = (members) => {
            if (!members || !Array.isArray(members)) return [];
            return members
                .map((member) => {
                    const id = member._id ? member._id.toString() : member.toString();
                    return userSocketIDs.get(id);
                })
                .filter((socketId) => socketId);
        };

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

                io.to(conversationId).emit("NEW_MESSAGE", {
                    tempId,
                    message: savedMessage
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

        socket.on("disconnect", () => {
            userSocketIDs.delete(userId);
            onlineUsers.delete(userId);
            socket.broadcast.emit("ONLINE_USERS", [...onlineUsers]);
        });
    });

    return io;
};

export const getReceiverSocketId = (receiverId) => {
    return userSocketIDs.get(receiverId);
};