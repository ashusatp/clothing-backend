const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const resetPasswordSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  token: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    expires:300,
    default: () => Date.now(),
  },
});

resetPasswordSchema.pre("save", async function (next) {
  if (this.isModified("token")) {
    const hash = await bcrypt.hash(this.token, 8);
    this.token = hash;
  }
  next();
});

resetPasswordSchema.methods.compareToken = async function (token) {
  return await bcrypt.compare(token, this.token);
};

module.exports = mongoose.model("ResetPass", resetPasswordSchema);
