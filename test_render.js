const ejs = require('ejs');
const fs = require('fs');

try {
    const template = fs.readFileSync('views/suppliers/create.ejs', 'utf-8');
    const html = ejs.render(template, { error: null, supplier: null });
    console.log("Create EJS rendered successfully");
} catch(e) {
    console.error("Error in create.ejs:", e);
}

try {
    const template2 = fs.readFileSync('views/suppliers/index.ejs', 'utf-8');
    const html2 = ejs.render(template2, { 
        suppliers: [
            { name: "ABC", contact: "123", email: "a@b.com", phone: "123", leadTimeDays: 7, rating: 5, status: "active", _id: "1" }
        ]
    });
    console.log("Index EJS rendered successfully");
} catch(e) {
    console.error("Error in index.ejs:", e);
}
