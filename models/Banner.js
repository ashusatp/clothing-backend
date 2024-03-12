const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    required: true,
  },
  applicable_product: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  ],
  image: { type: Schema.Types.ObjectId, ref: "Image" },
});

module.exports = mongoose.model('Banner',bannerSchema);
