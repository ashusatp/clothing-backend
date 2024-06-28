const express = require("express");
const userControllers = require("../controllers/userControllers");
const authMiddleware = require("../middlewares/auth");
const addressControllers = require("../controllers/addressControllers");
const productControllers = require("../controllers/productControllers");
const stockControllers = require("../controllers/stockControllers");
const router = express.Router();

router.post("/register", userControllers.register);
router.post("/login", userControllers.login);
router.post("/forget-password", userControllers.forgetPassword);
router.put("/reset-password/:userId/:token", userControllers.resetPassword);
// [+] Products [+]
router.post("/products", productControllers.getProducts);
router.get("/products-search", productControllers.getProductsSearchs);
router.get("/product/:id", productControllers.getProduct);

router.post("/get-stocks-cl/:prodId", stockControllers.getStockWithColor);
router.post("/get-stocks-sz/:prodId", stockControllers.getStockWithSize);
router.post("/get-stock-checkout/:prodId", stockControllers.getStockWithColorAndSize);


router.use(authMiddleware.jwtAuth);
router.use(authMiddleware.userCheck);

router.post("/verify-email", userControllers.vefifyEmail);
router.post("/send-otp", userControllers.sendOtpToVerify);
router.get("/refresh", userControllers.refresh);
router.post("/logout", userControllers.logout);

//[+] Address [+]
router.post("/address", addressControllers.addAddress);
router.get("/address", addressControllers.getAddresses);
router.delete("/address/:addId", addressControllers.removeAddress);





module.exports = router;
