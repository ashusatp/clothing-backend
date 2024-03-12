const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const brandSchema = new Schema(
  {
    brand: { type: String, required: true },
    image: { type: mongoose.Schema.Types.ObjectId, ref: "Image" },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    created_at: { type: Date, default: Date.now() },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Brand", brandSchema);
