import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const generateAndSetTokens = async (user, res)=> {
    
    const {_id:userId,username,fullName,email} = user

    const accessToken = jwt.sign({ userId,username,fullName,email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });

    await User.findByIdAndUpdate(userId, { refreshToken });

    return {accessToken,refreshToken}
}
