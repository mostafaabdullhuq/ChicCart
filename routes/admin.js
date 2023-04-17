const { Router } = require("express"),
    router = Router(),
    { getAdminProducts, getAddProduct, postAddProduct, getEditProduct, postEditProduct, getDeleteProduct, getAllOrders, postChangeOrderStatus } = require("./../controllers/adminController"),
    { getOrder } = require("./../controllers/orderController"),
    isAdmin = require("./../middlewares/admin"),
    { addProductValidator, getEditProductValidator, postEditProductValidator, getDeleteProductValidator } = require("./../middlewares/validators/productValidator"),
    { addProductUploader, editProductUploader } = require("./../middlewares/fileUploader"),
    { changeOrderStatusValidator } = require("./../middlewares/validators/orderValidator");

router.get("/products", isAdmin, getAdminProducts); // GET LIST OF PRODUCTS
router.get("/products/create", isAdmin, getAddProduct); // GET CREATE NEW PRODUCT
router.post("/products", isAdmin, addProductUploader, addProductValidator, postAddProduct); // POST ADD NEW PRODUCT
router.get("/products/:id/edit", isAdmin, getEditProductValidator, getEditProduct); // GET EDIT PRODUCT
router.post("/products/:id", isAdmin, editProductUploader, postEditProductValidator, postEditProduct); // POST EDIT PRODUCT
router.get("/products/:id/delete", isAdmin, getDeleteProductValidator, getDeleteProduct); // DELETE PRODUCT
router.get("/orders", isAdmin, getAllOrders);
router.post("/order/:id/change", isAdmin, changeOrderStatusValidator, postChangeOrderStatus);

module.exports = router;
