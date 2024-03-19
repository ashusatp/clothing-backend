const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  status: { type: Boolean, default: true },
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  mobile: {
    type: String,
    required: true,
  },
  email_verification: { type: Boolean, default: false },
  profile_picture: {
    type: Schema.Types.ObjectId,
    ref: "Image",
    default: null,
  },
  created_at: { type: Date, default: Date.now() },
  modified_at: { type: Date, default: Date.now() },
  coupon_used: [{ type: mongoose.Schema.Types.ObjectId, ref: "Coupon" }],
  savedAddress: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const hash = await bcrypt.hash(this.password, 8);
    this.password = hash;
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


module.exports = mongoose.model("User", userSchema);
