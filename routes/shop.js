const { Router } = require("express"),
    router = Router(),
    productController = require("../controllers/productController"),
    cartController = require("../controllers/cartController"),
    orderController = require("../controllers/orderController");
authMiddleware = require("../middlewares/auth");

router.get(["/home", "/index", ""], productController.getIndex); // GET HOME PAGE
router.get("/products", productController.getProducts); // GET ALL PRODUCTS PAGE
router.get("/product/:id", productController.getProduct); // GET PRODUCT DETAILS PAGE
router.get("/cart", authMiddleware, cartController.getCart); // GET CART PAGE
router.post("/cart", authMiddleware, cartController.postCart); // ADD PRODUCT TO CART
router.post("/cart/delete", authMiddleware, cartController.getDeleteCart); // DELETE PRODUCT FROM CART
router.get("/checkout", authMiddleware, orderController.getCheckout); // GET CHECKOUT PAGE
router.post("/promocode/add", authMiddleware, orderController.postAddPromo); // POST ADD PROMOCODE
router.post("/promocode/remove", authMiddleware, orderController.postRemovePromo); // POST REMOVE PROMOCODE
router.post("/order/create", authMiddleware, orderController.postCreateOrder); // POST CREATE ORDER

module.exports = router;
