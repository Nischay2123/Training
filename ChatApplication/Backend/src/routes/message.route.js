import express from "express";
import { 
    getConversationMessages,
    markAllAsSeen
} from "../controllers/message.controller.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";

const router = express.Router();

router.route("/:coverstaionId").get(verifyJwt,getConversationMessages)
router.route("/seen/:conversationId").put(verifyJwt, markAllAsSeen);



export default router;