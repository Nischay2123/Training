import  jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Users from "../models/User.model.js";
import cookieParser from "cookie-parser";
import { generateAccessAndRefernceToken } from "../utils/token.js";



// authentication middlewear
export const verifyJwt = asyncHandler(async(req,res,next)=>{
    try {
        const incomingAccessTokentoken = req.cookies?.accessToken ;
        const incomingRefreshToken = req.cookies?.refreshToken;
        // console.log(token);
        if (incomingAccessTokentoken) {
          try {
            const decodeToken = jwt.verify(incomingAccessTokentoken,process.env.ACCESS_TOKEN_SECRET);
    
            const user = await Users.findById(decodeToken?._id);
        
            if(!user) throw new ApiError(401,"Invalid Access Token")
        
            req.user= user;
        
            return next()
          } catch (error) {
             console.log("Access token invalid/expired. Trying refresh token…")
          }
        }

        if (!incomingRefreshToken) {
            throw new ApiError(401, "No refresh token present → unauthorized");
        }

        
        let decodedRefresh;
        try {
            decodedRefresh = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            throw new ApiError(401, "Refresh token expired or invalid");
        }

        const user = await Users.findById(decodedRefresh._id).select("-password");
        if (!user) throw new ApiError(401, "User not found");
        console.log(user.refreshToken,"   incoming: ",incomingRefreshToken);
        
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token mismatch ");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefernceToken(user._id);

        const options={
            secure:true,
            httpOnly: true
        }
        res.cookie("accessToken", accessToken, options);
        res.cookie("refreshToken", refreshToken, options);

        console.log("🔄 Tokens refreshed. Continuing original request.");

        req.user = user;

        return next();
        
    } catch (error) {
        throw new ApiError(401,error?.message|| "Invalid Tokens")
    }
})


// socket middlewear (not used , used earlier not logic is changed)
export const socketAuthenticator = async (socket, next) => {
  try {
    const req = socket.request;

    cookieParser()(req, {}, () => {
      const token = req.cookies?.accessToken; 
      if (!token) return next(new ApiError(401, "Please login to access this route"));

      const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      Users.findById(decodedData._id)
        .then(user => {
          if (!user) return next(new ApiError(401, "User not found"));

          socket.user = user;
          next(); 
        })
        .catch(err => next(new ApiError(401, "Authentication error")));
    });

  } catch (err) {
    console.log("Socket auth failed:", err.message);
    next(new ApiError(401, "Authentication error"));
  }
};