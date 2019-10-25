const orderSchema = require('./schema/order');
const orderItemSchema = require('./schema/orderItem');
const mongoose = require('mongoose');

const connection = mongoose.createConnection('mongodb+srv://Vefthjofar:abcd@cactus-heaven-0rwvg.mongodb.net/cactus-heaven', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

module.exports = {
    Order: connection.model('Order', orderSchema),
    OrderItem: connection.model('OrderItem', orderItemSchema)
};
