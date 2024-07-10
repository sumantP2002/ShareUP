import { Video } from "../models/videos.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudnary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;

    const filter = {}
    if(query){
        filter.title = {$regex: query, $options: 'i'};
    }
    if(userId){
        filter.owner = userId
    }
    
    const sort = {}
    sort[sortBy] = sortType === 'asc' ? 1 : -1;

    const videos = await Video.find(filter).sort(sort).skip((page - 1) * limit).limit(Number(limit))

    const totalVideos = await Video.countDocuments(filter);

    return res
    .status(200)
    .json(new ApiResponse(200, 
        {
            totalVideos, 
            totalPages: Math.ceil(totalVideos/limit),
            currentPage: page,
            videos
        }, "Extracted All Videos Successfully")
    )
})

const publishAVideo = asyncHandler(async(req, res) => {
    const { title, description} = req.body;

    if(!title || !description){
        throw new ApiError(400 , 'ALL feilds are required')
    }

    // TODO: get video, upload to cloudinary, create video

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    
    if(!videoFileLocalPath){
        throw new ApiError(400, 'Video File not found');
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);

    if(!videoFile){
        throw new ApiError(400, "Video File not uploaded to cloudinary");
    }

    const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path
    if(!thumbnailFileLocalPath){
        throw new ApiError(400, 'thumbnail not Found')
    }

    const thumbnailFile = await uploadOnCloudinary(thumbnailFileLocalPath)
    if(!thumbnailFile){
        throw new ApiError(400, 'Thumbnail File not Uploaded to cloudinary')
    }
    console.log(videoFile)

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnailFile.url,
        owner: req.user._id,
        duration: videoFile.duration
    })

    if(!video){
        throw new ApiError(404, 'Something went wrong while publishing a video')
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {video}, "Video Published Successfully"));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params.videoId

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Video with this Id not Found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , {video} , "Video Found Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params.videoId

    const {title, description} = req.body;
    if(!title || !description){
        throw new ApiError(400, "All feilds are required");
    }

    const thumbnailFilePath = req.file?.path
    if(!thumbnailFilePath){
        throw new ApiError(400, "Thumbnail is Required")
    }

    //find video doc
    const video = await Video.findById(videoId)

    //delete previous uploaded thumnail
    const oldThumbnailId = video.thumbnail
    const temp = oldThumbnailId.split('/');
    const publicId = temp[temp.length - 1].split('.')[0];

    await deleteFromCloudinary(publicId);

    //upload new thumbnail in cloudinary 
    const newThumbnail = await uploadOnCloudinary(thumbnailFilePath);

    const newVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title, 
            description,
            thumbnail: newThumbnail.url
        },
        
    }, {new: true})

    return res
    .status(200)
    .json(new ApiResponse(200, {newVideo}, "Video Details updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params.videoId

    const video = await Video.findByIdAndDelete(videoId);

    if(!video){
        throw new ApiError(400, "Video does not exist with this ID");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {video}, "Video Deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const {videoId} = req.params.videoId;

    const video = await Video.findById(videoId);

    if(video.isPublished){
        video.isPublished = false
    }
    else{
        video.isPublished = true
    }

    const videoNew = await Video.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {videoNew} , "Toggled Publish Status Successfully"))
})



export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}