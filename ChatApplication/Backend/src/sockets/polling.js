import Messages from "../models/Message.model.js";
import Conversations from "../models/Conversation.model.js";
import express from "express";
import {verifyJwt} from "../middlerwares/auth.middleware.js"
import { asyncHandler } from "../utils/asyncHandler.js";

const app = express();

export const messageSubscribers = new Map();
export const seenSubscribers = new Map();

export function publishMessage(conversationId, message) {
  const subs = messageSubscribers.get(conversationId);
  if (!subs) return;

  subs.forEach((res) => {
    try {
      res.json({ messages: [message] });
    } catch (err) {}
  });

  subs.clear(); 
}


export function publishSeen(conversationId, payload) {
  const subs = seenSubscribers.get(conversationId);
  if (!subs) return;

  subs.forEach((res) => {
    try {
      res.json({ seen: payload });
    } catch {}
  });

  subs.clear();
}



export function removeSubscriber(conversationId, userId) {
  const subs = messageSubscribers.get(conversationId);
  if (!subs) return;

  subs.delete(userId);

  if (subs.size === 0) {
    messageSubscribers.delete(conversationId);
  }
}

export function removeSeenSubscriber(conversationId, userId) {
  const subs = seenSubscribers.get(conversationId);
  if (!subs) return;

  subs.delete(userId);

  if (subs.size === 0) {
    seenSubscribers.delete(conversationId);
  }
}


app.get("/messages", verifyJwt, asyncHandler(async(req,res)=>{
    const { conversationId, after } = req.query;
    const userId = req.user._id.toString();

    if (!conversationId || conversationId === "undefined") {
      return res.status(400).json({ messages: [] });
    }

    const convo = await Conversations.findById(conversationId);
    if (!convo || !convo.participants.includes(req.user._id)) {
      return res.status(403).json({ messages: [] });
    }

    let afterDate = new Date(0);
    if (after && !isNaN(new Date(after))) {
      afterDate = new Date(after);
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.setHeader("Connection", "keep-alive");

    const newMsgs = await Messages.find({
      conversationId,
      createdAt: { $gt: afterDate }
    }).sort({ createdAt: 1 });

    if (newMsgs.length > 0) {
      return res.json({ messages: newMsgs });
    }

    let convoSubs = messageSubscribers.get(conversationId);
    if (!convoSubs) {
      convoSubs = new Map();
      messageSubscribers.set(conversationId, convoSubs);
    }

    if (convoSubs.has(userId)) {
      try {
        convoSubs.get(userId).end();
      } catch {}
    }

    convoSubs.set(userId, res);

    const timeout = setTimeout(() => {
      removeSubscriber(conversationId, userId);
      res.json({ messages: [] });
    }, 15000); 

    req.on("close", () => {
      clearTimeout(timeout);
      removeSubscriber(conversationId, userId);
    });
}));

app.get("/seen-poll", verifyJwt, asyncHandler(async(req,res)=>{
    const { conversationId } = req.query;
    const userId = req.user._id.toString();

    if (!conversationId || conversationId === "undefined") {
      return res.status(400).json({ seen: [] });
    }

    const convo = await Conversations.findById(conversationId);
    if (!convo || !convo.participants.includes(req.user._id)) {
      return res.status(403).json({ seen: [] });
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.setHeader("Connection", "keep-alive");

    let convoSubs = seenSubscribers.get(conversationId);
    if (!convoSubs) {
      convoSubs = new Map();
      seenSubscribers.set(conversationId, convoSubs);
    }

    if (convoSubs.has(userId)) {
      try {
        convoSubs.get(userId).end();
      } catch {}
    }

    convoSubs.set(userId, res);

    const timeout = setTimeout(() => {
      removeSeenSubscriber(conversationId, userId);
      res.json({ seen: [] });
    }, 15000);

    req.on("close", () => {
      clearTimeout(timeout);
      removeSeenSubscriber(conversationId, userId);
    });
}));



setInterval(() => {
  messageSubscribers.clear();
}, 5 * 60 * 1000);
setInterval(() => {
  seenSubscribers.clear();
}, 5 * 60 * 1000);

export default app;