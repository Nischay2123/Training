import jwt from "jsonwebtoken";
import Users from "../models/User.model.js";
import { generateAccessAndRefernceToken } from "./token.js";
import { ApiError } from "./ApiError.js";

export const verifyAndRefreshTokens = async (req, res = null) => {

  const access = req.cookies?.accessToken;
  const refresh = req.cookies?.refreshToken;


  let user = null;

  if (access) {
    try {
      const decoded = jwt.verify(access, process.env.ACCESS_TOKEN_SECRET);
      user = await Users.findById(decoded._id);

      if (!user) throw new ApiError(401, "Invalid access token");

      return { user, refreshed: false };
    } catch (err) {
      console.log("Access token expired. Checking refresh token...");
    }
  }

  if (!refresh) {
    throw new ApiError(401, "Refresh token missing");
  }

  let decodedRefresh;
  try {
    decodedRefresh = jwt.verify(refresh, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Refresh token expired/invalid");
  }

  user = await Users.findById(decodedRefresh._id);
  if (!user) throw new ApiError(401, "User not found");

  console.log("refreshTokenFromUser:",refresh," refreshFromTheDb:",user.refreshToken);
  
  if (refresh !== user.refreshToken) {
    throw new ApiError(401, "Refresh token mismatch");
  }

  if (res && refresh === user.refreshToken) {
    const { accessToken, refreshToken } =
      await generateAccessAndRefernceToken(user._id);

    const options = {
      secure: true,
      httpOnly: true,
    };
    res.setHeader("x-token-refreshed", "true");
    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);

    console.log("🔄 Tokens refreshed.");
  }

  return { user, refreshed: true };
};
