const VIEW_PREFIX = "shop/";

// CART PAGE
exports.getCart = (req, res, next) => {
    req.user
        .getCart()
        .then((cart) => {
            res.render(`${VIEW_PREFIX}cart`, {
                cart: cart.items,
                total: +cart.price,
                shipping: +cart.shipping,
                items: +cart.itemsCount,
                pageTitle: "Your Cart",
                path: null,
            });
        })
        .catch((err) => {
            console.log(err);
            res.redirect("/");
        });
};

exports.postCart = (req, res, next) => {
    const productID = req.body.id,
        operationType = +req.body.type;
    let productQty = +req.body.quantity;
    if (productID && productQty && operationType && (operationType === 1 || operationType === 2)) {
        productQty = operationType === 1 ? productQty : productQty * -1;
        req.user
            .addToCart(productID, productQty)
            .then((cart) => {
                if (req.headers.referer === req.headers.origin + "/checkout") {
                    res.redirect("/checkout");
                } else {
                    res.redirect("/cart");
                }
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
    let productID = req.body.id;
    req.user
        .deleteCartProduct(productID)
        .then((result) => {
            if (req.headers.referer === req.headers.origin + "/checkout") {
                res.redirect("/checkout");
            } else {
                res.redirect("/cart");
            }
        })
        .catch((err) => {
            console.log("Cannot delete from cart", err);
            res.redirect("/cart");
        });
};
