const fs = require('fs');
const path = require('path');

function updateComponent(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const replaceExact = (searchStr, replacement) => {
    if (content.includes(searchStr)) {
      content = content.replace(new RegExp(searchStr, 'g'), replacement);
      changed = true;
    }
  };

  if (file.endsWith('CartPage.jsx')) {
    replaceExact('<span className="step-title">Shopping Cart</span>', '<span className="step-title">{t("shoppingCart", "Shopping Cart")}</span>');
    replaceExact('<span className="step-title">Checkout</span>', '<span className="step-title">{t("checkout", "Checkout")}</span>');
    replaceExact('<span className="step-title">Order Complete</span>', '<span className="step-title">{t("orderComplete", "Order Complete")}</span>');
    
    replaceExact('<h1 className="cart-main-title">\n            Shopping Cart', '<h1 className="cart-main-title">\n            {t("shoppingCart", "Shopping Cart")}');
    
    // items
    replaceExact('{cartItems.length === 1 ? "item" : "items"}', '{cartItems.length === 1 ? t("item", "item") : t("items", "items")}');

    replaceExact('<h3>Order Summary</h3>', '<h3>{t("orderSummary", "Order Summary")}</h3>');
    replaceExact('<span className="label-title">Subtotal ({cartItems.length} items)</span>', '<span className="label-title">{t("subtotalItems", "Subtotal ({{count}} items)", { count: cartItems.length })}</span>');
    replaceExact('<span className="label-title">Delivery Charges</span>', '<span className="label-title">{t("deliveryCharges", "Delivery Charges")}</span>');
    replaceExact('<span className="val-amount free-tag">FREE</span>', '<span className="val-amount free-tag">{t("free", "FREE")}</span>');
    replaceExact('<span className="label-title">Estimated Tax</span>', '<span className="label-title">{t("estimatedTax", "Estimated Tax")}</span>');
    replaceExact('<span className="val-amount text-muted">Included</span>', '<span className="val-amount text-muted">{t("included", "Included")}</span>');
    replaceExact('<span className="total-title-text">Total Amount</span>', '<span className="total-title-text">{t("totalAmount", "Total Amount")}</span>');
    
    replaceExact('<span>Proceed to Checkout</span>', '<span>{t("proceedToCheckout", "Proceed to Checkout")}</span>');
    replaceExact('Clear Shopping Cart\n                    </button>', '{t("clearShoppingCart", "Clear Shopping Cart")}\n                    </button>');
  }

  if (file.endsWith('CartItem.jsx')) {
    replaceExact('{t("cart.remove")}', '{t("remove", "Remove")}');
    replaceExact('{t("cart.quantity", "Quantity")}', '{t("quantity", "QUANTITY")}');
    replaceExact('Quantity', '{t("quantity", "QUANTITY")}');
    replaceExact('{t("cart.subtotal", "Subtotal")}', '{t("subtotal", "SUBTOTAL")}');
    replaceExact('Subtotal', '{t("subtotal", "SUBTOTAL")}');
  }

  if (file.endsWith('CartItems.jsx')) {
    replaceExact('{t("cart.remove") || "Remove"}', '{t("remove", "Remove")}');
  }

  if (changed) {
    if (!content.includes('useTranslation')) {
      content = content.replace(/import React/, 'import { useTranslation } from "react-i18next";\nimport React');
      const constMatch = content.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{/);
      if (constMatch) {
        content = content.replace(new RegExp(`const\\s+${constMatch[1]}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{`), `$& \n  const { t } = useTranslation();`);
      }
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
}

const files = [
  path.join(__dirname, 'src', 'components', 'cartPage', 'CartPage.jsx'),
  path.join(__dirname, 'src', 'components', 'cartPage', 'CartItem.jsx'),
  path.join(__dirname, 'src', 'components', 'cartPage', 'CartItems.jsx')
];

for (const file of files) {
  if (fs.existsSync(file)) {
    updateComponent(file);
  }
}
