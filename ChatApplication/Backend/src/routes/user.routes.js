import express from "express";
import { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
} from "../controllers/user.controller.js";
import { uploadSingleFile } from "../middlerwares/multer.middleware.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";

const router = express.Router();

router.route("/register").post(
    uploadSingleFile,
    registerUser
)

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJwt,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)


export default router;