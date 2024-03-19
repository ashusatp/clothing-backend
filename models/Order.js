const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const OrderSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  req_type: { type: String, default: "Pending" }, // [Approved, Rejected, Pending] (Admin) ==> if Rejected then refund the amount using razorpay.
  // if status is failed req_type will be rejected and if status is success req_type will be Approved.
  status: { type: String, default: "Processing" }, // [Placed, Shipped, Delivered, Cancelled, Failed] (Admin) ==> if Cancelled then refund the amount using razorpay.
  // if payment is failed status will be failed and payment is success then status will be placed.

  order_items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      stock: { type: mongoose.Schema.Types.ObjectId, ref: "Stock" },
      quantity: Number,
  }],

  address: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
  total_amount: Number,
  
  coupon_used: { type: mongoose.Schema.Types.Mixed, ref: "Coupon" }, // on over all order.
  created_at: { type: Date, default: Date.now() },
  modified_at: { type: Date, default: Date.now() },
  transcation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
});

module.exports = mongoose.model('Order', OrderSchema);