import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResoponse } from "../utils/ApiResponse.js";
import Messages from "../models/Message.model.js";
import Conversations from "../models/Conversation.model.js";
import {  publishMessage, publishSeen } from "../sockets/polling.js";
import {  getReceiverSocketId } from "../sockets/socket.js";


// get all the message of a conversation (optimized through indexes for effective and fast fetching)
export const getConversationMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 20, before } = req.query;
  const userId = req.user._id;

  const convo = await Conversations.findById(conversationId);
  if (!convo || !convo.participants.includes(userId)) {
    return res.status(403).json(
      new ApiResoponse(403, [], "Forbidden")
    );
  }

  const query = { conversationId };

  if (before && !isNaN(new Date(before))) {
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


// used in polling as sockets fallback to mark the message seen 
export const markAllAsSeen = async (req, res) => {
  try {
    const { conversationId, messageIds } = req.body;
    const user = req.user;

    if (!conversationId || !Array.isArray(messageIds)) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    const convo = await Conversations.findById(conversationId);
    if (!convo || !convo.participants.includes(user._id)) {
      return res.status(403).json({ success: false });
    }

    const now = new Date();

    await Messages.updateMany(
      {
        _id: { $in: messageIds },
        "seen.userId": { $ne: user._id }
      },
      {
        $addToSet: {
          seen: {
            userId: user._id,
            name: user.userName,
            seenAt: now
          }
        }
      }
    );

    const io = req.app.get("io");

    for (const memberId of convo.participants) {   
      const socketId = getReceiverSocketId(memberId.toString());
      for(let messageId of messageIds){
        if (socketId) {
          io.to(socketId).emit("MESSAGE_SEEN", {
            messageId,
            userId: user._id,
            name: user.userName,
            seenAt: now
          });
        }
      }
    }

    publishSeen(conversationId, {
      messageIds,
      userId: user._id,
      name: user.userName,
      seenAt: now
    });

    res.json({ success: true });

  } catch (err) {
    console.error("SEEN ERROR:", err);
    res.status(500).json({ success: false });
  }
};

// to send message by the user as fallback to sockets
export const sendMessageViaPolling = async (req, res) => {
  try {
    const { conversationId, text, tempId } = req.body;
    const user = req.user;
    const userId = user._id.toString();

    if (!conversationId || !text || !tempId) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    const convo = await Conversations.findById(conversationId);
    if (!convo || !convo.participants.includes(user._id)) {
      return res.status(403).json({ success: false });
    }

    const duplicate = await Messages.findOne({ tempId });
    if (duplicate) {
      return res.json({
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
      updatedAt: now
    });

    await Conversations.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text,
        sender: userId,
        createdAt: now,
        updatedAt: now
      },
      updatedAt: now
    });

    const io = req.app.get("io");

    for (const memberId of convo.participants) {
      io.to(memberId.toString()).emit("NEW_MESSAGE", {
        tempId,
        message: savedMessage
      });
    }

    publishMessage(conversationId, savedMessage);

    return res.json({
      success: true,
      serverId: savedMessage._id,
      savedMessage
    });

  } catch (error) {
    console.error("POLL SEND ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
