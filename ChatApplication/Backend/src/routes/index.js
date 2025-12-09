import express from "express";

import Users from "./user.routes.js";
import Conversation from "./conversation.routes.js";
import Message from "./message.route.js";
import Socket from "../sockets/polling.js";

const router = express.Router();

router.use("/users", Users);
router.use("/conversation", Conversation);
router.use("/messages", Message);
router.use("/poll",Socket)

export default router;