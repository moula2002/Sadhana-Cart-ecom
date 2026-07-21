const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'ProductDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// Replace all broken translations back to 'Quantity'
content = content.split('{t("productDetail.quantity", "Quantity")}').join('Quantity');

// Then safely replace the exact label
content = content.split('>Quantity<').join('>{t("productDetail.quantity", "Quantity")}<');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed Quantity translation');
