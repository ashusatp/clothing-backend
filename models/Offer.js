const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const offerSchema = new Schema(
  {
    discount: Number,
    title: String,
    description: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    created_at: { type: Date, default: Date.now() },
    end_at: { type: Date, required: true },
    modified_at: { type: Date, default: Date.now() },
  }
);
module.exports = mongoose.model("Offer", offerSchema);
