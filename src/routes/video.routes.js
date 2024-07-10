import Router from 'express'
import JWTverify from '../middlewares/auth.middleware.js'
import { getAllVideos, publishAVideo } from '../controllers/videos.controller.js'
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

export default router