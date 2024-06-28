const express = require("express");
const { APP_PORT } = require("./config");
const app = express();
const cors = require("cors");
const PORT = APP_PORT || 5500;
const connectDB = require("./config/database");
const errorHandler = require("./middlewares/errorHandler");
const cloudinaryConfig = require("./config/cloudinary");
const schedule = require("node-schedule");

connectDB();
cloudinaryConfig();

const cookieParser = require("cookie-parser");
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000","http://localhost:3001", "http://localhost:3002"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const adminRoutes = require("./routes/adminRoutes");
app.use("/admin", adminRoutes);
const userRoutes = require("./routes/userRoutes");
const Offer = require("./models/Offer");
const Product = require("./models/Product");
const Stock = require("./models/Stock");
app.use("/user", userRoutes);

const deleteOffer = async (id) => {
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
  } catch (error) {
    console.log(error);
  }
};

const handleOfferExpiry = async () => {
  try {
    Offer.find({ end_at: { $lt: new Date() } }, async (err, expiredOffers) => {
      if (err) {
        console.error("Error finding expired offers:", err);
        return;
      }
      const offers = expiredOffers.map(async (expiredOffer) => {
        const expiredOfferId = expiredOffer._id;
        await deleteOffer(expiredOfferId);
      });

      await Promise.all(offers);
    });
  } catch (error) {
    console.log(error);
  }
};

schedule.scheduleJob("periodic", "0 5 0 * * *", handleOfferExpiry);
// schedule.scheduleJob("periodic", "*/5 * * * * *", handleOfferExpiry);

app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Listning on port : ${PORT}`);
});
