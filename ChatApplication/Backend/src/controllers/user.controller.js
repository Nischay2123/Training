import {ApiError} from "../utils/ApiError.js"
import {ApiResoponse} from "../utils/ApiResponse.js"
import Users from "../models/User.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { generateAccessAndRefernceToken } from "../utils/token.js";
import jwt from "jsonwebtoken";


export const registerUser = asyncHandler(async(req,res)=>{
    const{firstName,lastName,email,password}= req.body;

    if ([firstName, lastName, email, password].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    

    if(existedUser) throw new ApiError(409,"User with this email is already exist");

    console.log(`req file:`, Object.toString(req));
    // let photoLocalPath = req.files ? Object.keys(req.files).length > 0 && req.files?.photo.length > 0 ? req.files?.photo[0].path : "" :""

    const photoUploaded = await uploadOnCloudinary(req.file.buffer, "user_uploads");
    console.log("cloundinary:", photoUploaded);
    

    const user = await Users.create({
        firstName,
        lastName,
        email,
        password,
        photo:photoUploaded ?? "",
    });

    if (!user) {
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    user.password="";
    user.refreshToken="";

    return res.status(201).json(
        new ApiResoponse(200,user,"User Registered Successfully")
    )

})

export const loginUser = asyncHandler(async(req,res)=>{
    const {email,password} = req.body;

    if(!email || !password) throw new ApiError(400,"email or password is required")

    const user = await Users.findOne({email});
    // console.log(user);
    
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    console.log("password", isPasswordValid);
    

    if(!isPasswordValid) throw ApiError(401,"Invalid user Credentials") 
    // console.log(user._id);
    
    const {accessToken,refreshToken}=await generateAccessAndRefernceToken(user._id);

    user.password="";
    user.refreshToken="";

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(new ApiResoponse(200,"User loggedin successfully"))
})


export const logoutUser = asyncHandler(async(req,res)=>{
    const id = req.user._id ;
    console.log(id);
    
    const resi = await Users.findByIdAndUpdate(
        id,
        {
            $set:{
                refreshToken: ""
            }
        },
        {
            new:true
        }
    )
    
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResoponse(200,{},"user logged out"))
})

export const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken;
    if (incomingRefreshToken) throw new ApiError(401,"Unauthorized Request")
    
    const decodedToken =  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

    const user = await Users.findById(decodedToken._id);

    if (!user) {
        throw new ApiError(401,"Invalid Refresh Token")
    }

        
    if(incomingRefreshToken !== user.refreshToken) throw new ApiError(401,"Refresh Token is Invalid or Expired")

    const options={
        secure:true,
        httpOnly: true
    }

    const{accessToken, refreshToken}=await generateAccessAndRefernceToken(user._id)

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResoponse(200,"Tokens are refreshed")
    )
})