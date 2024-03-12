const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const categorySchema = new Schema(
  {
    category: String,
    created_at: { type: Date, default: Date.now() },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Category", categorySchema);
