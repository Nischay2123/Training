import  jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Users from "../models/User.model.js";

export const verifyJwt = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken ;
        if(!token) throw new ApiError( 401,"Unauthorized Request or Access Token expired")
    
        const decodeToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user = await Users.findById(decodeToken?._id);
    
        if(!user) throw new ApiError(401,"Invalid Access Token")
    
        req.user= user;
    
        next()
    } catch (error) {
        throw new ApiError(401,error?.message|| "Invalid Access Token")
    }
})
