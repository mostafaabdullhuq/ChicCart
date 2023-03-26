const { Router } = require("express");
const router = Router();
const shopController = require("../controllers/shopController");

router.get(["/home", "/index", ""], shopController.getIndex); // GET HOME PAGE
router.get("/products", shopController.getProducts); // GET ALL PRODUCTS PAGE
router.get("/product/:id", shopController.getProduct); // GET PRODUCT DETAILS PAGE
router.get("/cart", shopController.getCart); // GET CART PAGE
router.post("/cart", shopController.postCart); // ADD PRODUCT TO CART
router.post("/cart/delete", shopController.getDeleteCart); // DELETE PRODUCT FROM CART
router.post("/cart/update", shopController.getCartUpdate); // UPDATE CART PRODUCT QUANTITY
router.get("/checkout", shopController.getCheckout); // GET CHECKOUT PAGE

module.exports = router;
