const Category = require("../models/Category");
const Product = require("../models/Product");
const CustomErrorHandler = require("../services/CustomErrorHandler");

const categoryControllers = {
  async getCategories(req,res,next){
    try {
      const categories = await Category.find();
      if (!categories) {
        return next(CustomErrorHandler.notFound("categories not found"));
      }
      res.status(200).json({
        status: "success",
        data: {
          categories: categories,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req, res, next) {
    const { category } = req.body;
    if (!category) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      await Category.create({
        category,
      });
      res.status(201).json({
        status: "success",
        message: "category created successfully",
        data: {
          category: category,
        },
      });
    } catch (error) {
      next(error);
    }
  },
  async updateCategory(req, res, next) {
    const { id } = req.params;
    const { category } = req.body;
    if (!id || !category) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const cat = await Category.findById(id);
      cat.category = category;
      await cat.save();
      res.status(201).json({
        status: "success",
        message: "category updated successfully",
        data: {
          category: category,
        },
      });
    } catch (error) {
      next(error);
    }
  },
  async deleteCategory(req, res, next) {
    const { id } = req.params;
    if (!id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const category = await Category.findById(id);
      if (!category) {
        return next(CustomErrorHandler.notFound("category not found"));
      }
      const updatePromise = category.products.map(async (productId) => {
        await Product.updateOne(
          { _id: productId },
          { $pull: { categories: id } }
        );
      });
      await Promise.all(updatePromise);
      await Category.findByIdAndDelete(id);
      res.status(201).json({
        status: "success",
        message: "category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = categoryControllers;
