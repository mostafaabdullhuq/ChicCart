const { Router } = require("express");
const router = Router();
const adminController = require("./../controllers/adminController");
const adminMiddleware = require("./../middlewares/admin");

router.get("/products", adminMiddleware, adminController.getAdminProducts); // GET LIST OF PRODUCTS
router.get("/products/create", adminMiddleware, adminController.getAddProduct); // GET CREATE NEW PRODUCT
router.post("/products", adminMiddleware, adminController.postAddProduct); // POST ADD NEW PRODUCT
router.get("/products/:id/edit", adminMiddleware, adminController.getEditProduct); // GET EDIT PRODUCT
router.post("/products/:id", adminMiddleware, adminController.postEditProduct); // POST EDIT PRODUCT
router.get("/products/:id/delete", adminMiddleware, adminController.getDeleteProduct); // DELETE PRODUCT

module.exports = router;
