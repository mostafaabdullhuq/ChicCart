const OrderShipping = require("../models/ordershipping");
const PromoCode = require("../models/promocode"),
    Order = require("../models/order");

const VIEW_PREFIX = "shop/",
    Image = require("../models/image"),
    { Op } = require("sequelize");

const validateOrder = (shippingDetails, paymentMethod) => {
    const validationResult = {
        isValid: true,
        errors: [],
    };

    // VALIDATE PAYMENT METHOD
    if (![1, 2, 3].includes(+paymentMethod)) {
        validationResult.errors.push("Select a valid payment method.");
    }

    // VALIDATE FIRST NAME (MATCH LETTERS ONLY BETWEEN 2 TO 20 CHARACTERS)
    if (!/^[\p{Letter}\p{Mark}\s]{2,20}$/u.test(shippingDetails.firstName)) {
        console.log(shippingDetailsl.firstName);
        validationResult.errors.push("Invalid first name format.");
    }

    // VALIDATE LAST NAME (MATCH LETTERS ONLY BETWEEN 2 TO 20 CHARACTERS)
    if (!/^[\p{Letter}\p{Mark}\s]{2,20}$/u.test(shippingDetails.lastName)) {
        console.log(shippingDetails.lastName);
        validationResult.errors.push("Invalid last name format.");
    }

    // VALIDATE STREET ADDRESS (MATCH LETTERS, SPACES, DIGITS, - AND LENGTH BETWEEN 5 TO 100 )
    if (!/^[\p{Letter}\p{Mark}\s\d-]{5,100}$/u.test(shippingDetails.streetAddress)) {
        validationResult.errors.push("Invalid street address format.");
    }

    // VALIDATE BUILDING NUMBER (MATCH LETTERS, SPACES, DIGITS, - AND LENGTH BETWEEN 1 TO 10 )
    if (!/^[\p{Letter}\p{Mark}\s\d-]{1,10}$/u.test(shippingDetails.buildingNo)) {
        validationResult.errors.push("Invalid building number format.");
    }

    // VALIDATE CITY (MATCH LETTERS, SPACES, DIGITS, - AND LENGTH BETWEEN 1 TO 10 )
    if (!/^[\p{Letter}\p{Mark}\s\d-]{3,20}$/u.test(shippingDetails.city)) {
        validationResult.errors.push("Invalid city format.");
    }

    // VALIDATE STATE (MATCH LETTERS, SPACES, DIGITS, - AND LENGTH BETWEEN 1 TO 10 )
    if (!/^[\p{Letter}\p{Mark}\s\d-]{3,20}$/u.test(shippingDetails.state)) {
        validationResult.errors.push("Invalid state format.");
    }

    // VALIDATE POSTAL CODE (MATCH LETTERS, SPACES, DIGITS, - AND LENGTH BETWEEN 1 TO 10 )
    if (!/^[\p{Letter}\p{Mark}\s\d-]{3,20}$/u.test(shippingDetails.postalCode)) {
        validationResult.errors.push("Invalid postal code format.");
    }
    // VALIDATE PHONE NUMBER (MATCH + (NOT REQUIRED), DIGITS, SPACES )
    if (!/^\+?(?:[0-9] ?){6,14}[0-9]$/u.test(shippingDetails.phoneNumber)) {
        validationResult.errors.push("Invalid phone number format.");
    }

    if (validationResult.errors.length) {
        validationResult.isValid = false;
    }
    return validationResult;
};

const promoValidator = async (reqPromoCode = null, req = null) => {
    if (reqPromoCode && req) {
        try {
            const promoCodes = await PromoCode.findAll({
                where: {
                    code: { [Op.like]: reqPromoCode },
                    expireDate: {
                        [Op.gt]: new Date(),
                    },
                },
            });
            if (promoCodes.length) {
                const promoCode = promoCodes[0];
                const promoCodeOrders = await promoCode.getOrders();
                // CHECK IF USER USED THE PROMOCODE BEFORE
                const isPromoExist = await req.user.getPromocodes({
                    where: {
                        id: promoCode.id,
                    },
                });
                // IF USER DIDN'T USE THE PROMOCODE MORE THAN THE MAXIMUM PROMOCODE PER USER USE
                // AND THE PROMOCODE MAX USE COUNT PER ALL USERS NOT EXCEEDED, THEN THE PROMOCODE IS VALID TO USE
                if (promoCodeOrders.length < promoCode.maxUseCount && !(+isPromoExist[0]?.userspromocode?.useCount >= +promoCode.perUserMaxUse)) {
                    return promoCode;
                }
            }
        } catch (err) {
            console.log("error validating promocode, ", err);
        }
    }
    return false;
};

// CHECKOUT PAGE
exports.getCheckout = async (req, res, next) => {
    let fetchedCart;
    req.user
        .getCart()
        .then((cart) => {
            fetchedCart = cart;
            return cart.getProducts({
                include: [Image],
            });
        })
        .then(async (products) => {
            if (products.length) {
                res.render(`${VIEW_PREFIX}checkout`, {
                    products: products,
                    pageTitle: "Order Checkout",
                    path: null,
                    itemsCount: fetchedCart.totalItems,
                    totalPrice: fetchedCart.totalPrice,
                    totalShipping: fetchedCart.totalShipping,
                    promoCode: req.app.get("promoCode") ?? false,
                    promoDiscountValue: req.app.get("promoDiscountValue") ?? 0,
                    user: {
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        streetAddress: req.user.address,
                        buildingNo: req.user.building,
                        city: req.user.city,
                        state: req.user.state,
                        postalCode: req.user.postal,
                        phoneNumber: req.user.phoneNumber,
                    },
                });
            } else res.redirect("/cart");
        })
        .catch((err) => {
            console.log(`cannot get checkout, ${err}`);
        });
};

