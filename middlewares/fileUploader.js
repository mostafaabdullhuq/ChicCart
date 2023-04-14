const multer = require("multer");

const VIEW_PREFIX = "admin/";
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
        fileSize: 5048576,
        files: 6,
    },
});

exports.addProductUploader = (req, res, next) => {
    const upload = fileParser.array("images");
    upload(req, res, function (err) {
        if (err) {
            const errors = [];
            if (err.code === "LIMIT_FILE_SIZE") {
                errors.push({
                    msg: "Maximum upload limit is 50MB for product images.",
                });
            }

            if (err.code === "LIMIT_FILE_COUNT") {
                errors.push({
                    msg: "Product images cannot exceed 6 images.",
                });
            }

            if (!errors.length) {
                errors.push({
                    msg: err.code,
                });
            }

            const title = req.body.title,
                description = req.body.description,
                price = req.body.price,
                shippingPrice = req.body.shippingPrice;

            return res.render(`${VIEW_PREFIX}add_product`, {
                pageTitle: "Add Product",
                path: "add_product",
                errors: errors,
                data: {
                    title: title,
                    price: price,
                    shippingPrice: shippingPrice,
                    description: description,
                },
            });
        } else {
            // Everything went fine.
            next();
        }
    });
};

exports.editProductUploader = (req, res, next) => {
    const upload = fileParser.array("images");
    upload(req, res, function (err) {
        if (err) {
            const errors = [];
            if (err.code === "LIMIT_FILE_SIZE") {
                errors.push({
                    msg: "Maximum upload limit is 50MB for product images.",
                });
            }

            if (err.code === "LIMIT_FILE_COUNT") {
                errors.push({
                    msg: "Product images cannot exceed 6 images.",
                });
            }

            if (!errors.length) {
                errors.push({
                    msg: err.code,
                });
            }
            req.flash("editErr");
            req.flash("editErr", errors);
            const productID = req.params.id;
            return res.redirect(`/admin/products/${productID}/edit`);
        } else {
            // Everything went fine.
            next();
        }
    });
};
