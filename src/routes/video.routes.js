import Router from 'express'
import JWTverify from '../middlewares/auth.middleware.js'
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from '../controllers/videos.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
const router = Router()

router.route("/publish").post(
    JWTverify,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]), 
    publishAVideo)

router.route("/getAllVideos").get(
    JWTverify, getAllVideos
)

router.route("/getVideoById/:videoId").get(
    JWTverify,
    getVideoById
)

router.route("/updateVideo/:videoId").patch(
    JWTverify,
    upload.single("thumbnail"),
    updateVideo
)

router.route("/deleteVideo/:videoId").delete(
    JWTverify,
    deleteVideo
)

router.route("/togglePublishStatus/:videoId").get(
    JWTverify,
    togglePublishStatus
)
export default router