const PromoCode = require("../models/promocode"),
    Order = require("../models/order"),
    VIEW_PREFIX = "shop/";


    // CHECKOUT PAGE
exports.getCheckout = async (req, res, next) => {
    req.user
        .getCart()
        .then((cart) => {
            if (cart?.items?.length) {
                res.render(`${VIEW_PREFIX}checkout`, {
                    products: cart.items,
                    pageTitle: "Order Checkout",
                    path: null,
                    itemsCount: cart.itemsCount,
                    totalPrice: cart.price,
                    totalShipping: cart.shipping,
                    promoCode: req.app.get("promoCode")?.code ?? false,
                    promoDiscountValue: req.app.get("promoDiscountValue") ?? 0,
                    user: {
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        streetAddress: req.user.address,
                        buildingNo: req.user.building,
                        city: req.user.city,
                        state: req.user.state,
                        postalCode: req.user.postalCode,
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
    const reqPromoCode = req.body.promocode,
        userID = req.user._id;
    // VALIDATE IF PROMOCODE CAN BE USED
    if (reqPromoCode && userID) {
        const promoCode = await PromoCode.isAvailable(reqPromoCode, userID);
        if (promoCode) {
            req.app.set("promoCode", promoCode);
        } else {
            req.app.set("promoCode", false);
        }
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
        paymentMethod = +req.body.paymentMethod,
        userID = req.user._id;
    // VALIDATE ORDER FORM (SHIPPING DETAILS AND PAYMENT METHOD)
    if (shippingDetails && paymentMethod && userID) {
        req.user
            .getCart()
            .then(async (cart) => {
                const promoCode = req.app.get("promoCode") ?? null,
                    order = new Order(null, cart.items, cart.price, cart.shipping, promoCode, shippingDetails, paymentMethod),
                    isOrderValid = order.validate();

                if (isOrderValid.isValid) {
                    order.discountValue = await order.calculateDiscount();
                    req.user
                        .createOrder(order)
                        .then((createdOrder) => {
                            const insertedId = createdOrder?.insertedId ?? false;
                            if (insertedId) {
                                req.user.clearCart();
                                req.app.set("promoCode", false);
                                req.app.set("promoDiscountValue", 0);
                                order._id = insertedId;
                                res.render(`${VIEW_PREFIX}order_confirmation`, {
                                    path: null,
                                    pageTitle: `Order Confirmed`,
                                    orderID: insertedId,
                                });
                            } else {
                                res.redirect("/checkout");
                            }
                        })
                        .catch((err) => {
                            res.redirect("/checkout");
                            console.log("Cannot create order", err);
                        });
                } else {
                    res.redirect("/checkout");
                }
            })
            .catch((err) => {
                console.log("Error while creating order", err);
                res.redirect("/checkout");
            });
    }
};
