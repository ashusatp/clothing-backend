const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const addressSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    address: {
        firstLine: {type: String, required: true},
        secondLine: String,
        pincode: {type: Number, required: true},
        city: { type: String, required: true },
        state: { type: String, required: true },
    },
    default: { type: Boolean, default: false }
})
module.exports = mongoose.model('Address', addressSchema);