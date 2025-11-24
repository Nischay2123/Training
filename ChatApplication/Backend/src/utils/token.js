import { ApiError } from "./ApiError.js"
import  Users from "../models/User.model.js"

export const generateAccessAndRefernceToken=async(userId)=>{
    try {
        // console.log(userId);
        
        const user = await Users.findById(userId);
        // console.log(user);
        
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // console.log(accessToken , refreshToken);
        
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});

        // console.log(user);
        

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,`Something went wrong while generating the token: ${error.message}`)
    }
}