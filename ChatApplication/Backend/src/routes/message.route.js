import express from "express";
import { 
    getConversationMessages,
    markAllAsSeen
} from "../controllers/message.controller.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";

const router = express.Router();

router.route("/seen/:conversationId").put(verifyJwt, markAllAsSeen);
router.route("/:conversationId").get(verifyJwt,getConversationMessages)



export default router;