const express = require("express"),
    bodyParser = require("body-parser"),
    adminRoutes = require("./routes/admin"),
    shopRoutes = require("./routes/shop"),
    authRoutes = require("./routes/auth"),
    path = require("path"),
    errorController = require("./controllers/errorController"),
    sequelize = require("./database/database"),
    User = require("./models/user"),
    Product = require("./models/product"),
    Cart = require("./models/cart"),
    Image = require("./models/image"),
    productSeeder = require("./database/seeders/products"),
    CartsProducts = require("./models/cartsproduct"),
    Order = require("./models/order"),
    OrderItems = require("./models/ordersitem"),
    PromoCode = require("./models/promocode"),
    UserPromoCode = require("./models/userspromocode"),
    OrderShipping = require("./models/ordershipping"),
    { Op } = require("sequelize");

const app = express();

//! SETUP VIEWS !//
app.set("view engine", "ejs");
app.set("views", "views");

//! SETUP PARSER !//
app.use(bodyParser.urlencoded({ extended: false })); // PARSE INCOMING REQUESTS BODIES

//! SETUP PUBLIC FOLDERS TO ACCESS WITHOUT ACCESS RESTRICTIONS !//
app.use(express.static(path.join(__dirname, "public"))); // SERVE PUBLIC FOLDER SO THAT IT'S ALL INSIDE FILES AND FOLDERS ARE AVAILABLE TO ACCESS FROM ANYWHERE
app.use(express.static(path.join(__dirname, "node_modules"))); // SERVE PUBLIC FOLDER SO THAT IT'S ALL INSIDE FILES AND FOLDERS ARE AVAILABLE TO ACCESS FROM ANYWHERE

//! SET DEFAULT USER #FOR DEVELOPMENT PURPOSES ONLY, REMOVE IN PRODUCTION# !//

// SET REQUEST USER TO THE TEST USER CREATED
app.use((req, res, next) => {
    User.findByPk(1)
        .then((user) => {
            req.user = user;
            next();
        })
        .catch((err) => {
            req.user = null;
            console.log("error assigning request user", err);
        });
});

// MIDDLEWARE TO CHECK IF USER IS ADMIN FOR PRODUCTS CONTROL AUTHORIZATION
app.use("/admin", (req, res, next) => {
    if (req.user.isAdmin) {
        next();
    } else {
        res.redirect("/");
    }
});

// UPDATE HEADER CART TOTAL ITEMS AND LOGIN STATUS
app.use((req, res, next) => {
    res.locals.cartItemsCount = 0;
    if (req.user) {
        res.locals.loginUser = req.user.username;
        req.user
            .getCart()
            .then((cart) => {
                res.locals.cartItemsCount = cart.totalItems;
            })
            .catch((err) => {
                console.log("error while getting user cart items count", err);
            });
    } else {
        res.locals.loginUser = false;
    }
    next();
});

// MIDDLEWARE FOR UPDATING PROMOCODE DISCOUNT
app.use("/checkout", async (req, res, next) => {
    const reqPromoCode = req.app.get("promoCode") ?? false;
    if (reqPromoCode) {
        let promoCode = false,
            promoDiscountValue = 0;
        const promoCodes = await PromoCode.findAll({
            where: {
                code: { [Op.like]: reqPromoCode },
                expireDate: {
                    [Op.gt]: new Date(),
                },
            },
        });
        if (promoCodes.length) {
            promoCode = promoCodes[0];
            // IF DISCOUNT IS PERCENTAGE
            if (promoCode.discountType === 1) {
                let fetchedCart = await req.user.getCart();
                // CALCULATE THE PERCENTAGE OF TOTAL PRICE TO BE APPLIED
                promoDiscountValue = (+fetchedCart.totalPrice * (+promoCode.discountValue / 100)).toFixed(2);
                // IF THERE'S LIMIT TO DISCOUNT AND THE DISCOUNT VALUE BIGGER THAN THE MAX SET THE DISCOUNT TO THE MAX
                if (promoDiscountValue > +promoCode.maxDiscount) {
                    promoDiscountValue = +promoCode.maxDiscount;
                }
                // IF DISCOUNT IS VALUE
            } else {
                promoDiscountValue = +promoCode.discountValue;
            }
            req.app.set("promoDiscountValue", promoDiscountValue);
        }
    }
    next();
});

//! ROUTES !//

app.use("/admin", adminRoutes); // MAKE PREFIX /admin TO ALL ROUTES IN THIS FILE
app.use(authRoutes);
app.use(shopRoutes);

app.use("/", errorController.get404); // IF ALL UPPER MIDDLEWARES NOT MATCHED, THEN THIS MIDDLEWARE WILL BE ACTIVATED AS 404 ERROR PAGE

//! RELATIONS BETWEEN TABLES !//

