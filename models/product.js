const { ObjectId } = require("mongodb"),
    { mongoDB } = require("./../database/database"),
    fs = require("fs"),
    path = require("path");

class Product {
    constructor(title, price, shippingPrice, description, images, userID, id = null) {
        this.title = title;
        this.price = price;
        this.shippingPrice = shippingPrice;
        this.description = description;
        this.images = images;
        this.rating = 0;
        this.userID = userID;
        this._id = id ? new ObjectId(id) : null;
    }

    save() {
        if (this.userID) {
            this.creationAt = new Date().toISOString();
            this.updatedAt = new Date().toISOString();
            return mongoDB().collection("products").insertOne(this);
        } else {
            return new Promise((res, rej) => {
                rej("User id should be specified.");
            });
        }
    }

    static getAllProducts(sortType = null, limit = null) {
        let sortOption;
        switch (sortType) {
            case "newest":
                sortOption = { creationAt: -1 };
                break;
            case "rating":
                sortOption = { rating: -1 };
                break;
            case "title":
                sortOption = { title: 1 };
                break;
            case "price_h_to_l":
                sortOption = { price: -1 };
                break;
            case "price_l_to_h":
                sortOption = { price: 1 };
                break;
            default:
                sortOption = { title: 1 };
                break;
        }
        const db = mongoDB();
        if (+limit) {
            return db.collection("products").find().limit(limit).sort(sortOption).toArray();
        }
        return db.collection("products").find().sort(sortOption).toArray();
    }

    static getProduct(productID) {
        try {
            const db = mongoDB();
            return db
                .collection("products")
                .find({
                    _id: new ObjectId(productID),
                })
                .next()
                .then((product) => {
                    return product;
                })
                .catch((err) => {
                    return false;
                });
        } catch (err) {
            console.log("Cannot get product", err);
            return false;
        }
    }

    static generateProducts(userID) {
        let products = fs.readFileSync(path.join(__dirname, "..", "database", "products.json"));
        if (products) {
            products = JSON.parse(products);
            products.map((product) => {
                product.shippingPrice = +(Math.random() * 100).toFixed(2);
                product.userID = userID;
                delete product.id;
                return product;
            });
            const db = mongoDB();
            return db.collection("products").insertMany(products);
        }
        return false;
    }
}

module.exports = Product;
