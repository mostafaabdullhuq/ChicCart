const Product = require("../models/product");
const Image = require("../models/image");
const VIEW_PREFIX = "shop/";

// CART PAGE
exports.getCart = (req, res, next) => {
    req.user
        .getCart()
        .then(async (cart) => {
            const cartItems = await cart.getProducts({
                include: [Image],
            });
            res.render(`${VIEW_PREFIX}cart`, {
                cart: cartItems,
                total: +cart.totalPrice,
                shipping: +cart.totalShipping,
                items: +cart.totalItems,
                pageTitle: "Your Cart",
                path: null,
            });
        })
        .catch((err) => {
            console.log("Cannot get user cart", err);
            res.redirect("/");
        });
};

exports.postCart = (req, res, next) => {
    const productID = +req.body.id,
        productQty = +req.body.quantity,
        operationType = +req.body.type;
    let userCart = null;
    if (productID && productQty && operationType && (operationType === 1 || operationType === 2)) {
        req.user
            .getCart()
            .then((cart) => {
                userCart = cart;
                return cart.getProducts({
                    where: {
                        id: +productID,
                    },
                });
            })
            .then((products) => {
                if (products.length) {
                    let product = products[0];
                    product.cartsproduct.quantity = operationType === 1 ? product.cartsproduct.quantity + +productQty : product.cartsproduct.quantity - +productQty;
                    return product.cartsproduct.save();
                }
                return null;
            })
            .then((saveResult) => {
                if (!saveResult) {
                    return Product.findByPk(productID)
                        .then((product) => {
                            return userCart.addProduct(product, {
                                through: {
                                    quantity: productQty,
                                },
                            });
                        })
                        .catch((err) => {
                            console.log("error finding product, ", err);
                            return null;
                        });
                }
                return saveResult;
            })
            .then((saveResult) => {
                if (saveResult) {
                    if (req.headers.referer === req.headers.origin + "/checkout") {
                        res.redirect("/checkout");
                    } else {
                        res.redirect("/cart");
                    }
                } else res.redirect("/");
            })
            .catch((err) => {
                console.log("cannot add to cart,", err);
                res.redirect("/");
            });
    } else {
        res.redirect("/");
    }
};

exports.getDeleteCart = (req, res, next) => {
    let productID = +req.body.id;
    req.user
        .getCart()
        .then(async (cart) => {
            let product = await Product.findByPk(productID);
            if (product) {
                return cart.removeProduct(product);
            }
            return null;
        })
        .then((deleteResult) => {
            if (req.headers.referer === req.headers.origin + "/checkout") {
                res.redirect("/checkout");
            } else {
                res.redirect("/cart");
            }
        })
        .catch((err) => {
            console.log(`Cannot delete cart product, ${err}`);
            res.redirect("/cart");
        });
};
