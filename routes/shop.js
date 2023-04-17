const { Router } = require("express"),
    router = Router(),
    { getIndex, getProducts, getProduct } = require("../controllers/productController"),
    { getCart, postCart, getDeleteCart } = require("../controllers/cartController"),
    { getCheckout, postAddPromo, postRemovePromo, postCreateOrder, getOrder, getOrderInvoice, getUserOrders } = require("../controllers/orderController"),
    isAuthed = require("../middlewares/authed"),
    { getProductValidator } = require("./../middlewares/validators/productValidator"),
    { createOrderValidator } = require("./../middlewares/validators/orderValidator");

// ROUTES
router.get(["/home", "/index", ""], getIndex); // GET HOME PAGE

router.get("/products", getProducts); // GET ALL PRODUCTS PAGE
router.get("/product/:id", getProductValidator, getProduct); // GET PRODUCT DETAILS PAGE

router.get("/cart", isAuthed, getCart); // GET CART PAGE
router.post("/cart", isAuthed, postCart); // ADD PRODUCT TO CART
router.post("/cart/delete", isAuthed, getDeleteCart); // DELETE PRODUCT FROM CART

router.get("/checkout", isAuthed, getCheckout); // GET CHECKOUT PAGE

router.post("/promocode/add", isAuthed, postAddPromo); // POST ADD PROMOCODE
router.post("/promocode/remove", isAuthed, postRemovePromo); // POST REMOVE PROMOCODE

router.get("/orders", isAuthed, getUserOrders);
router.post("/order/create", isAuthed, createOrderValidator, postCreateOrder); // POST CREATE ORDER
router.get("/order/:id", isAuthed, getOrder);

router.get("/order_invoice/:id", isAuthed, getOrderInvoice);

module.exports = router;