exports.postAddPromo = async (req, res, next) => {
    const reqPromoCode = req.body.promocode;

    // VALIDATE IF PROMOCODE CAN BE USED
    const promoCode = await promoValidator(reqPromoCode, req);
    if (promoCode) {
        req.app.set("promoCode", promoCode.code);
    } else {
        req.app.set("promoCode", false);
    }
    res.redirect("/checkout");
};

exports.postRemovePromo = (req, res, next) => {
    req.app.set("promoCode", false);
    req.app.set("promoDiscountValue", 0);
    res.redirect("/checkout");
};

exports.postCreateOrder = (req, res, next) => {
    // IF THERE'S A PROMOCODE ENTERED BY USER IN CHECKOUT
    const shippingDetails = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            streetAddress: req.body.streetAddress,
            buildingNo: req.body.buildingNo,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postalCode,
            phoneNumber: req.body.phoneNumber,
            deliveryNotes: req.body.deliveryNotes ?? null,
        },
        paymentMethod = +req.body.paymentMethod;
    // VALIDATE ORDER FORM (SHIPPING DETAILS AND PAYMENT METHOD)
    const orderValidation = validateOrder(shippingDetails, paymentMethod);
    if (orderValidation.isValid) {
        let fetchedCart, placedOrder;
        // GET USER CART DETAILS
        req.user
            .getCart()
            .then((cart) => {
                fetchedCart = cart;
                if (+cart.totalItems > 0) {
                    return cart;
                }
                return null;
            })
            .then((cart) => {
                if (cart) {
                    // CREATE NEW ORDER FOR THE USER
                    return req.user.createOrder({
                        totalItems: fetchedCart.totalItems,
                        totalPrice: fetchedCart.totalPrice - req.app.get("promoDiscountValue") ?? 0,
                        paymentMethod: paymentMethod,
                    });
                }
                return null;
            })
            .then((order) => {
                if (order) {
                    placedOrder = order;
                    // GET ALL PRODUCTS IN USER CART
                    return fetchedCart.getProducts();
                }
                return null;
            })
            .then((cartProducts) => {
                if (placedOrder) {
                    // MODIFY CART PRODUCTS (ADD QUANTITY, TOTAL PRICE AND SHIPPING PRICE), THEN ADD THEM TO THE ORDER ITEMS
                    return placedOrder.addProducts(
                        cartProducts.map((cartProduct) => {
                            cartProduct.orderitem = {
                                quantity: cartProduct.cartsproduct.quantity,
                                totalItemPrice: cartProduct.cartsproduct.totalPrice,
                                totalShippingPrice: cartProduct.cartsproduct.shippingPrice,
                            };
                            return cartProduct;
                        })
                    );
                }
                return null;
            })
            // CREATE SHIPPING DETAILS INSTANCE AND ADD THEM TO THE ORDER
            .then((orderItems) => {
                if (placedOrder) {
                    return OrderShipping.create(shippingDetails);
                }
                return null;
            })
            .then((shippingDetails) => {
                if (placedOrder) {
                    return placedOrder.setOrdershipping(shippingDetails);
                }
                return null;
            })
            // IF THERE'S A PROMOCODE
            .then((orderShipping) => {
                if (placedOrder) {
                    return promoValidator(req.app.get("promoCode") ?? false, req);
                }
                return false;
            })
            .then(async (promoCode) => {
                if (promoCode) {
                    // IF THE PROMOCODE IS VALID TO USE, THEN APPLY IT TO THE ORDER
                    await placedOrder.setPromocode(promoCode);
                    const isPromoExist = await req.user.getPromocodes({
                        where: {
                            id: promoCode.id,
                        },
                    });
                    if (isPromoExist.length) {
                        // IF USER USED IT BEFORE INCREMENT THE USE COUNT FOR THE USER
                        isPromoExist[0].userspromocode.useCount += 1;
                        isPromoExist[0].userspromocode.save();
                    } else {
                        // IF USER USE THE PROMOCODE FOR THE FIRST TIME ADD IT TO THE USER USED PROMOCODES
                        await req.user.addPromocode(promoCode);
                    }
                }
                return promoCode;
            })
            .then(async (_) => {
                if (placedOrder) {
                    // RESET USER CART, PROMOCODE
                    req.app.set("promoCode", false);
                    req.app.set("promoDiscountValue", 0);
                    await fetchedCart.setProducts([]);
                    res.render(`${VIEW_PREFIX}order_confirmation`, {
                        path: null,
                        pageTitle: "Order Confirmed",
                        orderID: placedOrder.id,
                    });
                } else {
                    res.redirect("/cart");
                }
            })
            .catch((err) => {
                console.log("Cannot create order, ", err);
            });
    } else {
        console.log(orderValidation);
        res.redirect("/checkout");
    }
};
