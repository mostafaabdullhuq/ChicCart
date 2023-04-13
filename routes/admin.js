const { Router } = require("express"),
    router = Router(),
    { getAdminProducts, getAddProduct, postAddProduct, getEditProduct, postEditProduct, getDeleteProduct } = require("./../controllers/adminController"),
    isAdmin = require("./../middlewares/admin"),
    { addProductValidator, getEditProductValidator, postEditProductValidator, getDeleteProductValidator } = require("./../middlewares/validators/productValidator");

router.get("/products", isAdmin, getAdminProducts); // GET LIST OF PRODUCTS
router.get("/products/create", isAdmin, getAddProduct); // GET CREATE NEW PRODUCT
router.post("/products", isAdmin, addProductValidator, postAddProduct); // POST ADD NEW PRODUCT
router.get("/products/:id/edit", isAdmin, getEditProductValidator, getEditProduct); // GET EDIT PRODUCT
router.post("/products/:id", isAdmin, postEditProductValidator, postEditProduct); // POST EDIT PRODUCT
router.get("/products/:id/delete", isAdmin, getDeleteProductValidator, getDeleteProduct); // DELETE PRODUCT

module.exports = router;
