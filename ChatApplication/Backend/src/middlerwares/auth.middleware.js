import  jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Users from "../models/User.model.js";
import cookieParser from "cookie-parser";

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


// export const socketAuthenticator = async (err, socket, next) => {
//       try {
//         if (err) throw new ApiError(401,`Socket Error Happen ${err.message}`);
  
//       const token = req.cookies?.accessToken ;
  
//       if (!authToken)
//         return new ApiError(401,"Please login to access this route");
  
//       const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
//       const user = await Users.findById(decodedData._id);
  
//       if (!user)
//         return new Error("Please login to access this route: ",err.message );
  
//       socket.user = user;
  
//       return next();
//       } catch (error) {
//         return new Error("Please login to access this route: ",error.message );
//       }
// };

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