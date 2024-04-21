const Address = require("../models/Address");
const Order = require("../models/Order");
const Product = require("../models/Product");
const CustomErrorHandler = require("../services/CustomErrorHandler");
const crypto = require("crypto");
const instance = require("../services/RazorPay");
const Transaction = require("../models/Transaction");
const mailTransport = require("../services/mailTransport");

const generatePaymentFailedEmail = function (orderId) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction Failed</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              border-radius: 10px;
              overflow: hidden;
          }
          .header {
              background-color: #f44336;
              color: #fff;
              padding: 20px;
              text-align: center;
              border-top-left-radius: 10px;
              border-top-right-radius: 10px;
          }
          .content {
              padding: 30px;
          }
          .content p {
              margin-bottom: 15px;
          }
          .button {
              display: inline-block;
              background-color: #f44336;
              color: #fff;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
          }
      </style>
  </head>
  <body>
  
      <div class="container">
          <div class="header">
              <h2>Transaction Failed</h2>
          </div>
          <div class="content">
              <p>Dear Customer,</p>
              <p>We regret to inform you that there was an issue processing your recent payment.</p>
              <p>Unfortunately, we were unable to process your payment for the order with ID: <strong>${orderId}</strong>.</p>
              <p>Please review your payment details and ensure that the information provided is accurate.</p>
              <p>If you believe this was an error, please contact our support team for assistance.</p>
              <p>Thank you for your understanding.</p>
              <p>Sincerely,</p>
              <p>The Payment Team</p>
          </div>
      </div>
  
  </body>
  </html>
  `;
};
const generatePaymentSuccessEmail = function (orderId, transactionId) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              border-radius: 10px;
              overflow: hidden;
          }
          .header {
              background-color: #4caf50;
              color: #fff;
              padding: 20px;
              text-align: center;
              border-top-left-radius: 10px;
              border-top-right-radius: 10px;
          }
          .content {
              padding: 30px;
          }
          .content p {
              margin-bottom: 15px;
          }
          .button {
              display: inline-block;
              background-color: #4caf50;
              color: #fff;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
          }
      </style>
  </head>
  <body>
  
      <div class="container">
          <div class="header">
              <h2>Payment Successful</h2>
          </div>
          <div class="content">
              <p>Dear Customer,</p>
              <p>We are delighted to inform you that your recent payment has been successfully processed.</p>
              <p>Your order with ID: <strong>${orderId}</strong> has been confirmed.</p>
              <p>Transaction ID: <strong>${transactionId}</strong></p>
              <p>Thank you for choosing us. Your purchase helps support our business, and we appreciate your trust.</p>
              <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
              <p>Best regards,</p>
              <p>The Payment Team</p>
          </div>
      </div>
  
  </body>
  </html>
  `;
};

const orderControllers = {
  // [ ] checkout [ ]
  async checkout(req, res, next) {
    const { products, quantity } = req.body;
    const id = req.__auth.id;
    const { addId } = req.params;

    const amount = Number(req.body.amount);

    if (
      !id ||
      !addId ||
      !products ||
      !quantity ||
      !amount ||
      amount <= 0 ||
      products.length === 0 ||
      quantity === 0
    ) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const findAddress = await Address.findById(addId);

      if (!findAddress || findAddress.user !== id)
        return next(CustomErrorHandler.notFound("Address not found"));

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

      const order_items = products.map((product) => ({
        product: product.prod_id,
        stock: product.stock_id,
        quantity: product.quantity,
      }));

      const order = await Order.create({
        user: id,
        order_items,
        address: addId,
        total_amount: amount,
      });

      res.status(200).json({
        success: true,
        message: "Order created successfully",
        orderId: order._id,
      });
    } catch (error) {
      next(error);
    }
  },

  //[ ] createOrder [ ]
  async createOrder(req, res, next) {
    const { id } = req.params;
    try {
      const existOrder = await Order.findById(id);
      if (!existOrder || existOrder.user !== req.__auth.id) {
        return next(CustomErrorHandler.notFound("Order not exist"));
      }
      const options = {
        amount: Number(existOrder.total_amount * 100),
        currency: "INR",
        notes: {
          user: existOrder.user,
          order: order._id,
        },
      };
      const order = await instance.orders.create(options);
      res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      next(error);
    }
  },

  //[ ] paymentVerification [ ]
  async paymentVerification(req, res, next) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    //created order id
    const { id } = req.params;

    try {
      const order = await Order.findById(id);
      if (!order) {
        return next(CustomErrorHandler.notFound("Order not found"));
      }
      // status [Placed, Shipped, Delivered, Cancelled, Failed]
      //  req_type [Approved, Rejected, Pending]
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        mailTransport.sendMail({
          from: "payment12@gmai.com",
          to: user.email,
          subject: "Transaction Failed",
          html: generatePaymentFailedEmail(id),
        });

        order.status = "Failed";
        order.req_type = "Rejected";
        await order.save();
        // send Email
        return res.status(400).json({
          message: "Invalid Payment",
          status: false,
        });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_APT_SECRET)
        .update(body.toString())
        .digest("hex");
      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        order.status = "Failed";
        order.req_type = "Rejected";
        await order.save();
        mailTransport.sendMail({
          from: "payment12@gmai.com",
          to: user.email,
          subject: "Transaction Failed",
          html: generatePaymentFailedEmail(id),
        });
        return res.status(400).json({
          message: "Invalid Payment",
          status: false,
        });
      }

      order.status = "Placed";
      order.req_type = "Approved";
      await order.save();

      const transaction = await Transaction.create({
        user: req.__auth.id,
        order: order._id,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      });

      mailTransport.sendMail({
        from: "payment12@gmai.com",
        to: user.email,
        subject: "Transaction Successful",
        html: generatePaymentSuccessEmail(id, transaction._id),
      });

      res.status(200).json({
        success: true,
        message: "Payment successful",
        transaction: {
          transaction_id: transaction._id,
          order_id: order._id,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = orderControllers;
