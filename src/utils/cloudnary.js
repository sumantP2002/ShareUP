import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config();


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath)  return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath)
        return response;    //give complete url generated from cloudinary
    }
    catch(error){
        fs.unlinkSync(localFilePath)
        return null;
    }
}

const deleteFromCloudinary = async(publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if(result.result === "ok"){
            console.log('File Deleted SuccessFully');
        }
        else{
            console.log("Failed to delete file:", result.result)
        }
    } catch (error) {
        throw error?.message
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}
