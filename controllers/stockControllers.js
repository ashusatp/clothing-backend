const Product = require("../models/Product");
const Stock = require("../models/Stock");
const CustomErrorHandler = require("../services/CustomErrorHandler");
const cloudinary = require("cloudinary");
const getDataUri = require("../services/getDatauri");
const Image = require("../models/Image");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const stockControllers = {
  // [+] get Stock [+]
  async getStock(req, res, next) {
    const { id } = req.params;
    if (!id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const stock = await Stock.findById(id).populate("images");
      if (!stock) {
        return next(CustomErrorHandler.notFound("Stock not found"));
      }

      res.status(201).json({
        status: "success",
        data: {
          stock: stock,
        },
      });
    } catch (error) {
      next(error);
    }
  },
  async getStockWithColor(req, res, next) {
    const { prodId } = req.params;
    const { color } = req.body;
    if (!prodId || !color) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const sizes = await Stock.distinct("size", {
        product: prodId,
        color: color,
      });
      res.status(201).json({
        status: "success",
        sizes,
      });
    } catch (error) {
      next(error);
    }
  },
  async getStockWithSize(req, res, next) {
    const { prodId } = req.params;
    const { size } = req.body;
    if (!size || !prodId) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const colors = await Stock.distinct("color", {
        product: prodId,
        size: size,
      });
      res.status(201).json({
        status: "success",
        colors,
      });
    } catch (error) {
      next(error);
    }
  },
  async getStockWithColorAndSize(req, res, next) {
    const { prodId } = req.params;
    const { color, size } = req.body;
    if (!color || !size) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const stock = await Stock.find({
        color: color,
        size: size,
        product: prodId,
      }).populate("images");
      if (!stock) {
        return next(CustomErrorHandler.notFound("Stock not found"));
      }

      res.status(201).json({
        status: "success",
        stock,
      });
    } catch (error) {
      next(error);
    }
  },
  //[+] create stocks [+]
  async createStock(req, res, next) {
    const { id } = req.params;
    const file = req.file;
    const { color, size, amount, quantity } = req.body;
    if (!id || !color || !size || !amount || !quantity || !file) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const isstockExist = await Stock.find({
        color: color,
        size: size,
        product: prodId,
      });
      if (isstockExist) return next(CustomErrorHandler.alreadyExist("Stock already exist"));
      
      const product = await Product.findById(id);
      if (!product) {
        return next(
          CustomErrorHandler.notFound("Product not found with this ID")
        );
      }
      const fileUri = getDataUri(file);

      const cloudinaryUpload = await cloudinary.v2.uploader.upload(
        fileUri.content
      );

      const image = await Image.create({
        public_id: cloudinaryUpload.public_id,
        url: cloudinaryUpload.secure_url,
      });

      const stock = await Stock.create({
        product: product._id,
        color,
        size,
        amount: Number(amount),
        quantity: Number(quantity),
        images: [image._id],
      });

      product.stocks.push(stock._id);
      await product.save();

      res.status(201).json({
        status: "success",
        message: "stock added successfully",
        data: {
          stock: stock,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // [+] add image to the stock [+]
  async addImage(req, res, next) {
    const { id } = req.params;
    const file = req.file;
    if (!file || !id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const stock = await Stock.findById(id);
      if (!stock) {
        return next(CustomErrorHandler.notFound("Stock not found"));
      }
      const fileUri = getDataUri(file);
      const cloudinaryUpload = await cloudinary.v2.uploader.upload(
        fileUri.content
      );

      const image = await Image.create({
        public_id: cloudinaryUpload.public_id,
        url: cloudinaryUpload.secure_url,
      });
      stock.images.push(image._id);
      await stock.save();

      res.status(201).json({
        status: "success",
        message: "stock image added",
        data: {
          stock: stock,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // [+] update stock [+]
  async updateStock(req, res, next) {
    const { id } = req.params;
    const { color, size, amount, quantity } = req.body;
    if (!id || !color || !size || !amount || !quantity) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const stock = await Stock.findById(id);
      if (!stock) {
        return next(CustomErrorHandler.notFound("stock not found"));
      }

      stock.color = color;
      stock.size = size;
      stock.amount = parseInt(amount);
      stock.quantity = parseInt(quantity);

      await stock.save();

      res.status(201).json({
        status: "success",
        message: "stock updated successfully",
        data: {
          stock: stock,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // [+] remove image from the stock [+]
  async removeImage(req, res, next) {
    const { imgId, stockId } = req.params;
    if (!imgId || !stockId) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const imageToRemove = await Image.findById(imgId);
      if (!imageToRemove) {
        return next(CustomErrorHandler.notFound("Stock Image not found"));
      }
      const updated = await Stock.updateOne(
        { _id: stockId },
        { $pull: { images: imgId } }
      );
      if (updated.modifiedCount !== 1) {
        return next(CustomErrorHandler.badRequest("image didn't exist"));
      }
      await cloudinary.v2.uploader.destroy(imageToRemove.public_id);
      await imageToRemove.delete();
      res.status(201).json({
        status: "success",
        message: "stock updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // [+] delete stock [+]
  async deleteStock(req, res, next) {
    const { productId, stockId } = req.params;
    if (!stockId || !productId) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const stock = await Stock.findById(stockId);
      if (!stock) {
        return next(CustomErrorHandler.notFound("something went wrong"));
      }

      const updatedProduct = await Product.updateOne(
        { _id: productId },
        { $pull: { stocks: stockId } }
      );
      if (updatedProduct.modifiedCount === 0) {
        return next(CustomErrorHandler.notFound("Product not found"));
      }

      // Step 2: Retrieve image references
      const imageIds = stock.images.map((imageRef) => imageRef);
      const deleteImagePromises = imageIds.map(async (imageId) => {
        const imageToDelete = await Image.findById(imageId);
        await cloudinary.v2.uploader.destroy(imageToDelete.public_id);
        await imageToDelete.delete();
      });
      await Promise.all(deleteImagePromises);

      await Stock.findByIdAndDelete(stockId);
      res.status(201).json({
        status: "success",
        message: "stock deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = stockControllers;
