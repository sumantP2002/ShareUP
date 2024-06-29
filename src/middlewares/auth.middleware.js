import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


const JWTverify = asyncHandler( async (req, _ , next) => {
    try {
        console.log(req.cookies);
        const token = req.cookies?.accessToken 
        // console.log(token);
        if(!token && typeof token !== 'string'){
            throw new ApiError(400 , "User not logged In : Access Not Allowed")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log(decodedToken)
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(400, "Invalid Access")
        }
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            next(new ApiError(401, "Token expired"));
        } else if (error.name === 'JsonWebTokenError') {
            next(new ApiError(400, "Invalid token"));
        } else {
            next(new ApiError(400, error.message));
        }
    }
})

export default JWTverify

