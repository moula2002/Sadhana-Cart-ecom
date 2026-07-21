const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'cartPage', 'CheckoutPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  ['>Delivery Address<', '>{t("checkout.deliveryAddress", "Delivery Address")}<'],
  ['Select Saved Address', '{t("checkout.selectSavedAddress", "Select Saved Address")}'],
  ['>Add New Address<', '>{t("checkout.addNewAddress", "Add New Address")}<'],
  ['Quantity: ', '{t("checkout.quantityText", "Quantity: ")}'],
  ['Price per item: ', '{t("checkout.pricePerItem", "Price per item: ")}'],
  ['Total: ', '{t("checkout.totalLabelText", "Total: ")}'],
  ['Cards, UPI & Wallets', '{t("checkout.cardsUpiWallets", "Cards, UPI & Wallets")}'],
  ['Cash on Delivery', '{t("checkout.cashOnDelivery", "Cash on Delivery")}'],
  ['Pay when you receive', '{t("checkout.payWhenReceive", "Pay when you receive")}'],
  ['View All Coupons & Offers', '{t("checkout.viewCoupons", "View All Coupons & Offers")}'],
  ['placeholder="Enter full street address (including door/house number)"', 'placeholder={t("checkout.addressPlaceholder", "Enter full street address (including door/house number)")}'],
  ['placeholder="City"', 'placeholder={t("checkout.cityPlaceholder", "City")}'],
  ['placeholder="PIN code"', 'placeholder={t("checkout.pinPlaceholder", "PIN code")}'],
  ['>Cancel<', '>{t("checkout.cancel", "Cancel")}<']
];

for (const [s, r] of replacements) {
  content = content.replace(new RegExp(s.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&'), 'g'), r);
}

// Ensure translation hook is there, but wait, CheckoutPage already uses `t("checkout.emptyCart")` so it definitely imports `useTranslation`!

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed CheckoutPage');
