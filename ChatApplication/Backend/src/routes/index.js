import express from "express";

import Users from "./user.routes.js";
import Conversation from "./conversation.routes.js";
import Message from "./message.route.js";

const router = express.Router();

router.use("/users", Users);
router.use("/conversation", Conversation);
router.use("/messages", Message);

export default router;