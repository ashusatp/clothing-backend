const express = require("express");
const userControllers = require("../controllers/userControllers");
const authMiddleware = require("../middlewares/auth");
const addressControllers = require("../controllers/addressControllers");
const router = express.Router();

router.post("/register", userControllers.register);
router.post("/login", userControllers.login);

router.use(authMiddleware.jwtAuth);
router.use(authMiddleware.userCheck);

router.post("/verify-email", userControllers.vefifyEmail);
router.post("/send-otp", userControllers.sendOtpToVerify);
router.get("/refresh", userControllers.refresh);
router.post("/logout", userControllers.logout);
router.post("/forget-password", userControllers.forgetPassword);
router.put("/reset-password/:userId/:token", userControllers.resetPassword);

//[+] Address [+]
router.post("/address/:id", addressControllers.addAddress);
router.get("/address/:id", addressControllers.getAddresses);
router.delete("/address/:id/:addId", addressControllers.removeAddress);

module.exports = router;
