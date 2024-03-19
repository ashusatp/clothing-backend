const Order = require("../models/Order");
const Product = require("../models/Product");
const CustomErrorHandler = require("../services/CustomErrorHandler");

const orderControllers = {
  async checkout(req, res, next) {
    const { products, quantity, amount } = req.body;
    if (
      !products ||
      !quantity ||
      !amount ||
      amount === 0 ||
      products.length === 0 ||
      quantity === 0
    ) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const Errors = [];
      let netOrderAmount = 0;

      for (const singleProduct of products) {
        const { prod_id, stock_id, quantity, price, totalPrice } =
          singleProduct;
        const stock = await Product.findOne({
          _id: stock_id,
          product: prod_id,
        });
        let netProductPrice = 0;

        // stock not found
        if (!stock) {
          Errors.push({
            product: prod_id,
            message: "Invalid Product",
            status: false,
          });
          continue;
        }

        // out of stock
        if (stock.quantity < quantity) {
          Errors.push({
            product: prod_id,
            message: "Product is out of stock",
            status: false,
          });
          continue;
        }

        // checking offer avaikability
        if (stock.afterOffer !== -1) {
          if (price !== stock.afterOffer) {
            Errors.push({
              product: prod_id,
              message: "Product's price mismatched",
              status: false,
            });
            continue;
          }
          netProductPrice += stock.afterOffer * quantity;
        } else {
          if (price !== stock.amount) {
            Errors.push({
              product: prod_id,
              message: "Product's price mismatched",
              status: false,
            });
            continue;
          }
          netProductPrice += stock.amount * quantity;
        }

        // cross-checking product amount according to quantiity
        if (netProductPrice !== totalPrice) {
          Errors.push({
            product: prod_id,
            message: "Product's net price mismatched ",
            status: false,
          });
          continue;
        }

        netOrderAmount += totalPrice;
      }

      if (netOrderAmount !== amount) {
        Errors.push({
          message: "Order's net price mismatched",
          status: false,
        });
      }

      if (Errors.length > 0) {
        return res.status(400).json({
          message: Errors,
          status: false,
        });
      }

      const order = await Order.create({

      }); 
      
    } catch (error) {
      next(error);
    }
  },
};
module.exports = orderControllers;
