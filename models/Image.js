const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const imageSchema = new Schema(
  {
    public_id: {
      type: String,
      required: true,
      unique: true
    },
    url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Image", imageSchema);
