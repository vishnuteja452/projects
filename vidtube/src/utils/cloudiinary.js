import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
const uploadOnCloudinary = async (localFilePath) => {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type:"auto"
            }
        )
        console.log("file has uploaded to cloudinary. file src :"+response.url)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
} 

const deleteFromCloudinary = async (publicId) =>{
    try {
        cloudinary.uploader.destroy(publicId)
        console.log("deleted from the cloudinary . publicId")
    } catch (error) {
        console.log("error couldnt destroy publicId from cloudinary",error)
        return null
    }
}

export {uploadOnCloudinary , deleteFromCloudinary}
