import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_URL = process.env.CLOUDINARY_URL;

if (CLOUDINARY_URL) {
    const url = new URL(CLOUDINARY_URL);
    cloudinary.config({
        cloud_name: url.hostname,
        api_key:    url.username,
        api_secret: decodeURIComponent(url.password),
    });
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export default cloudinary;
