const { Router } = require("express"),
    router = Router(),
    productController = require("../controllers/productController"),
    cartController = require("../controllers/cartController"),
    orderController = require("../controllers/orderController");

router.get(["/home", "/index", ""], productController.getIndex); // GET HOME PAGE
router.get("/products", productController.getProducts); // GET ALL PRODUCTS PAGE
router.get("/product/:id", productController.getProduct); // GET PRODUCT DETAILS PAGE
router.get("/cart", cartController.getCart); // GET CART PAGE
router.post("/cart", cartController.postCart); // ADD PRODUCT TO CART
router.post("/cart/delete", cartController.getDeleteCart); // DELETE PRODUCT FROM CART
router.get("/checkout", orderController.getCheckout); // GET CHECKOUT PAGE
router.post("/promocode/add", orderController.postAddPromo); // POST ADD PROMOCODE
router.post("/promocode/remove", orderController.postRemovePromo); // POST REMOVE PROMOCODE
router.post("/order/create", orderController.postCreateOrder); // POST CREATE ORDER

module.exports = router;
