const express = require("express"),
    bodyParser = require("body-parser"),
    adminRoutes = require("./routes/admin"),
    shopRoutes = require("./routes/shop"),
    authRoutes = require("./routes/auth"),
    path = require("path"),
    errorController = require("./controllers/errorController"),
    { mongoConnection, mongoDB } = require("./database/database"),
    Product = require("./models/product"),
    User = require("./models/user");
const PromoCode = require("./models/promocode");
// sequelize = require("./database/database"),
// User = require("./models/user"),
// Product = require("./models/product"),
// Cart = require("./models/cart"),
// Image = require("./models/image"),
// productSeeder = require("./database/seeders/products"),
// CartsProducts = require("./models/cartsproduct"),
// Order = require("./models/order"),
// OrderItems = require("./models/ordersitem"),
// PromoCode = require("./models/promocode"),
// UserPromoCode = require("./models/userspromocode"),
// OrderShipping = require("./models/ordershipping"),
// { Op } = require("sequelize");

const app = express();

//! SETUP VIEWS !//
app.set("view engine", "ejs");
app.set("views", "views");

//! SETUP PARSER !//
app.use(bodyParser.urlencoded({ extended: false })); // PARSE INCOMING REQUESTS BODIES

//! SETUP PUBLIC FOLDERS TO ACCESS WITHOUT ACCESS RESTRICTIONS !//
app.use(express.static(path.join(__dirname, "public"))); // SERVE PUBLIC FOLDER SO THAT IT'S ALL INSIDE FILES AND FOLDERS ARE AVAILABLE TO ACCESS FROM ANYWHERE
app.use(express.static(path.join(__dirname, "node_modules"))); // SERVE PUBLIC FOLDER SO THAT IT'S ALL INSIDE FILES AND FOLDERS ARE AVAILABLE TO ACCESS FROM ANYWHERE

app.use((req, res, next) => {
    res.locals.loginUser = "mostafaabdullhuq";
    res.locals.cartItemsCount = 0;
    next();
});

//! SET DEFAULT USER #FOR DEVELOPMENT PURPOSES ONLY, REMOVE IN PRODUCTION# !//

// SET REQUEST USER TO THE TEST USER CREATED
app.use((req, res, next) => {
    User.getAllUsers()
        .then(async (users) => {
            if (users.length) {
                req.user = new User(
                    users[0].firstName,
                    users[0].lastName,
                    users[0].username,
                    users[0].email,
                    users[0].password,
                    users[0].isAdmin,
                    users[0].city,
                    users[0].address,
                    users[0].postalCode,
                    users[0].building,
                    users[0].state,
                    users[0].phoneNumber,
                    users[0]._id
                );
            } else {
                req.user = null;
            }
        })

        .catch((err) => {
            req.user = null;
            console.log("Cannot get user", err);
        })
        .finally((_) => {
            next();
        });
});

// MIDDLEWARE TO CHECK IF USER IS ADMIN FOR PRODUCTS CONTROL AUTHORIZATION
// app.use("/admin", (req, res, next) => {
//     if (req.user?.isAdmin) {
//         next();
//     } else {
//         res.redirect("/");
//     }
// });

// UPDATE HEADER CART TOTAL ITEMS AND LOGIN STATUS
// app.use((req, res, next) => {
//     res.locals.cartItemsCount = 0;
//     if (req.user) {
//         res.locals.loginUser = req.user.username;
//         req.user
//             .getCart()
//             .then((cart) => {
//                 res.locals.cartItemsCount = cart.totalItems;
//             })
//             .catch((err) => {
//                 console.log("error while getting user cart items count", err);
//             });
//     } else {
//         res.locals.loginUser = false;
//     }
//     next();
// });

// MIDDLEWARE FOR UPDATING PROMOCODE DISCOUNT
// app.use("/checkout", async (req, res, next) => {
//     const reqPromoCode = req.app.get("promoCode") ?? false;
//     if (reqPromoCode) {
//         let promoCode = false,
//             promoDiscountValue = 0;
//         const promoCodes = await PromoCode.findAll({
//             where: {
//                 code: { [Op.like]: reqPromoCode },
//                 expireDate: {
//                     [Op.gt]: new Date(),
//                 },
//             },
//         });
//         if (promoCodes.length) {
//             promoCode = promoCodes[0];
//             // IF DISCOUNT IS PERCENTAGE
//             if (promoCode.discountType === 1) {
//                 let fetchedCart = await req.user.getCart();
//                 // CALCULATE THE PERCENTAGE OF TOTAL PRICE TO BE APPLIED
//                 promoDiscountValue = (+fetchedCart.totalPrice * (+promoCode.discountValue / 100)).toFixed(2);
//                 // IF THERE'S LIMIT TO DISCOUNT AND THE DISCOUNT VALUE BIGGER THAN THE MAX SET THE DISCOUNT TO THE MAX
//                 if (promoDiscountValue > +promoCode.maxDiscount) {
//                     promoDiscountValue = +promoCode.maxDiscount;
//                 }
//                 // IF DISCOUNT IS VALUE
//             } else {
//                 promoDiscountValue = +promoCode.discountValue;
//             }
//             req.app.set("promoDiscountValue", promoDiscountValue);
//         }
//     }
//     next();
// });

