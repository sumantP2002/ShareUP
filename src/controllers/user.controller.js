import mongoose, { trusted } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudnary.js";
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

const changeCurrentPassword = asyncHandler(async (req, res) => {
    //mujhe pass change karna hai
    //user 
    //take old password and new pass
    //check if given
    //kya jo user hai uska password old pass se math hota hai
    //password change karke db me save kar denge

    const {oldPassword, newPassword} = req.body;

    if(!oldPassword || !newPassword){
        throw new ApiError(400 , "Some feilds are misssing")
    }

    const user = await User.findById(req.user?._id);

    //password matching
    const passwordCheck = await user.isPasswordCorrect(oldPassword);

    if(!passwordCheck){
        throw new ApiError(400 , "Incorrect Password")
    }

    user.password = newPassword;

    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {} , "Password Saved Successfully"))

})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    //firstName, email
    const {firstName, email} = req.body

    if(!firstName || !email){
        throw new ApiError(400 , "All Feilds are required");
    }

    const user = await User.findByIdAndUpdate(req.user._id, 
        {
            $set: {
                firstName, 
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Account details updated Successfully"))
})

const updateAvatar = asyncHandler(async (req, res) => {
    const newAvatarLocalFilePath = req.file?.path
    console.log(newAvatarLocalFilePath);
    if(!newAvatarLocalFilePath){
        throw new ApiResponse(400 , "Avatar Missing")
    }
    const user = await User.findById(req.user?._id);

    const oldAvatarId = user.avatar;
    console.log(oldAvatarId)
    //deleted old avatar
    //get publidId from url
    const urlParts = oldAvatarId.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const publicId = fileName.split('.')[0];
    console.log(publicId);
    await deleteFromCloudinary(publicId);

    //upload on cloudinart
    const newAvatarId = await uploadOnCloudinary(newAvatarLocalFilePath);
    console.log(newAvatarId.url);
    if(!newAvatarId){
        throw new ApiError(400, "Avatar not uploade dto cloudinary")
    }
    user.avatar = newAvatarId.url;

    await user.save({validateBeforeSave: true})

    return res
    .status(200)
    .json(new ApiResponse(200, {user}, "Avatar Updated Successfully"))

})

const updateCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalFilePath = req.file?.path;
    console.log(coverImageLocalFilePath);
    if(!coverImageLocalFilePath){
        throw new ApiError(400 , "not got the file from frontend")
    }

    const user = await User.findById(req.user._id);

    //find out the publicId of file to be deleted
    const oldCoverImage = user.coverImage;
    console.log(oldCoverImage);

    if(oldCoverImage !== "0"){
        const tempString = oldCoverImage.split("/");
        const newString = tempString[tempString.length - 1];
        const publicId = newString.split(".")[0];

        await deleteFromCloudinary(publicId);
    }
    

    const newCoverImagePath = await uploadOnCloudinary(coverImageLocalFilePath);
    console.log(newCoverImagePath.url);
    if(!newCoverImagePath){
        throw new ApiError(400, "Image not Uploaded Successfully")
    }

    user.coverImage = newCoverImagePath.url

    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200 , {user} , "Cover Image Updated Successfully"))
    
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params;

    if(!username.trim()){
        throw new ApiError(400, "Provide Username for All Details")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribeTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribeTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
        
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    //here in aggregation pipeline mongoose don't work 
    //so while passing the id we have to give complete mongodb id
    //becauce earlier mongoose conver normal string id to object id(i.e mongodb id)

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",

                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",

                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200 , user[0].watchHistory , "watch History Fetched Successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
 }