// RELATION BETWEEN USER AND PRODUCT (ONE TO MANY)
Product.belongsTo(User, {
    constraints: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
User.hasMany(Product, {
    foreignKey: {
        allowNull: false,
    },
});

// RELATION BETWEEN PRODUCT AND IT'S IMAGES (ONE TO MANY)
Image.belongsTo(Product, { constraints: true, onDelete: "CASCADE", onUpdate: "CASCADE" });
Product.hasMany(Image, {
    foreignKey: {
        allowNull: false,
    },
});

// RELATION BETWEEN USER AND CART (ONE TO ONE)
Cart.belongsTo(User, { constraints: true, onDelete: "CASCADE", onUpdate: "CASCADE" });
User.hasOne(Cart, {
    foreignKey: {
        allowNull: false,
    },
});

// RELATION BETWEEN CART AND PRODUCTS (MANY TO MANY)
Cart.belongsToMany(Product, { through: CartsProducts }); // THROUGH:  table that joins the both tables
Product.belongsToMany(Cart, { through: CartsProducts }); // THROUGH:  table that joins the both tables

// RELATION BETWEEN USER AND USER ORDERS (ONE TO MANY)
User.hasMany(Order, {
    foreignKey: {
        allowNull: false,
    },
});
Order.belongsTo(User, { constraints: true, onDelete: "CASCADE", onUpdate: "CASCADE" });

// RELATION BETWEEN ORDER AND ORDER PRODUCTS (MANY TO MANY)
Order.belongsToMany(Product, { through: OrderItems });
Product.belongsToMany(Order, { through: OrderItems });

// RELATION BETWEEN ORDER AND PROMOCODE (ONE TO MANY)
PromoCode.hasMany(Order);
Order.belongsTo(PromoCode, { constraints: true, onDelete: "CASCADE", onUpdate: "CASCADE" });

// RELATION BETWEEN USER AND PROMOCODE (MANY TO MANY)
User.belongsToMany(PromoCode, { through: UserPromoCode });
PromoCode.belongsToMany(User, { through: UserPromoCode });

OrderShipping.belongsTo(Order, { constraints: true, onDelete: "CASCADE", onUpdate: "CASCADE" });
Order.hasOne(OrderShipping);

//! TRIGGERS (EVENTS) FOR TABLES OPERATIONS !//

async function productPriceUpdate(cartProd) {
    if (cartProd.quantity === 0) {
        cartProd.destroy();
    } else {
        let product = await Product.findByPk(cartProd.productId);
        cartProd.totalPrice = +product.price * +cartProd.quantity;
        cartProd.shippingPrice = +product.shippingPrice;
    }
}

async function cartSummaryUpdate(cartProd, type = false) {
    const cartId = type ? cartProd : cartProd.cartId,
        cart = await Cart.findByPk(cartId);

    let cartProducts = await CartsProducts.findAll({
        where: {
            cartId: cartId,
        },
    });
    cart.totalPrice = 0;
    cart.totalShipping = 0;
    cart.totalItems = 0;
    cartProducts.forEach((product) => {
        cart.totalPrice += +product.totalPrice;
        cart.totalShipping += +product.shippingPrice;
        cart.totalItems += +product.quantity;
    });
    await cart.save();
}

// BEFORE ADDING NEW PRODUCT TO CART, UPDATE THE TOTAL PRICE OF THE PRODUCT IN CARTS PRODUCTS TABLE
CartsProducts.beforeBulkCreate(async (cartProds, options) => {
    await productPriceUpdate(cartProds[0]);
});

// BEFORE PRODUCT QUANTITY CHANGES, UPDATE THE TOTAL PRICE OF THE PRODUCT IN CARTS PRODUCTS TABLE
CartsProducts.beforeSave(async (cartProd, options) => {
    await productPriceUpdate(cartProd);
});

// AFTER ADDING NEW PRODUCT TO CART, UPDATE THE CART SUMMARY
CartsProducts.afterBulkCreate(async (cartProds, options) => {
    await cartSummaryUpdate(cartProds[0]);
});

// AFTER ADDING NEW PRODUCT TO CART , UPDATE THE CART SUMMARY
CartsProducts.afterSave(async (cartProd, options) => {
    await cartSummaryUpdate(cartProd);
});

// WHEN PRODUCT QUANTITY CHANGES, UPDATE THE TOTAL PRICE OF THE PRODUCT IN CARTS PRODUCTS TABLE
CartsProducts.afterBulkDestroy(async (cartProd, options) => {
    let cartId = cartProd.where.cartId;
    await cartSummaryUpdate(cartId, true);
});

//! SYNCHRONIZE DATABASE MODELS AND CONFIGURATIONS !//
sequelize
    // .sync({ force: true })
    .sync()
    .then((result) => {
        if (result) return User.findByPk(1);
        return null;
    })
    .then((user) => {
        if (!user)
            return User.create(
                {
                    firstName: "Super",
                    lastName: "Admin",
                    username: "superadmin",
                    email: "admin@admin.com",
                    password: "Admin123456",
                    city: "Alexandria",
                    address: "Maxwell Street",
                    postal: "21111",
                    building: "1",
                    state: "Arizona",
                    phoneNumber: "+201028987261",
                    isAdmin: true,
                    // AUTO CREATE CART FOR THE USER
                    cart: {},
                },
                {
                    // TO TELL SEQUELIZE THAT THE CART KEY ABOVE IS AN ASSOCIATION
                    include: [Cart],
                }
            );
        return false;
    })
    .then((user) => {
        if (user) {
            // SEEDER TO AUTO CREATE PRODUCTS
            productSeeder(user);
        }
        app.listen(8000); // LISTEN FOR INCOMING REQUESTS ON THIS PORT
    })
    .catch((err) => console.log("Error syncing database.", err));
