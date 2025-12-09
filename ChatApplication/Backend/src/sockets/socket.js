import { Server } from "socket.io";
import Messages from "../models/Message.model.js";
import Conversations from "../models/Conversation.model.js";
import mongoose from "mongoose";
import { publishMessage, publishSeen } from "./polling.js";


const userSocketIDs = new Map();

export const initializeSocket = (server, corsOptions) => {
    const io = new Server(server, { cors: corsOptions });

    io.on("connection", async (socket) => {

        const user = socket.handshake.auth?.user;
        if (!user) return socket.disconnect();

        const userId = user._id.toString();

        userSocketIDs.set(userId, socket.id);
        socket.join(userId);

        socket.on("JOIN_CONVERSATION", ({ conversationId }) => {
            socket.join(conversationId);
        });

        socket.on("SEND_MESSAGE", async ({ conversationId, text, members, tempId }, callback) => {
            try {


                const duplicate = await Messages.findOne({ tempId });
                if (duplicate) {
                    return callback?.({
                        success: true,
                        serverId: duplicate._id,
                        savedMessage: duplicate
                    });
                }

                const now = new Date();

                const savedMessage = await Messages.create({
                    conversationId,
                    text,
                    sender: userId,
                    tempId,
                    seen: [{
                        userId,
                        name: user.userName,
                        seenAt: now
                    }],
                    createdAt: now,
                    updatedAt: now,
                });

                await Conversations.findByIdAndUpdate(
                    conversationId,
                    {
                        lastMessage: {
                        text,
                        sender: userId,
                        createdAt: now,
                        updatedAt: now
                        },
                        $inc: { unreadCount: 1 },
                        updatedAt: now
                    }
                );


                for (const memberId of members) {
                    // console.log(memberId);
                    
                    io.to(memberId.toString()).emit("NEW_MESSAGE", {
                        tempId,
                        message: savedMessage
                    });
                }
                publishMessage(conversationId, savedMessage);

                callback?.({
                    success: true,
                    serverId: savedMessage._id,
                    savedMessage
                });

            } catch (error) {
                console.error(error);
                callback?.({ success: false, error: error.message });
            }
        });

        socket.on("MESSAGE_SEEN", async ({ conversationId, messageId }) => {
            try {
                const userObjectId = new mongoose.Types.ObjectId(userId);
                const now = new Date();

                const updated = await Messages.findOneAndUpdate(
                    { _id: messageId, "seen.userId": { $ne: userObjectId } },
                    { $push: { seen: { userId: userObjectId, name: user.userName, seenAt: now } } },
                    { new: true }
                );

                if (updated) {
                    io.to(conversationId).emit("MESSAGE_SEEN", {
                        messageId,
                        userId,
                        name: user.userName,
                        seenAt: now
                    });
                    publishSeen(conversationId, {
                      messageIds:[messageId],
                      userId,
                      name: user.userName,
                      seenAt: now
                    });
                }

            } catch (err) {
                console.error("MESSAGE_SEEN ERROR", err);
            }
        });



        socket.on("MESSAGES_SEEN", async ({ conversationId }) => {
            try {
                const userObjectId = new mongoose.Types.ObjectId(userId);
                const now = new Date();

                const unseenIds = await Messages.find(
                    { conversationId, "seen.userId": { $ne: userObjectId } },
                    { _id: 1 }
                ).lean();

                if (unseenIds.length === 0) return;

                const ids = unseenIds.map(m => m._id);

                await Messages.updateMany(
                    { _id: { $in: ids } },
                    {
                        $push: {
                            seen: { userId: userObjectId, name: user.userName, seenAt: now }
                        }
                    }
                );
                ids.forEach(id => {
                    io.to(conversationId).emit("MESSAGE_SEEN", {
                        messageId: id,
                        userId,
                        name: user.userName,
                        seenAt: now
                    });
                });


            } catch (err) {
                console.error("MESSAGES_SEEN ERROR", err);
            }
        });

        socket.on("New_Conversation", async ({ conversationId }) => {
            try {
                const convo = await Conversations.findById(conversationId)
                    .populate("participants", "firstName lastName userName photo email");

                if (!convo) return;

                const convoObj = convo.toObject();

                const formattedParticipants = convoObj.participants.map(user => ({
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    userName: user.userName,
                    photo: user.photo
                }));

                const payload = {
                    ...convoObj,
                    participants: convo.participants,
                    unreadCount: 0
                };

                formattedParticipants.forEach(member => {
                    if (member._id.toString() !== userId) {
                        const socketId = userSocketIDs.get(member._id.toString());
                        if (socketId) io.to(socketId).emit("NEW_CONVERSATION_CREATED", payload);
                    }
                });

            } catch (err) {
                console.error("NEW_CONVERSATION ERROR", err);
            }
        });

        socket.on("disconnect", () => {
            userSocketIDs.delete(userId);
        });
    });

    return io;
};

export const getReceiverSocketId = id => userSocketIDs.get(id);


