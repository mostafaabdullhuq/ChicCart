const db = require("./database");

db.execute(
    `
    CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        price FLOAT NOT NULL,
        description TEXT NOT NULL,
        rating FLOAT NOT NULL DEFAULT 0 CHECK (rating <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    `
)
    .then((result) => {
        console.log("[+] Table (products) created successfully.\n", "-".repeat(50));
    })

    .catch((err) => {
        console.log("[+] Error occurred while creating table (products).\n", err, "-".repeat(50));
    });

db.execute(
    `
        CREATE TABLE IF NOT EXISTS product_images (
            id INT PRIMARY KEY AUTO_INCREMENT,
            image TEXT NOT NULL,
            product_id INT,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
        `
)
    .then((result) => {
        console.log("[+] Table (products_images) created successfully.\n", "-".repeat(50));
    })
    .catch((err) => {
        console.log("[+] Error occurred while creating table (products_images).\n", err, "-".repeat(50));
    });
