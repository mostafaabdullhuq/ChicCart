const sequelize = require("./../database/database"),
    { DataTypes } = require("sequelize");

const UserPromoCode = sequelize.define("userspromocode", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    useCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
});

module.exports = UserPromoCode;
