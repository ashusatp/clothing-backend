const express = require("express");
const categoryControllers = require("../controllers/categoryControllers");
const brandControllers = require("../controllers/brandControllers");
const singleUpload = require("../middlewares/multer");
const productControllers = require("../controllers/productControllers");
const stockControllers = require("../controllers/stockControllers");
const offerControllers = require("../controllers/offerControllers");
const router = express.Router();

//[+] category Routes [+]
router.post("/category", categoryControllers.createCategory);
router.put("/category/:id", categoryControllers.updateCategory);
router.delete("/category/:id", categoryControllers.deleteCategory);

// [+] Brand Routes [+]
router.post("/brand", singleUpload, brandControllers.createBrand);
router.put("/brand/:id", brandControllers.updateBrand);
router.put(
  "/brand-img/:imgId",
  singleUpload,
  brandControllers.updateBrandImage
);
router.delete("/brand/:id", brandControllers.deleteBrand);

// [ ] product Routes [ ]
router.get("/product/:id", productControllers.getProduct);
router.post("/product", singleUpload, productControllers.createProduct);
router.put(
  "/product-add-cat/:productId/:catId",
  productControllers.addCategory
);
router.put(
  "/product-remove-cat/:productId/:catId",
  productControllers.removeCategory
);
router.put(
  "/product-add-brand/:productId/:brandId",
  productControllers.addBrand
);
router.put(
  "/product-remove-brand/:productId/:brandId",
  productControllers.removeBrand
);

//[+]  Stock Routs [+]
router.get("/stock/:id", stockControllers.getStock);
router.post("/stock/:id", singleUpload, stockControllers.createStock);
router.put("/stock/:id", stockControllers.updateStock);
router.delete("/stock/:productId/:stockId", stockControllers.deleteStock);
router.post("/stock-add-img/:id", singleUpload, stockControllers.addImage);
router.put("/stock-remove-img/:imgId/:stockId", stockControllers.removeImage);

//[+] Offer Routes [+]
router.post('/offer' , offerControllers.createOffer);
router.put('/offer/:id', offerControllers.updateOffer);
router.delete('/offer/:id', offerControllers.deleteOffer);
router.put('/add-offer/:prodId/:id', offerControllers.addOffer);
router.put('/remove-offer/:prodId/:id' ,offerControllers.removeProductOffer);

module.exports = router;