const path = require("path");
const fs = require("fs");

const dataPath = path.join(require.main.path, "database", "products.json");

module.exports = class Product {
    constructor(title, price, images, description) {
        this.title = title;
        this.price = price;
        this.images = images.split("\n");
        this.description = description;
        this.rating = 0;
        console.log(this.images);
    }

    save() {
        let products = Product.getAllProducts();
        this.id = products[products.length - 1].id + 1;
        let currentDate = new Date();
        this.creationAt = currentDate;
        this.updatedAt = currentDate;
        this.category = {
            id: 1,
            name: "Electronics",
            image: "https://api.lorem.space/image/fashion?w=640&h=480&r=2937",
            creationAt: "2023-03-24T15:48:21.000Z",
            updatedAt: "2023-03-24T15:48:21.000Z",
        };
        products.push(this);
        fs.writeFile(dataPath, JSON.stringify(products), (err) => {
            if (err) console.log("Error while writing data", err);
        });
    }

    static getAllProducts() {
        try {
            return JSON.parse(fs.readFileSync(dataPath));
        } catch {
            return [];
        }
    }

    static getNewestProducts(limit = null) {
        let products = this.getAllProducts();

        // SORT PRODUCTS BY CREATION DATE
        products.sort((first, second) => {
            return new Date(second.creationAt).getTime() - new Date(first.creationAt).getTime();
        });

        // RETURN ALL PRODUCTS OR SPECIFIC NUMBER OF PRODUCTS BASED ON LIMIT PARAM
        return limit && typeof limit === "number" ? products.slice(0, limit) : products;
    }

    static getProduct(productID) {
        let products = this.getAllProducts();
        let product = products.filter((product) => {
            return product.id == productID;
        });
        return product ? product[0] : false;
    }

    static deleteProduct(productID) {
        let products = Product.getAllProducts();
        let newProducts = products.filter((product) => product.id != productID);
        fs.writeFile(dataPath, JSON.stringify(newProducts), (err) => {
            if (err) console.log("Error while writing data", err);
        });
    }

    static editProduct(productID, product) {
        let products = Product.getAllProducts();
        let oldProductIndex;
        let oldProduct = products.find((element, index) => {
            if (element.id == productID) {
                oldProductIndex = index;
                return element;
            }
        });
        if (oldProduct) {
            oldProduct.title = product.title ? product.title : oldProduct.title;
            oldProduct.description = product.description ? product.description : oldProduct.description;
            oldProduct.price = product.price ? product.price : oldProduct.price;
            oldProduct.images = product.images ? product.images : oldProduct.images;
            oldProduct.updatedAt = new Date();
            products[oldProductIndex] = oldProduct;
            fs.writeFile(dataPath, JSON.stringify(products), (err) => {
                if (err) console.log("Error while writing data", err);
            });
            return true;
        }
        return false;
    }
};
