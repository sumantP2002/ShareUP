import { trusted } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken;
    
        await user.save({validateBeforeSave: false})
    
        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(400, "Error in creating Aceess and Refresh Token")
    }

}

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

    const existeduser = await User.findOne({
        $or: [{username} , {email}]
    })

    if(existeduser){
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
        coverImage: coverImage?.url || "",

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

const loginUser = asyncHandler(async (req, res) => {
    //todo
    //get data from req
    //check all availabel
    //chek if user exist
    //compare password
    //generate access and refresh token
    //send that response with cookies and json data
    // console.log(req.body)
    const {username, email, password} = await req.body;
    // console.log(username)
    if(!username && !email){
        throw new ApiError(400 , "Provide atleast username or email");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(400, "User not Found")
    }

    //compare password
    console.log(user.isPasswordCorrect)
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Access")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

    //take updated user
    const updatedUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200, 
        {
            updatedUser, 
            accessToken, 
            refreshToken
        }
        , 
        "User LoggedIn Successfully"
    ))

})

const logoutUser = asyncHandler(async (req, res) => {
    //kon se bande ko logout karna hai
    //remove all cokkies 
    //remove access and refresh token from db
    const user = User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1,
        }
    })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200 , {}, "User Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    try {
        const incommingRefreshToken = req.cookies?.refreshToken;
        if(!incommingRefreshToken){
            throw new ApiError(400, "unauthorized access: Relogin")
        }
    
        const decodedRefreshToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedRefreshToken._id);
        if(!user){
            throw new ApiError(400, "Refresh Token Not working")
        }
    
        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(400 , "Refresh token expired");
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
        console.log(accessToken);
        console.log(refreshToken)

        const options = {
            httpOnly: true,
            secure: true
        }
        const updatedUser = await User.findById(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
            {
                updatedUser,
                accessToken,
                refreshToken
            },
            "Refresh token created successfully")
        )
    } catch (error) {
        throw new ApiError(400, error?.message)
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
 }