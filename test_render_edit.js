const ejs = require('ejs');
const fs = require('fs');

try {
    const template = fs.readFileSync('views/suppliers/edit.ejs', 'utf-8');
    const html = ejs.render(template, { 
        supplier: { name: 'ABC Traders', contact: '123', email: 'a@b.com', phone: '123', leadTimeDays: 7, rating: 5, status: 'active', _id: '1' },
        error: null 
    });
    console.log("Edit EJS rendered successfully");
} catch(e) {
    console.error("Error in edit.ejs:", e);
}
