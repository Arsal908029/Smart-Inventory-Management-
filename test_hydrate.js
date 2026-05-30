const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect('mongodb://localhost:27017/smart_inventory_test', { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
    try {
        const obj = {
            _id: new mongoose.Types.ObjectId(),
            name: "Test",
            sku: "TEST",
            description: "Test",
            category: { _id: new mongoose.Types.ObjectId(), name: "Electronics" }, // Populated field
            price: 10,
            cost: 5,
            quantity: 10
        };
        const doc = Product.hydrate(obj);
        console.log("Hydrate success:", doc.name);
    } catch (e) {
        console.error("Hydrate error:", e);
    }
    mongoose.disconnect();
});
