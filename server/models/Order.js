var mongoose = require("mongoose");
var OrderSchema = new mongoose.Schema({
    ingredients: Array,
    date: {
        type: Date,
        default: Date.now
    },
    totalPrice: String
});

module.exports = mongoose.model('Order', OrderSchema);