const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'ProductDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// The string to replace: set{t("productDetail.quantity", "Quantity")}
content = content.split('set{t("productDetail.quantity", "Quantity")}').join('setQuantity');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed setQuantity');
