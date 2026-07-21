const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'components', 'category', 'FrequentlyBoughtTogether.jsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useTranslation')) {
  content = content.replace(
    'import React, { useState, useEffect } from "react";',
    'import React, { useState, useEffect } from "react";\nimport { useTranslation } from "react-i18next";'
  );
  content = content.replace(
    'const FrequentlyBoughtTogether = ({ currentProduct }) => {',
    'const FrequentlyBoughtTogether = ({ currentProduct }) => {\n  const { t } = useTranslation();'
  );
}

const replacements = [
  ['Frequently Bought Together', '{t("productDetail.frequentlyBoughtTogether", "Frequently Bought Together")}'],
  ['Customers who bought this item also frequently added these to their cart', '{t("productDetail.customersAlsoBought", "Customers who bought this item also frequently added these to their cart")}'],
  ['>THIS ITEM<', '>{t("productDetail.thisItem", "THIS ITEM")}<'],
  ['Total for', '{t("productDetail.totalFor", "Total for")}'],
  [' items:', ' {t("productDetail.items", "items:")}'],
  ['Save ₹', '{t("productDetail.save", "Save")} ₹'],
  [' on this bundle!', ' {t("productDetail.onThisBundle", "on this bundle!")}'],
  ['>Add Selected to Cart<', '>{t("productDetail.addSelectedToCart", "Add Selected to Cart")}<']
];

for (const [s, r] of replacements) {
  content = content.replace(new RegExp(s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), r);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed FrequentlyBoughtTogether');
