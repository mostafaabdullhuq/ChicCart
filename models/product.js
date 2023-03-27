const path = require("path");
const fs = require("fs");
const db = require("./../database/database");
const dataPath = path.join(require.main.path, "database", "products.json");

module.exports = class Product {
    constructor(title, price, images, description) {
        this.title = title;
        this.price = price;
        this.images = images.split("\n");
        this.description = description;
        this.rating = 0;
    }

    // SAVE PRODUCT INTO DATABASE
    save() {
        return (
            db
                // INSERT PRODUCT INFO
                .execute("INSERT INTO products (title, price, description) VALUES (?, ?, ?)", [this.title, +this.price.toFixed(2), this.description])
                .then(([insertedInfo, columnInfo]) => {
                    return insertedInfo.insertId; // GET THE INSERTED PRODUCT ID
                })
                .then(async (prodID) => {
                    // INSERT PRODUCT IMAGES
                    for (let image of this.images) {
                        await db.execute("INSERT INTO product_images (image, product_id) VALUES (?, ?);", [image, prodID]).catch((err) => console.console.log("Error inserting image", err));
                    }
                    return prodID;
                })
                .catch((err) => {
                    console.log("error saving product", err);
                    return null;
                })
        );
    }

    // GET ALL PRODUCTS FROM DATABASE
    static getAllProducts(sortType = null, limit = null) {
        // HANDLE SORTING TYPES
        switch (sortType?.toLowerCase()) {
            case "title":
                sortType = "title";
                break;
            case "price_l_to_h":
                sortType = "price";
                break;
            case "price_h_to_l":
                sortType = "price DESC";
                break;
            case "reviews":
                sortType = "rating DESC";
                break;
            case "newest":
                sortType = "created_at DESC";
                break;
            default:
                sortType = "title";
                break;
        }

        if (limit && !+limit) limit = null; // IF LIMIT IS GIVEN AND NOT A NUMBER, SET IT TO NULL

        return db
            .execute(
                `SELECT p.*, GROUP_CONCAT(pi.image) as images FROM products as p JOIN product_images as pi ON (p.id = pi.product_id) GROUP BY p.id ORDER BY p.${sortType}${
                    limit ? " LIMIT " + limit + ";" : ";"
                }`
            )
            .then(([products, columnsInfo]) => {
                return products;
            })
            .catch((err) => {
                console.log("error fetching products", err);
                return [];
            });
    }

    // GET SIGNLE PRODUCT BY ID
    static getProduct(productID) {
        return db
            .execute("SELECT p.*, GROUP_CONCAT(pi.image) as images FROM products p, product_images pi  WHERE p.id = pi.product_id GROUP BY p.id HAVING id = ?;", [+productID])
            .then(([product, columnInfo]) => {
                return product[0];
            })
            .catch((err) => {
                console.log("error fetching product", err);
                return false;
            });
    }

    // DELETE SINGLE PRODUCT BY ID
    static async deleteProduct(productID) {
        return db
            .execute("DELETE FROM products WHERE id = ?", [+productID])
            .then(([result, info]) => {
                return result.affectedRows > 0 ? true : false;
            })
            .catch((err) => {
                console.log("error deleting product", err);
                return false;
            });
    }

    // EDIT SINGLE PRODUCT BY ID
    static editProduct(productID, product) {
        return db
            .execute("UPDATE products SET title = ?, price = ?, description = ? WHERE id = ?", [product.title, product.price, product.description, productID])
            .then((_) => {
                return true;
            })
            .catch((err) => {
                console.log("error editing product", err);
                return false;
            });
    }
};
