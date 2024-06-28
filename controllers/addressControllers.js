const Address = require("../models/Address");
const User = require("../models/User");
const CustomErrorHandler = require("../services/CustomErrorHandler");

const addressControllers = {
  async addAddress(req, res, next) {
    const id  = req.__auth.id;
    const {
      name,
      flatHouseNumber,
      areaStreet,
      landmark,
      pincode,
      city,
      mobileNumber,
      state,
    } = req.body;
    if (
      !name ||
      !flatHouseNumber ||
      !areaStreet ||
      !landmark ||
      !mobileNumber ||
      !pincode ||
      !city ||
      !state
    ) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const user = await User.findById(id);
      if (!user) return next(CustomErrorHandler.notFound("User not found"));
      const address = await Address.create({
        user: user._id,
        address: {
          name,
          flatHouseNumber,
          areaStreet,
          landmark,
          pincode,
          city,
          mobileNumber,
          state,
        },
      });

      user.savedAddress.unshift(address._id);
      await user.save();

      res.status(200).json({
        message: "Address Added successfully",
        success: true,
        addresses: user.savedAddress,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAddresses(req, res, next) {
    const id  = req.__auth.id;
    try {
      const user = await User.findById(id).populate("savedAddress");
      if (!user) return next(CustomErrorHandler.notFound("User not found"));
      res.status(200).json({
        success: true,
        addresses: user.savedAddress,
      });
    } catch (error) {
      next(error);
    }
  },

  async removeAddress(req, res, next) {
    const { addId } = req.params;
    const id = req.__auth.id;
    console.log(addId);
    try {
      const updatedUser = await User.updateOne(
        { _id: id },
        { $pull: { savedAddress: addId } }
      );

      if (updatedUser.nModified <= 0) {
        console.log(CustomErrorHandler.badRequest());
      }

      const user = await User.findById(id);
      if (!user) return next(CustomErrorHandler.notFound("User not found"));

      await Address.findByIdAndDelete(addId);

      res.status(200).json({
        message: "Address removed successfully",
        success: true,
        addresses: user.savedAddress,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = addressControllers;
