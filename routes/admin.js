const { Router } = require("express");
const router = Router();

const adminController = require("./../controllers/adminController");

router.get("/products", adminController.getAdminProducts); // GET LIST OF PRODUCTS
router.get("/products/create", adminController.getAddProduct); // GET CREATE NEW PRODUCT
router.post("/products", adminController.postAddProduct); // POST ADD NEW PRODUCT
router.get("/products/:id/edit", adminController.getEditProduct); // GET EDIT PRODUCT
router.post("/products/:id", adminController.postEditProduct); // POST EDIT PRODUCT
router.get("/products/:id/delete", adminController.getDeleteProduct); // DELETE PRODUCT

module.exports = router;
