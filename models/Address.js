const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const addressSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  address: {
    name: { type: String, required: true },
    flatHouseNumber: { type: String, required: true },
    areaStreet: { type: String, required: true },
    landmark: { type: String, required: true },
    pincode: { type: String, required: true },
    city: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    state: { type: String, required: true },
  },
  default: { type: Boolean, default: false },
});
module.exports = mongoose.model("Address", addressSchema);
