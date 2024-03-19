const Offer = require("../models/Offer");
const Product = require("../models/Product");
const Stock = require("../models/Stock");
const CustomErrorHandler = require("../services/CustomErrorHandler");

const offerControllers = {
  //[+] create Offer [+]
  async createOffer(req, res, next) {
    const { discount, title, description, end_at } = req.body;
    if (!discount || !title || !description || !end_at) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const offer = await Offer.create({
        discount: Number(discount),
        title,
        description,
        end_at,
      });

      res.status(201).json({
        status: "success",
        message: "Offer created successfully",
        data: {
          offer: offer,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  //[+] Update Offer not discount [+]
  async updateOffer(req, res, next) {
    const { title, description, end_at } = req.body;
    const { id } = req.params;
    if (!discount || !title || !description || !end_at) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const offer = await Offer.findById(id);

      offer.title = title;
      offer.description = description;
      offer.end_at = end_at;

      await offer.save();

      res.status(201).json({
        status: "success",
        message: "Offer updated successfully",
        data: {
          offer: offer,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  //[+] Add Offer [+]
  async addOffer(req, res, next) {
    const { prodId, id } = req.params;
    if (!prodId || !id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const product = await Product.findById(prodId);
      const offer = await Offer.findById(id);

      if (!product || !offer) {
        return next(CustomErrorHandler.notFound("Product or offer not found"));
      }

      if (product.offers.length !== 0) {
        return next(
          CustomErrorHandler.alreadyExist("This product already has one offer")
        );
      }

      if (product.offers.includes(id) || offer.products.includes(prodId)) {
        return next(
          CustomErrorHandler.alreadyExist("offer is already applied")
        );
      }

      product.offers.push(id);
      offer.products.push(prodId);

      const discontUpdate = product.stocks.map(async (stockId) => {
        const stock = await Stock.findById(stockId);
        let amount = stock.amount;
        let discountamount = (amount / 100) * Number(offer.discount);
        amount -= discountamount;
        stock.afterOffer = amount;
        await stock.save();
      });
      await Promise.all(discontUpdate);

      await product.save();
      await offer.save();

      res.status(201).json({
        status: "success",
        message: `Offer is applied on ${product.title}`,
      });
    } catch (error) {
      next(error);
    }
  },

  //[+] remove Offer [+]
  async removeProductOffer(req, res, next) {
    const { prodId, id } = req.params;
    if (!prodId || !id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      // const updateOffer = await Offer.findByIdAndUpdate(
      //   id,
      //   { $pull: { products: prodId } },
      //   { new: true }
      // );

      // if (updateOffer) {
      //   if (updateOffer.products.length === 0) {
      //     return next(
      //       CustomErrorHandler.notFound(
      //         "Product with the specified ID not found in the Offer's products array."
      //       )
      //     );
      //   }
      // } else {
      //   return next(CustomErrorHandler.notFound("Offer Not Found"));
      // }

      // const updatedProduct = await Product.findByIdAndUpdate(
      //   prodId,
      //   { $pull: { offers: id } },
      //   { new: true }
      // );

      // if (updatedProduct) {
      //   if (updatedProduct.offers.length === 0) {
      //     return next(
      //       CustomErrorHandler.notFound(
      //         "Offer with the specified ID not found in the product offers array."
      //       )
      //     );
      //   }
      // } else {
      //   return next(CustomErrorHandler.notFound("Product Not Found"));
      // }
      const product = await Product.findById(prodId);
      const offer = await Offer.findById(id);
      if (!product || !offer) {
        return next(CustomErrorHandler.notFound("Product Or Offer Not Found"));
      }

      if (product.offers.length === 0) {
        return next(CustomErrorHandler.notFound("No Offer is there"));
      }

      if (!product.offers.includes(id) || !offer.products.includes(prodId)) {
        return next(
          CustomErrorHandler.alreadyExist(
            "This Offer has not been applied on this Product"
          )
        );
      }

      const discontUpdate = product.stocks.map(async (stockId) => {
        const stock = await Stock.findById(stockId);
        stock.afterOffer = -1;
        await stock.save();
      });
      await Promise.all(discontUpdate);

      product.offers.pull(id);
      offer.products.pull(prodId);

      await Promise.all([product.save(), offer.save()]);

      res.status(201).json({
        status: "success",
        message: "Offer removed successfully",
      });
    } catch (error) {
      next(error);
    }
  },


  //[+] delete Offer [+]
  async deleteOffer(req, res, next) {
    const { id } = req.params;
    if (!id) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const offer = await Offer.findById(id);
      if (!offer) {
        return next(CustomErrorHandler.notFound("Offer not found"));
      }

      const deletePromise = offer.products.map(async (productId) => {
        const product = await Product.findById(productId);
        if (product && product.offers.includes(id)) {
          const stocksPromise = product.stocks.map(async (stockId) => {
            const stock = await Stock.findById(stockId);
            stock.afterOffer = -1;
            await stock.save();
          });
          product.offers.pull(id);
          await Promise.all([product.save(), ...stocksPromise]);
        }
      });

      await Promise.all(deletePromise);
      await offer.delete();

      res.status(201).json({
        status: "success",
        message: "Offer deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = offerControllers;
