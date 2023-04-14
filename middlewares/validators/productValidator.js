const { body, param, validationResult, check } = require("express-validator"),
    User = require("./../../models/user"),
    VIEW_PREFIX = "admin/";

exports.getProductValidator = [
    param("id").notEmpty().withMessage("Product id is required.").bail().isMongoId().withMessage("Invalid product id."),
    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            return res.redirect("/products");
        }
        // if there's no errors in validation, go to the next middleware
        next();
    },
];

exports.getEditProductValidator = [
    param("id").notEmpty().withMessage("Product id is required.").bail().isMongoId().withMessage("Invalid product id."),
    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            return res.redirect("/admin/products");
        }
        // if there's no errors in validation, go to the next middleware
        next();
    },
];

exports.getDeleteProductValidator = [
    param("id").notEmpty().withMessage("Product id is required.").bail().isMongoId().withMessage("Invalid product id."),
    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            return res.redirect("/admin/products");
        }
        // if there's no errors in validation, go to the next middleware
        next();
    },
];

exports.addProductValidator = [
    body("title")
        .notEmpty()
        .withMessage("Product title is required.")
        .bail()
        .isLength({ min: 5, max: 250 })
        .withMessage("Product title must be between 5 and 250 characters.")
        .bail()
        .isString()
        .withMessage("Invalid product title format."),
    body("description")
        .notEmpty()
        .withMessage("Product description is required.")
        .bail()
        .isLength({ min: 5, max: 2000 })
        .withMessage("Product description must be between 5 and 2000 characters.")
        .bail()
        .isString()
        .trim()
        .withMessage("Invalid product description format."),
    body("price").notEmpty().withMessage("Product price is required.").bail().isNumeric().withMessage("Invalid product price."),
    body("shippingPrice").notEmpty().withMessage("Product shipping price is required.").bail().isNumeric().withMessage("Invalid product shipping price."),
    check("images").custom((value, { req }) => {
        if (!req.files?.length) {
            throw new Error("product images are required.");
        }
        return true;
    }),
    // check("images").notEmpty().withMessage("Product images is required.").bail().trim(),

    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            const title = req.body.title,
                description = req.body.description,
                price = req.body.price,
                shippingPrice = req.body.shippingPrice,
                images = req.body.images;
            return res.render(`${VIEW_PREFIX}add_product`, {
                pageTitle: "Add Product",
                path: "add_product",
                errors: validationErr.array(),
                data: {
                    title: title,
                    price: price,
                    shippingPrice: shippingPrice,
                    description: description,
                    images: images,
                },
            });
        }

        // if there's no errors in validation, go to the next middleware
        next();
    },
];

exports.postEditProductValidator = [
    param("id").notEmpty().withMessage("Product id is required.").bail().isMongoId().withMessage("Invalid product id."),
    body("title")
        .notEmpty()
        .withMessage("Product title is required.")
        .bail()
        .isLength({ min: 5, max: 250 })
        .withMessage("Product title must be between 5 and 250 characters.")
        .bail()
        .isString()
        .withMessage("Invalid product title format."),
    body("description")
        .notEmpty()
        .withMessage("Product description is required.")
        .bail()
        .isLength({ min: 5, max: 2000 })
        .withMessage("Product description must be between 5 and 2000 characters.")
        .bail()
        .isString()
        .trim()
        .withMessage("Invalid product description format."),
    body("price").notEmpty().withMessage("Product price is required.").bail().isNumeric().withMessage("Invalid product price."),
    body("shippingPrice").notEmpty().withMessage("Product shipping price is required.").bail().isNumeric().withMessage("Invalid product shipping price."),

    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            req.flash("editErr");
            req.flash("editErr", validationErr.array());
            const productID = req.params.id;
            return res.redirect(`/admin/products/${productID}/edit`);
        }
        // if there's no errors in validation, go to the next middleware
        next();
    },
];
