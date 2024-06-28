import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";


const registerUser = asyncHandler(async (req, res) => {
    //get the data from the user
    //save his avatar and coverImage to disk using multer middleware
    //email, password, username, firstname hai ya nahi??
    //user hai ya nahi pehle se
    //check for avatar
    //cloudinary me upload kar dena hai
    //uska ek object bana denge
    //return user withoud password and refresh Token


    const {username, firstName, email, password} = req.body;

    if([username, firstName, email, password].some((feild) => 
        feild.trim() === ""
    )){
        throw new ApiError(400, "All feild required");
    }

    const existeduser = await User.findOne(
        $or[{username} , {email}]
    )

    if(existeduseruser){
        throw new ApiError(409, "User Already Registered");
    }

    const avatarLocalFilePath = req.files?.avatar[0]?.path;

    let coverImageLocalFilePath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalFilePath=req.files.coverImage[0].path;
    }

    if(!avatarLocalFilePath){
        throw new ApiError(400, "Avatar not Found");
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath);
    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

    if(!avatar){
        throw new ApiError(400, "Avatar Upload Failed")
    }

    const user = await User.create({
        username,
        email,
        firstName: firstName.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url | "",

    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering a user");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"))
})

export {
    registerUser,

 }