import express from "express";
import { getChat, getAllConversations, createGroup, getAllGroups, getGroupByName, addMembersToGroup, removeMemberFromGroup, leaveGroup } from "../controllers/coverstation.controller.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { verifyGroupAdmin } from "../middlerwares/admin.middleware.js";

const router = express.Router();

router.route("/group").get(verifyJwt,getGroupByName) 

router.route("/").post(verifyJwt,getChat).get(verifyJwt,getAllConversations)

router.route("/group").post(verifyJwt,createGroup)

router.route("/getAllGroups").get(verifyJwt,getAllGroups)

router.route("/addMember/:groupId").post(verifyJwt,verifyGroupAdmin,addMembersToGroup)

router.route("/removeMember/:groupId").post(verifyJwt,verifyGroupAdmin,removeMemberFromGroup)

router.route("/leaveGroup/:groupId").post(verifyJwt,leaveGroup)



export default router;