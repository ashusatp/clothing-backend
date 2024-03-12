const Coupon = require("../models/Coupon");
const CustomErrorHandler = require("../services/CustomErrorHandler");

const couponControllers = {
  async createCoupon(req, res, next) {
    const { discount, title, description, end_at } = req.body;
    if (!discount || !title || !description || !end_at) {
      return next(CustomErrorHandler.missingFields());
    }

    try {
      const coupon = await Coupon.create({
        discount: Number(discount),
        description,
        title,
        end_at,
      });

      res.status(201).json({
        status: "success",
        message: "Coupon created successfully",
        data: {
          coupon: coupon,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCoupon(req, res, next) {
    const { id } = req.params;
    const { discount, title, description, end_at } = req.body;
    if (!discount || !title || !description || !end_at) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const coupon = await Coupon.findById(id);
      if (!coupon) {
        return next(CustomErrorHandler.missingFields());
      }

      coupon.discount = Number(discount);
      coupon.title = title;
      coupon.description = description;
      coupon.end_at = end_at;

      await coupon.save();

      res.status(201).json({
        status: "success",
        message: "Coupon updated successfully",
        data: {
          coupon: coupon,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteCoupon(req, res, next) {
    const { id } = req.params;
    if (!id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const couponToDelete = await Coupon.findByIdAndDelete(id);
      if (!couponToDelete) {
        return next(CustomErrorHandler.notFound("Coupon not exist"));
      }

      res.status(201).json({
        status: "success",
        message: "Coupon deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = couponControllers;
