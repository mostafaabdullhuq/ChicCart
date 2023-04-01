const fs = require("fs"),
    path = require("path");

module.exports = function productSeeder(adminUser = null) {
    console.log("[+] Started creating products [+]");
    let counter = 0;
    if (adminUser) {
        new Promise((res, rej) => {
            fs.readFile(path.join(__dirname, "..", "products.json"), (err, products) => {
                if (err) {
                    rej(err);
                }
                res(JSON.parse(products));
            });
        })
            .then((products) => {
                if (products && products !== null) {
                    products.forEach(async (product) => {
                        try {
                            let createdProduct = await adminUser.createProduct({
                                title: product.title,
                                description: product.description,
                                price: product.price,
                            });
                            product.images.forEach(async (image) => {
                                await createdProduct.createImage({
                                    url: image,
                                });
                            });
                            console.log(`[${counter++}] Product/s created`);
                        } catch (err) {
                            throw Error(err);
                        }
                    });
                } else {
                    console.log("[+] No products found in products.json file [+]");
                }
                // console.log(`[+] Done creating ${counter} products [+]`);
            })

            .catch((err) => {
                console.log("[+] Error while creating seeders [+]", err);
            });
    } else {
        console.log("[+] No user found with admin privileges, Please create admin user and then try again [+]");
    }
};