//! ROUTES !//

// UPDATE PROMOCODE DISCOUNT WHEN UPDATING CART OR CHECKOUT
app.use(["/checkout", "/cart"], (req, res, next) => {
    let promoCode = req.app.get("promoCode") ?? false;
    if (promoCode) {
        let promoExpireDate = new Date(promoCode.expireDate);
        if (promoExpireDate > new Date()) {
            req.user
                .calculateCartDiscount(promoCode)
                .then((discount) => {
                    req.app.set("promoDiscountValue", discount);
                    next();
                })
                .catch((err) => {
                    console.log("Cannot calculate promo discount", err);
                    req.app.set("promoDiscountValue", 0);
                    req.app.set("promoCode", false);
                    next();
                });
        } else {
            req.app.set("promoCode", false);
            req.app.set("promoDiscountValue", 0);
            next();
        }
    } else {
        req.app.set("promoCode", false);
        req.app.set("promoDiscountValue", 0);
        next();
    }
});

app.use("/admin", adminRoutes); // MAKE PREFIX /admin TO ALL ROUTES IN THIS FILE
app.use(authRoutes);
app.use(shopRoutes);

app.use("/", errorController.get404); // IF ALL UPPER MIDDLEWARES NOT MATCHED, THEN THIS MIDDLEWARE WILL BE ACTIVATED AS 404 ERROR PAGE

//! TRIGGERS (EVENTS) FOR TABLES OPERATIONS !//

// async function productPriceUpdate(cartProd) {
//     if (cartProd.quantity === 0) {
//         cartProd.destroy();
//     } else {
//         let product = await Product.findByPk(cartProd.productId);
//         cartProd.totalPrice = +product.price * +cartProd.quantity;
//         cartProd.shippingPrice = +product.shippingPrice;
//     }
// }

// async function cartSummaryUpdate(cartProd, type = false) {
//     const cartId = type ? cartProd : cartProd.cartId,
//         cart = await Cart.findByPk(cartId);

//     let cartProducts = await CartsProducts.findAll({
//         where: {
//             cartId: cartId,
//         },
//     });
//     cart.totalPrice = 0;
//     cart.totalShipping = 0;
//     cart.totalItems = 0;
//     cartProducts.forEach((product) => {
//         cart.totalPrice += +product.totalPrice;
//         cart.totalShipping += +product.shippingPrice;
//         cart.totalItems += +product.quantity;
//     });
//     await cart.save();
// }

// // BEFORE ADDING NEW PRODUCT TO CART, UPDATE THE TOTAL PRICE OF THE PRODUCT IN CARTS PRODUCTS TABLE
// CartsProducts.beforeBulkCreate(async (cartProds, options) => {
//     await productPriceUpdate(cartProds[0]);
// });

// // BEFORE PRODUCT QUANTITY CHANGES, UPDATE THE TOTAL PRICE OF THE PRODUCT IN CARTS PRODUCTS TABLE
// CartsProducts.beforeSave(async (cartProd, options) => {
//     await productPriceUpdate(cartProd);
// });

// // AFTER ADDING NEW PRODUCT TO CART, UPDATE THE CART SUMMARY
// CartsProducts.afterBulkCreate(async (cartProds, options) => {
//     await cartSummaryUpdate(cartProds[0]);
// });

// // AFTER ADDING NEW PRODUCT TO CART , UPDATE THE CART SUMMARY
// CartsProducts.afterSave(async (cartProd, options) => {
//     await cartSummaryUpdate(cartProd);
// });

// // WHEN PRODUCT QUANTITY CHANGES, UPDATE THE TOTAL PRICE OF THE PRODUCT IN CARTS PRODUCTS TABLE
// CartsProducts.afterBulkDestroy(async (cartProd, options) => {
//     let cartId = cartProd.where.cartId;
//     await cartSummaryUpdate(cartId, true);
// });

mongoConnection
    .then(async (_) => {
        // CREATE NEW DUMMY USER IF THERE'S NO USERS IN DATABASE
        let users = await User.getAllUsers();
        let initUser;
        if (!users.length) {
            initUser = new User("Admin", "Test", "admin", "admin@test.com", "admin123", true, "Alex", "Fifty Street", "21910", "2", "Arizo", "+201928393843");
            initUser.save();
        } else {
            initUser = users[0];
        }

        // GENERATE PRODUCTS
        let existingProducts = await Product.getAllProducts();
        if (!existingProducts.length) {
            Product.generateProducts(initUser._id)
                .then((insertedProducts) => {})
                .catch((err) => {
                    console.log("Cannot generate products", err);
                });
        }

        // GENERATE PROMOCODES
        let existingPromoCodes = await PromoCode.getAllPromoCodes();
        if (!existingPromoCodes.length) {
            let promo20 = new PromoCode(null, "WELCOME20", 1, 20, 200, 10, 2, "2023-5-10");
            promo20.save();
            let promo100 = new PromoCode(null, "WELCOME100", 1, 100, 1000000, 10, 1, "2025-5-10");
            promo100.save();
        }
        app.listen(8000);
    })
    .catch((err) => {
        console.log("Cannot connect to database", err);
    });
