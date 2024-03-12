const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const productSchema = new Schema({
  title: String,
  description: String,
  categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  brands: [{ type: Schema.Types.ObjectId, ref: "Brand" }],
  stocks: [{ type: Schema.Types.ObjectId, ref: "Stock" }],
  rating: { type: Number, default: 0 },
  image: { type: mongoose.Schema.Types.ObjectId, ref: "Image" },
  offers: [{ type: Schema.Types.ObjectId, red: "Offer" }],
  created_at: { type: Date, default: Date.now() },
  modified_at: { type: Date, default: Date.now() },
});
module.exports = mongoose.model("Product", productSchema);
