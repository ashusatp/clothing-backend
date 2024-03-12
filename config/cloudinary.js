const cloudinary = require("cloudinary");
const {
  CLOUDINARY_CLIENT_NAME,
  CLOUDINARY_CLIENT_API,
  CLOUDINARY_CLIENT_SECRET,
} = require("./index");

function coudinaryConfig() {
  cloudinary.v2.config({
    cloud_name: CLOUDINARY_CLIENT_NAME,
    api_key: CLOUDINARY_CLIENT_API,
    api_secret: CLOUDINARY_CLIENT_SECRET,
  });
}

module.exports = coudinaryConfig;
