import express from "express";
import { 
    getConversationMessages,
    markAllAsSeen,
    sendMessageViaPolling
} from "../controllers/message.controller.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";

const router = express.Router();

router.route("/").post(verifyJwt,sendMessageViaPolling)
router.route("/seen").post(verifyJwt, markAllAsSeen);
router.route("/:conversationId").get(verifyJwt,getConversationMessages)



export default router;