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
    const reqPromoCode = req.body.promocode;
    // VALIDATE IF PROMOCODE CAN BE USED
    if (reqPromoCode) {
        const promoCode = await PromoCode.isAvailable(reqPromoCode, req.user._id);
        if (promoCode) {
            req.app.set("promoCode", promoCode);
        } else {
            req.app.set("promoCode", null);
        }
    } else {
        req.app.set("promoCode", null);
    }
    res.redirect("/checkout");
};

exports.postRemovePromo = (req, res, next) => {
    req.app.set("promoCode", null);
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
                cart.items = cart.items.map((item) => {
                    let newItem = { ...item };
                    newItem = newItem._doc;
                    delete newItem.__v;
                    newItem.quantity = item.quantity;
                    return newItem;
                });
                const promoCode = req.app.get("promoCode") ?? null,
                    promoDiscount = req.app.get("promoDiscountValue") ?? 0,
                    order = new Order({
                        items: cart.items,
                        paymentMethod: paymentMethod,
                        price: cart.price,
                        shipping: cart.shipping,
                        shippingDetails: shippingDetails,
                        userID: req.user,
                        discountValue: promoDiscount,
                        promoCode: promoCode,
                    });
                // console.log(order);
                return order.save();
            })
            .then((createdOrder) => {
                if (createdOrder) {
                    req.user.cart = [];
                    req.app.set("promoCode", null);
                    req.app.set("promoDiscountValue", 0);
                    req.user
                        .save()
                        .then((newUser) => {
                            res.locals.cartItemsCount = 0;
                            res.render(`${VIEW_PREFIX}order_confirmation`, {
                                path: null,
                                pageTitle: `Order Confirmed`,
                                orderID: createdOrder._id,
                            });
                        })
                        .catch((err) => {
                            console.log("Cannot reset cart", err);
                            res.redirect("/checkout");
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
