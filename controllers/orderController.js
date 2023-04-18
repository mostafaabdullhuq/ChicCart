const { ObjectId } = require("mongodb");
const order = require("../models/order");

const PromoCode = require("../models/promocode"),
    Order = require("../models/order"),
    VIEW_PREFIX = "shop/",
    PdfDocument = require("pdfkit-table"),
    Stripe = require("stripe"),
    env = require("dotenv");

const STRIPE_API_SECRET = env.config().parsed.STRIPE_API_SECRET;
const stripe = Stripe(STRIPE_API_SECRET);

// CHECKOUT PAGE
exports.getCheckout = async (req, res, next) => {
    // REMOVE ANY PREVIOUS SAVED ORDERS
    req.flash("orderDetails");

    return req.user
        .getCart()
        .then(async (cart) => {
            if (cart?.items?.length) {
                return res.render(`${VIEW_PREFIX}checkout`, {
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
                    errors: req.flash("checkoutErr"),
                    errorData: req.flash("checkoutErrData")[0] ?? {},
                });
            } else res.redirect("/cart");
        })

        .catch((err) => {
            const error = new Error(`Cannot get checkout: ${err}`);
            return next(error);
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

exports.postCreateOrder = async (req, res, next) => {
    // REMOVE ANY PREVIOUS SAVED ORDERS
    req.flash("orderDetails");

    // VALIDATE ORDER FORM (SHIPPING DETAILS AND PAYMENT METHOD)
    let stripeSession;

    const paymentMethod = +req.body.paymentMethod;
    return req.user
        .getCart()
        .then(async (cart) => {
            // CHANGE CART ITEMS FORMAT
            cart.items = cart.items.map((item) => {
                let newItem = { ...item };
                newItem = newItem._doc;
                delete newItem.__v;
                newItem.quantity = item.quantity;
                return newItem;
            });

            const promoCode = req.app.get("promoCode") ?? null,
                promoDiscount = req.app.get("promoDiscountValue") ?? 0;

            // IF USER WILL PAY WITH STRIPE
            if (paymentMethod === 1) {
                // ADD PAYMENT ITEMS DETAILS
                let cartItems = cart.items.map((item) => {
                    return {
                        price_data: {
                            unit_amount: item.price * 100,
                            currency: "usd",
                            product_data: {
                                name: item.title,
                                description: item.description,
                            },
                        },
                        quantity: item.quantity,
                    };
                });
                cartItems.push({
                    price_data: {
                        unit_amount: cart.shipping * 100,
                        currency: "usd",
                        product_data: {
                            name: "Shipping",
                        },
                    },
                    quantity: 1,
                });

                // CONFIGURE STRIPE SESSION
                stripeSession = await stripe.checkout.sessions.create({
                    line_items: cartItems,
                    mode: "payment",
                    success_url: `${req.protocol}://${req.get("host")}/checkout/success?SESSION_ID={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${req.protocol}://${req.get("host")}/checkout`,
                });

                // ADD ORDER DETAILS TO THE REQUEST TEMPORARILY TO GET IT AFTER PAYMENT SUCCESS
                req.flash("orderDetails", {
                    items: cart.items,
                    paymentMethod: paymentMethod,
                    price: cart.price,
                    shipping: cart.shipping,
                    shippingDetails: {
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
                    userID: req.user._id,
                    discountValue: promoDiscount,
                    promoCode: promoCode,
                });
                return stripeSession;
            }

            // IF USER WILL PAY WITH CASH ON DELIVERY OR PAYPAL , CREATE ORDER AND SAVE IT
            return new Order({
                items: cart.items,
                paymentMethod: paymentMethod,
                price: cart.price,
                shipping: cart.shipping,
                shippingDetails: {
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
                userID: req.user,
                discountValue: promoDiscount,
                promoCode: promoCode,
            }).save();
        })
        .then((result) => {
            if (result) {
                // IF USER WON'T PAY WITH STRIPE
                if (result instanceof Order) {
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
                                orderID: result._id,
                            });
                        })
                        .catch((err) => {
                            const error = new Error(`Cannot reset cart: ${err}`);
                            return next(error);
                        });
                }

                // REDIRECT TO STRIPE PAGE
                else {
                    return res.redirect(result.url);
                }
            } else {
                res.redirect("/checkout");
            }
        })
        .catch((err) => {
            const error = new Error(`Error while creating order: ${err}`);
            return next(error);
        });
};

// WHEN STRIPE CHECKOUT SUCCESS
exports.getCheckoutSuccess = async (req, res, next) => {
    try {
        savedOrder = req.flash("orderDetails")[0];
    } catch {
        savedOrder = null;
    }

    const sessionID = req?.query?.SESSION_ID ?? null;

    // IF THERE'S A SAVED ORDER BEFORE STRIPE CHECKOUT
    if (savedOrder && sessionID) {
        let session;
        try {
            session = await stripe.checkout.sessions.retrieve(sessionID);
        } catch {
            session = null;
        }

        if (session && session.status === "complete" && session.payment_status === "paid") {
            savedOrder.items.map((item) => {
                item._id = new ObjectId(item._id);
                item.userID = new ObjectId(item.userID);
                return item;
            });

            const order = new Order({
                items: savedOrder.items,
                paymentMethod: savedOrder.paymentMethod,
                price: savedOrder.price,
                shipping: savedOrder.shipping,
                shippingDetails: savedOrder.shippingDetails,
                userID: savedOrder.userID,
                discountValue: savedOrder.discountValue,
                promoCode: savedOrder.promoCode,
            });
            return order
                .save()
                .then((created) => {
                    req.user.cart = [];
                    req.app.set("promoCode", null);
                    req.app.set("promoDiscountValue", 0);
                    req.user
                        .save()
                        .then((_) => {
                            res.locals.cartItemsCount = 0;
                            res.render(`${VIEW_PREFIX}order_confirmation`, {
                                path: null,
                                pageTitle: `Order Confirmed`,
                                orderID: created._id,
                            });
                        })
                        .catch((err) => {
                            const error = new Error(`Cannot reset cart: ${err}`);
                            return next(error);
                        });
                })
                .catch((err) => {
                    const error = new Error(`Error creating order success: ${err}`);
                    return next(error);
                });
        }
    }
    req.flash("orderDetails");
    return res.redirect("/checkout");
};

exports.getOrder = (req, res, next) => {
    return Order.findOne({
        _id: req.params.id,
    })
        .populate("userID")
        .populate("promoCode")
        .then((order) => {
            return res.render(`${VIEW_PREFIX}order`, {
                path: null,
                pageTitle: `Order Details`,
                order: order,
            });
        })
        .catch((err) => {
            return next(`get all orders error ${err}`);
        });
};

exports.getUserOrders = (req, res, next) => {
    return Order.find({
        userID: req.user._id,
    })
        .populate("userID")
        .populate("promoCode")
        .then((orders) => {
            return res.render(`${VIEW_PREFIX}orders`, {
                path: null,
                pageTitle: `All Orders`,
                orders: orders,
            });
        })
        .catch((err) => {
            return next(`get all orders error ${err}`);
        });
};

// FUNCTION THAT GENERATES AN ORDER INVOICE PDF ON THE FLY
function generateInvoice(order, invoiceName, req, res, next) {
    const pdfDoc = new PdfDocument({ size: "A4" });
    try {
        // POPULATE PDF FILE WITH DETAILS
        pdfDoc.pipe(res); // IF YOU WANT TO SEND THE PDF TO THE RESPONSE ONLY
        pdfDoc.font("Helvetica-Bold");
        pdfDoc.fontSize(20).text(`Order Invoice`, {
            underline: true,
            align: "center",
        });
        pdfDoc.moveDown(); // Move line down
        let paymentMethod = "";
        if (order.paymentMethod === 1) {
            paymentMethod = "Credit Card";
        } else if (order.paymentMethod === 2) {
            paymentMethod = "Cash On Delivery";
        } else {
            paymentMethod = "PayPal";
        }

        //! ORDER DETAILS TABLE
        pdfDoc.table(
            // table content
            {
                headers: [
                    { align: "left", valign: "center" },
                    { align: "left", valign: "center" },
                ],
                rows: [
                    ["ID:", order._id],
                    ["Date:", new Date(order.createdAt).toDateString()],
                    ["Payment:", paymentMethod],
                ],
            },
            // table options
            {
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    pdfDoc.font("Helvetica-Bold").fontSize(11);
                    // indexColumn === 2 && pdfDoc.addBackground(rectRow, "gray", 0.1);
                },
                hideHeader: true,
                divider: {
                    horizontal: { disabled: true, width: 0.5, opacity: 0.5 },
                },
                columnsSize: [70, 400],
                title: "Order Details",
            }
        );

        pdfDoc.moveDown();

        //! SHIPPING DETAILS TABLE
        pdfDoc.table(
            // table content
            {
                headers: [{ align: "left", valign: "center" }],
                rows: [
                    [`${order.shippingDetails.firstName} ${order.shippingDetails.lastName}`],
                    [`${order.shippingDetails.buildingNo} ${order.shippingDetails.streetAddress}`],
                    [`${order.shippingDetails.state}, ${order.shippingDetails.city}`],
                    [`${order.shippingDetails.postalCode}`],
                    [`${order.shippingDetails.phoneNumber}`],
                ],
            },
            // table options
            {
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    pdfDoc.font("Helvetica").fontSize(11);
                },
                hideHeader: true,
                divider: {
                    horizontal: { disabled: true, width: 0.5, opacity: 0.5 },
                },
                title: "Shipping Details",
            }
        );
        pdfDoc.moveDown();
        //! ORDER ITEMS TABLE
        const itemsTableRows = [];
        order.items.forEach((item) => {
            itemsTableRows.push([item.title, item.quantity, "$" + item.price * item.quantity]);
        });
        pdfDoc.table(
            // table content
            {
                headers: [
                    { label: "Product title", width: 300, align: "center", valign: "center" },
                    { label: "Qty", width: 50, align: "center", valign: "center" },
                    { label: "Total price", width: 100, align: "center", valign: "center" },
                ],
                rows: itemsTableRows,
            },
            // table options
            {
                prepareHeader: () => pdfDoc.font("Helvetica-Bold").fontSize(12),
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    pdfDoc.font("Helvetica").fontSize(10);
                    indexColumn === 0 && pdfDoc.addBackground(rectRow, "blue", 0.1);
                },
                padding: 10,
            }
        );

        //! ORDER SUMMARY DETAILS TABLE
        pdfDoc.table(
            // table content
            {
                headers: [
                    { align: "left", valign: "center" },
                    { align: "center", valign: "center" },
                ],
                rows: [
                    ["SUBTOTAL", "$" + order.price],
                    ["SHIPPING", "$" + order.shipping],
                    ["DISCOUNT", "- $" + order.discountValue],
                    ["TOTAL", "$" + (order.price + order.shipping - order.discountValue)],
                ],
            },
            // table options
            {
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    pdfDoc.font("Helvetica-Bold").fontSize(11);
                },
                hideHeader: true,
                width: 200,
                x: 320,
                divider: {
                    horizontal: { disabled: true, width: 0.5, opacity: 0.5 },
                },
            }
        );
    } catch (err) {
        console.log(err);
    }
    return pdfDoc.end(); // END GENERATING THE PDF
}

exports.getOrderInvoice = (req, res, next) => {
    const orderID = req.params.id;
    Order.findById(orderID)
        .populate("userID")
        .then((order) => {
            if (order && (order?.userID?.toString() === req?.user?._id?.toString() || req.user.isAdmin)) {
                const invoiceName = `invoice-${orderID}.pdf`;
                // const pdfDoc = new PdfDocument({ size: "A4" });

                res.setHeader("Content-Type", "application/pdf"); // TO TELL THE BROWSER THAT THE FILE IS PDF
                res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`); // TO TELL THE BROWSER to open the file in the browser and set it's name
                return generateInvoice(order, invoiceName, req, res, next);
            }

            return res.redirect("/orders");
        })
        .catch((err) => {
            return next(`Cannot get order invoice, ${err}`);
        });
};
