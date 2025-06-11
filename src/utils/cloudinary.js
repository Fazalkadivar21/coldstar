import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from 'dotenv';

dotenv.config()

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, options = {}) => {
	try {
		const result = await cloudinary.uploader.upload(localFilePath, {
			resource_type: "auto", // auto-detects file type (image/video/etc)
			...options,
		});
        fs.unlinkSync(localFilePath)
		return result;
	} catch (error) {
        fs.unlinkSync(localFilePath)
		throw error;
	}
};

export { uploadOnCloudinary };
