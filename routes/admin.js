const { Router } = require("express"),
    router = Router(),
    { getAdminProducts, getAddProduct, postAddProduct, getEditProduct, postEditProduct, getDeleteProduct } = require("./../controllers/adminController"),
    isAdmin = require("./../middlewares/admin"),
    { addProductValidator, getEditProductValidator, postEditProductValidator, getDeleteProductValidator } = require("./../middlewares/validators/productValidator"),
    multer = require("multer"),
    { addProductUploader, editProductUploader } = require("./../middlewares/fileUploader");

const fileStorage = multer.diskStorage({
    destination: "public/uploads/products_images",
    // function to change the filename before storing
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        let extension;
        switch (file.mimetype) {
            case "image/jpeg":
                extension = "jpeg";
                break;
            case "image/png":
                extension = "png";
                break;
            default:
                extension = "jpeg";
                break;
        }
        cb(null, `image-${uniqueSuffix}.${extension}`);
    },
});

const fileParser = multer({
    storage: fileStorage,
    // filter incoming files based on mime type
    fileFilter: (req, file, cb) => {
        // if file of type png or jpeg accept it
        if (file.mimetype === "image/png" || file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
            return cb(null, true);
        }
        // if another file type refuse it
        return cb(null, false);
    },
    limits: {
        fileSize: 1000,
    },
});

function uploadFile(req, res, next) {
    const upload = fileParser.array("images");

    upload(req, res, function (err) {
        if (err) {
            console.log(err);
        } else {
            // Everything went fine.
            next();
        }
    });
}

router.get("/products", isAdmin, getAdminProducts); // GET LIST OF PRODUCTS
router.get("/products/create", isAdmin, getAddProduct); // GET CREATE NEW PRODUCT
router.post("/products", isAdmin, addProductUploader, addProductValidator, postAddProduct); // POST ADD NEW PRODUCT
router.get("/products/:id/edit", isAdmin, getEditProductValidator, getEditProduct); // GET EDIT PRODUCT
router.post("/products/:id", isAdmin, editProductUploader, postEditProductValidator, postEditProduct); // POST EDIT PRODUCT
router.get("/products/:id/delete", isAdmin, getDeleteProductValidator, getDeleteProduct); // DELETE PRODUCT

module.exports = router;
