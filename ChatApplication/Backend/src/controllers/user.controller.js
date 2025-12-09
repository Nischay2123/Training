import {ApiError} from "../utils/ApiError.js"
import {ApiResoponse} from "../utils/ApiResponse.js"
import Users from "../models/User.model.js"
import Conversations from "../models/Conversation.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { generateAccessAndRefernceToken } from "../utils/token.js";
import jwt from "jsonwebtoken";

// to register on the application as user 
export const registerUser = asyncHandler(async(req, res) => {
    const { firstName, lastName, userName, email, password } = req.body;

    if ([firstName, lastName, userName, email, password].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    const existingEmail = await Users.findOne({ email });
    if (existingEmail) {
        throw new ApiError(409, "User with this email already exists");
    }

    const existingUsername = await Users.findOne({ userName });
    if (existingUsername) {
        throw new ApiError(409, "User with this username already exists");
    }

    
    let photoUrl = null; 

    if (req.file && req.file.buffer) {
        photoUrl = await uploadOnCloudinary(req.file.buffer, "user_uploads");
    }

    const user = await Users.create({
        firstName,
        lastName,
        userName,
        email,
        password,
        photo: photoUrl 
    });

    const createdUser = await Users.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResoponse(200, createdUser, "User Registered Successfully")
    );
});


// to login as user 
export const loginUser = asyncHandler(async(req,res)=>{
    const {email,password} = req.body;

    if(!email || !password) throw new ApiError(400,"email or password is required")
    console.log(email, password);
    
    const user = await Users.findOne({email});
    console.log(user);
    
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    console.log("password", isPasswordValid);
    

    if(!isPasswordValid) throw new ApiError(401,"Invalid user Credentials") 
    // console.log(user._id);
    
    const {accessToken,refreshToken}=await generateAccessAndRefernceToken(user._id);

    user.password="";
    user.refreshToken="";
    console.log("refresh token in login: ",refreshToken);
    
    const options = {
        httpOnly: true,
        secure: false
    }

    const sendPayload ={"_id":user._id,"photo":user.photo,"userName":user.userName,"fullName":`${user.firstName} ${user.lastName}`,email:user.email}

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(new ApiResoponse(200,JSON.stringify(sendPayload),"User loggedin successfully"))
})

//  to logout as user
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
        secure: false
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResoponse(200,{},"user logged out"))
})


//  to refresh token (redundant or not used as done in auth middleware)
export const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401,"Unauthorized Request")
    
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


// to get the user to start a new chat
export const getUser = asyncHandler(async(req,res)=>{
    const {userName} = req.query;

    const user = await Users.find({
        userName:{
            $regex:userName 
        }
    }).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401,"User not exist");
    }

    res.status(200).json(
        new ApiResoponse(200,user,"user found")
    )
})


// to get the user which are not present in the group and has one-to-one covnvo with user
export const getAvailableUsersForGroup = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const { groupId } = req.params;

    const group = await Conversations.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    const existingMemberIds = new Set(group.participants.map(id => id.toString()));

    const directChats = await Conversations.find({
        "participants": { $all: [currentUserId] },   
        "participants": { $size: 2 },               
        name: "One-to-One"
    }).select("participants");

    let friendIds = [];

    directChats.forEach(chat => {
        chat.participants.forEach(id => {
            const idStr = id.toString();
            if (idStr !== currentUserId.toString()) {
                friendIds.push(idStr);
            }
        });
    });

    friendIds = [...new Set(friendIds)];

    const finalIds = friendIds.filter(id => !existingMemberIds.has(id));

    if (finalIds.length === 0) {
        return res.status(200).json(
            new ApiResoponse(200, [], "No available users")
        );
    }

    const availableUsers = await Users.find({ _id: { $in: finalIds } })
        .select("firstName lastName userName photo email");

    return res.status(200).json(
        new ApiResoponse(200, availableUsers, "Available users retrieved successfully")
    );
});

// to update the profile picture of the user 
export const updateUser = asyncHandler(async(req,res)=>{
    const id = req.user._id ;
    let photoUrl = null; 

    if (req.file && req.file.buffer) {
        photoUrl = await uploadOnCloudinary(req.file.buffer, "user_uploads");
    }
    console.log(photoUrl);
    
    const user = await Users.findByIdAndUpdate(
        id,
        {
            $set:{
                photo: photoUrl
            }
        },
        {
            new:true
        }
    )
    return res.status(201).json(new ApiResoponse(200,user.photo,"User photo updated successfully"));
})