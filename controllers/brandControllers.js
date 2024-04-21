const Brand = require("../models/Brand");
const Image = require("../models/Image");
const Product = require("../models/Product");
const CustomErrorHandler = require("../services/CustomErrorHandler");
const getDataUri = require("../services/getDatauri");
const cloudinary = require("cloudinary");
const brandControllers = {
  async getBrands(req,res,next){
    try {
      const brands = await Brand.find().populate("image");
      if (!brands) {
        return next(CustomErrorHandler.notFound("Product not found"));
      }
      res.status(200).json({
        status: "success",
        data: {
          brands: brands,
        },
      });
    } catch (error) {
      next(error);
    }
  },
  async createBrand(req, res, next) {
    const { brand } = req.body;
    const file = req.file;
    if (!brand || !file) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const fileUri = getDataUri(file);

      const cloudinaryUpload = await cloudinary.v2.uploader.upload(
        fileUri.content
      );

      const image = await Image.create({
        public_id: cloudinaryUpload.public_id,
        url: cloudinaryUpload.secure_url,
      });

      const createdBrand = await Brand.create({
        brand,
        image: image._id,
      });

      res.status(201).json({
        status: "success",
        message: "Brand created successfully",
        data: {
          brand: createdBrand,
        },
      });
    } catch (error) {
      next(error);
    }
  },
  async updateBrand(req, res, next) {
    const { id } = req.params;
    const { brand } = req.body;
    if (!id || !brand) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const brandToUpdate = await Brand.findById(id);
      if (!brandToUpdate) {
        return next(CustomErrorHandler.notFound("brand not found"));
      }
      brandToUpdate.brand = brand;
      await brandToUpdate.save();
      res.status(201).json({
        status: "success",
        message: "brand updated successfully",
        data: {
          brand: brandToUpdate,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateBrandImage(req, res, next) {
    const { imgId } = req.params;
    const file = req.file;
    if (!file || !imgId) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const brandImage = await Image.findById(imgId);
      if (!brandImage) {
        return next(CustomErrorHandler.notFound("Brand Image not found"));
      }

      const fileUri = getDataUri(file);

      const cloudinaryUpload = await cloudinary.v2.uploader.upload(
        fileUri.content
      );
      await cloudinary.v2.uploader.destroy(brandImage.public_id);

      brandImage.public_id = cloudinaryUpload.public_id;
      brandImage.url = cloudinaryUpload.secure_url;

      await brandImage.save();
      res.status(201).json({
        status: "success",
        message: "brand Image updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteBrand(req, res, next) {
    const { id } = req.params;
    if (!id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const brand = await Brand.findById(id).populate("image");
      if (!brand) {
        return next(CustomErrorHandler.notFound("Brand not found"));
      }
      const updatePromise = brand.products.map(async (productId) => {
        await Product.updateOne({ _id: productId }, { $pull: { brands: id } });
      });
      await Promise.all(updatePromise);
      await cloudinary.v2.uploader.destroy(brand.image.public_id);
      await brand.delete();
      res.status(201).json({
        status: "success",
        message: "Brand deleted successfully",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
};
module.exports = brandControllers;
