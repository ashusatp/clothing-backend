const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const couponSchema = new Schema({
  discount: Number,
  title: String,
  description: String,
  created_at: { type: Date, default: Date.now() },
  end_at: { type: Date, required: true },
  modified_at: { type: Date, default: Date.now() },
});
module.exports = mongoose.model("Coupon", couponSchema);
