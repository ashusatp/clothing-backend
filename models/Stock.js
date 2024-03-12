const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const stockSchema = new Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    color: String,
    size: String,
    amount: Number,
    afterOffer: {
      type: Number,
      default: -1,
    },
    quantity: Number,
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: "Image" }],
    created_at: { type: Date, default: Date.now() },
    modified_at: { type: Date, default: Date.now() },
  }
);
module.exports = mongoose.model("Stock", stockSchema);
