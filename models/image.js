const sequelize = require("../database/database");
const { DataTypes } = require("sequelize");

const Image = sequelize.define("image", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

module.exports = Image;
