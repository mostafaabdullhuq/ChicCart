let mysql = require("mysql2");

module.exports = mysql
    .createPool({
        host: "localhost",
        user: "root",
        database: "nodejs_ecommerce",
    })
    .promise();
