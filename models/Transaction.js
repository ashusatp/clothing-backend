const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const transactionSchema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    razorpay_payment_id: { String },
    razorpay_order_id: { String },
    razorpay_signature: { String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);