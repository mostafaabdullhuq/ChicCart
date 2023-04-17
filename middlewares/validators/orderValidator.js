const { body, param, validationResult } = require("express-validator"),
    User = require("./../../models/user");
exports.createOrderValidator = [
    // VALIDATE FIRST NAME

    body("firstName")
        .notEmpty()
        .withMessage("First name is required.")
        .bail()
        .isAlpha("en-US", { ignore: " " })
        .withMessage("Invalid first name format.")
        .bail()
        .isLength({ min: 2, max: 20 })
        .withMessage("First name must be between 2 to 20 characters."),

    // VALIDATE LAST NAME

    body("lastName")
        .notEmpty()
        .withMessage("Last name is required.")
        .bail()
        .isAlpha("en-US", { ignore: " " })
        .withMessage("Invalid last name format.")
        .bail()
        .isLength({ min: 2, max: 20 })
        .withMessage("Last name must be between 2 to 20 characters."),

    // VALIDATE STREET ADDRESS

    body("streetAddress")
        .notEmpty()
        .withMessage("Street address is required.")
        .bail()
        .isAlphanumeric("en-US", { ignore: " " })
        .withMessage("Invalid Street address format.")
        .bail()
        .isLength({ min: 2, max: 100 })
        .withMessage("Street address must be between 5 to 100 characters."),

    // VALIDATE BUILDING NUMBER

    body("buildingNo")
        .notEmpty()
        .withMessage("Building number is required.")
        .bail()
        .isAlphanumeric("en-US", { ignore: " " })
        .withMessage("Invalid building number format.")
        .bail()
        .isLength({ min: 1, max: 10 })
        .withMessage("Building number must be between 1 to 10 characters."),

    // VALIDATE CITY

    body("city")
        .notEmpty()
        .withMessage("City is required.")
        .bail()
        .isAlpha("en-US", { ignore: " " })
        .withMessage("Invalid city format.")
        .bail()
        .isLength({ min: 3, max: 20 })
        .withMessage("City must be between 3 to 20 characters."),

    // VALIDATE STATE

    body("state")
        .notEmpty()
        .withMessage("State is required.")
        .bail()
        .isAlpha("en-US", { ignore: " " })
        .withMessage("Invalid state format.")
        .bail()
        .isLength({ min: 3, max: 20 })
        .withMessage("State must be between 3 to 20 characters."),

    // VALIDATE POSTAL CODE

    body("postalCode")
        .notEmpty()
        .withMessage("Postal code is required.")
        .bail()
        .isAlphanumeric("en-US", { ignore: " " })
        .withMessage("Invalid postal code format.")
        .bail()
        .isLength({ min: 3, max: 20 })
        .withMessage("Postal code must be between 3 to 20 characters."),

    // VALIDATE PHONE NUMBER

    body("phoneNumber").notEmpty().withMessage("Phone number is required.").bail().isMobilePhone().withMessage("Invalid phone number format."),

    // VALIDATE PAYMENT METHOD

    body("paymentMethod").notEmpty().withMessage("Payment method is required.").bail().isNumeric().withMessage("Invalid Payment method format.").bail().toInt().isIn([1, 2, 3]),

    // VALIDATE DELIVERY NOTES

    body("deliveryNotes").isString().withMessage("Invalid delivery notes format.").bail().isLength({ max: 1000 }).withMessage("Delivery notes should not exceed 1000 characters.").trim().escape(),
    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            req.flash("checkoutErr", validationErr.array());
            req.flash("checkoutErrData", {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                streetAddress: req.body.streetAddress,
                buildingNo: req.body.buildingNo,
                city: req.body.city,
                state: req.body.state,
                postalCode: req.body.postalCode,
                phoneNumber: req.body.phoneNumber,
                deliveryNotes: req.body.deliveryNotes ?? null,
            });
            return res.redirect("/checkout");
        }
        // if there's no errors in validation, go to the next middleware
        next();
    },
];

exports.changeOrderStatusValidator = [
    // VALIDATE FIRST NAME

    param("id").isMongoId().bail(),
    body("status").toInt().isIn([1, 2, 3, 4]),
    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            return res.redirect("/admin/orders");
        }
        // if there's no errors in validation, go to the next middleware
        next();
    },
];
