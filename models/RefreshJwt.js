const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RefreshSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  token: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("RefreshJwt", RefreshSchema);
