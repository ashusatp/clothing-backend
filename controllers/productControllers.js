const Product = require("../models/Product");
const Stock = require("../models/Stock");
const CustomErrorHandler = require("../services/CustomErrorHandler");
const cloudinary = require("cloudinary");
const getDataUri = require("../services/getDatauri");
const Image = require("../models/Image");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const productControllers = {
  //[+] get product by Id [+]
  async getProduct(req, res, next) {
    const { id } = req.params;
    if (!id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const product = await Product.findById(id);
      if (!product) {
        return next(CustomErrorHandler.notFound("Product not found"));
      }
      res.status(200).json({
        status: "success",
        data: {
          product: product,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  //[+] create Product [+]
  async createProduct(req, res, next) {
    const { title, description } = req.body;

    const file = req.file;

    if (!title || !description || !file) {
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

      const product = await Product.create({
        title,
        description,
        image: image._id,
        created_at: Date.now(),
        modified_at: Date.now(),
      });

      res.status(201).json({
        status: "success",
        message: "Product created successfully",
        data: {
          product: product,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // [+] Add Category [+]
  async addCategory(req, res, next) {
    const { productId, catId } = req.params;
    if (!productId || !catId) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const category = await Category.findById(catId);

      if (!category) {
        return next(CustomErrorHandler.notFound());
      }

      const updatedProduct = await Product.updateOne(
        { _id: productId },
        { $addToSet: { categories: catId } }
      );

      if (updatedProduct.modifiedCount === 0) {
        return next(CustomErrorHandler.notFound("Product not found"));
      }

      category.products.push(productId);
      await category.save();
      res.status(201).json({
        status: "success",
        message: "category added successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // [+] Remove Category [+]
  async removeCategory(req, res, next) {
    const { productId, catId } = req.params;
    if (!productId || !catId) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const updatedProduct = await Product.updateOne(
        { _id: productId },
        { $pull: { categories: catId } }
      );

      const updatedCategory = await Category.updateOne(
        { _id: catId },
        { $pull: { products: productId } }
      );

      if (
        updatedProduct.modifiedCount === 0 ||
        updatedCategory.modifiedCount === 0
      ) {
        return next(
          CustomErrorHandler.notFound("Product or category not found")
        );
      }

      res.status(201).json({
        status: "success",
        message: "category added successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // [+] Add Brand [+]
  async addBrand(req, res, next) {
    const { productId, brandId } = req.params;
    if (!productId || !brandId) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const brand = await Brand.findById(brandId);

      if (!brand) {
        return next(CustomErrorHandler.notFound());
      }

      const updatedProduct = await Product.updateOne(
        { _id: productId },
        { $addToSet: { brands: brandId } }
      );

      if (updatedProduct.modifiedCount === 0) {
        return next(CustomErrorHandler.notFound("Product not found"));
      }

      brand.products.push(productId);
      await brand.save();
      res.status(201).json({
        status: "success",
        message: "Brand added successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // [+] Remove Brand [+]
  async removeBrand(req, res, next) {
    const { productId, brandId } = req.params;
    if (!productId || !brandId) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const updatedProduct = await Product.updateOne(
        { _id: productId },
        { $pull: { brands: brandId } }
      );

      const updatedBrand = await Brand.updateOne(
        { _id: brandId },
        { $pull: { products: productId } }
      );

      if (
        updatedProduct.modifiedCount === 0 ||
        updatedBrand.modifiedCount === 0
      ) {
        return next(
          CustomErrorHandler.notFound("Product or brand not found")
        );
      }

      res.status(201).json({
        status: "success",
        message: "Brand Removed successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // [ ] update Product [ ]
  async updateProductDetails(req, res, next) {
    const { title, description } = req.body;
    const { id } = req.params;
    if (!title || !description || !id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const product = await Product.findById(id);
      if (!product) {
        return next(CustomErrorHandler.notFound("Product not found"));
      }
      product.title = title;
      product.description = description;

      await product.save();
      res.status(201).json({
        status: "success",
        message: "Product updated successfully",
        data: {
          product: product,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // [ ] delete product [ ]
  async deleteProduct(req, res, next) {
    const { id } = req.body;
    if (!id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const product = await Product.findById(id);
      if (!product) {
        return next(CustomErrorHandler.notFound("Product not found"));
      }
      const stockDelete = product.stocks.map(async (stockId) => {
        const stock = await Stock.findById(stockId);
        const imagedelete = stock.images.map(async (imgId) => {
          const imageToDelete = await Image.findById(imgId);
          await cloudinary.v2.uploader.destroy(imageToDelete.public_id);
          await imageToDelete.delete();
        });
        await Promise.all(imagedelete);
        await stock.delete();
      });
      await Promise.all(stockDelete);
      res.status(201).json({
        status: "success",
        message: "product deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  //[ ] Update Product Image [ ]
  async updateProductImage(req, res, next) {
    const file = req.file;
    const { productId, imgId } = req.params;
    if (!file || !productId || !imgId) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const image = await Image.findById(imgId);
      if (!image) {
        return next(CustomErrorHandler.notFound("Image not found"));
      }
      await cloudinary.v2.uploader.destroy(image.public_id);
      const fileUri = getDataUri(file);

      const cloudinaryUpload = await cloudinary.v2.uploader.upload(
        fileUri.content
      );

      image.public_id = cloudinaryUpload.public_id;
      image.url = cloudinaryUpload.secure_url;
    } catch (error) {
      next(error);
    }
  },
};
module.exports = productControllers;
