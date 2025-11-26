import express from "express";
import env from "dotenv"
import connectDB from "./src/utils/db.js";
import Users from "./src/routes/user.routes.js"
import Conversation from "./src/routes/conversation.routes.js"
import Message from "./src/routes/message.route.js"
import cors from 'cors';
import cookieParser from 'cookie-parser'
import morgan from "morgan"
import { createServer } from 'node:http';
import { Server } from "socket.io"
import { socketAuthenticator } from "./src/middlerwares/auth.middleware.js";
import {v4 as uuid} from 'uuid';
import Messages from "./src/models/Message.model.js";
import Conversations from "./src/models/Conversation.model.js";
import mongoose from "mongoose";

const port = process.env.PORT ?? 8000
const userSocketIDs = new Map()
const onlineUsers = new Set();
const corsOptions = {
    origin: [
      "http://localhost:5500",
      "http://localhost:4173",
      process.env.CLIENT_URL,
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
};

const app = express();
const server = createServer(app);
const io = new Server(server , {
    cors: corsOptions
} )

env.config()
connectDB(process.env.MONGOD_URI)


app.use(cors(corsOptions));

app.set("io", io);


app.use(express.json());
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(cookieParser());
app.use(morgan("tiny"))


app.use("/api/v1/users",Users);
app.use("/api/v1/conversation",Conversation);
app.use("/api/v1/messages",Message);

app.get("/",(req,res)=>{
    res.send("Hello from the Server")
})

io.use(async(socket, next) => {
    // console.log("New socket trying to connect. Headers:", socket.request.headers);
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
            const explicitTime = new Date();

            const savedMessage = await Messages.create({
                conversationId,
                text,
                sender: userId,
                seen: [{
                    userId: userId,
                    name: user.userName,
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

            const messagePayload = {
                _id: savedMessage._id,
                conversationId,
                text,
                sender: userId,
                createdAt: savedMessage.createdAt.toISOString(),
                updatedAt: savedMessage.updatedAt.toISOString(),
                seen: savedMessage.seen
            };

            const socketIds = getSocketIds(members);
            
            if (socketIds.length > 0) {
                io.to(socketIds).emit("NEW_MESSAGE", {
                    conversationId,
                    message: messagePayload,
                });
            }

            if (callback) callback({ success: true });

        } catch (error) {
            console.error("Send Message Error:", error);
            socket.emit("ERROR", {
                type: "SEND_MESSAGE_FAILED",
                message: error.message || "Failed to send message",
                tempId,
            });
            if (callback) callback({ success: false, error: error.message });
        }
    });

    socket.on("TYPING_START", ({ conversationId }) => {
        socket.to(conversationId).emit("TYPING_START", { conversationId });
    });

    socket.on("TYPING_STOP", ({ conversationId }) => {
        socket.to(conversationId).emit("TYPING_STOP", { conversationId });
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
                io.to(conversationId).emit("MESSAGE_SEEN", {
                    messageId,
                    userId,
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




server.listen(port,()=> console.log(`Server is running on: http://localhost:${port}`));