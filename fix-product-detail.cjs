const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'ProductDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  ['Inclusive of all taxes', '{t("productDetail.inclusiveOfTaxes", "Inclusive of all taxes")}'],
  ['>Select Size<', '>{t("productDetail.selectSize", "Select Size")}<'],
  ['Quantity', '{t("productDetail.quantity", "Quantity")}'],
  ['>Buy Now<', '>{t("productDetail.buyNow", "Buy Now")}<'],
  ['>Compare<', '>{t("productDetail.compare", "Compare")}<'],
  ['>Share<', '>{t("productDetail.share", "Share")}<'],
  ['>Description<', '>{t("productDetail.description", "Description")}<'],
  ['>Details<', '>{t("productDetail.details", "Details")}<'],
  ['brand :', '{t("productDetail.brand", "brand")}:'],
  ['material :', '{t("productDetail.material", "material")}:'],
  ['pattern :', '{t("productDetail.pattern", "pattern")}:'],
  ['hsncode :', '{t("productDetail.hsncode", "hsncode")}:'],
  ['gender :', '{t("productDetail.gender", "gender")}:'],
  ['color :', '{t("productDetail.color", "color")}:'],
  ['rating :', '{t("productDetail.ratingLabel", "rating")}:'],
  ['discount :', '{t("productDetail.discountLabel", "discount")}:'],
  ['>Available Offers<', '>{t("productDetail.availableOffers", "Available Offers")}<'],
  ['Delivery in 5-7 business days', '{t("productDetail.deliveryDays", "Delivery in 5-7 business days")}'],
  ['Lowest Price', '{t("productDetail.lowestPrice", "Lowest Price")}'],
  ['>Cash on Delivery<', '>{t("productDetail.cashOnDelivery", "Cash on Delivery")}<'],
  ['7-day Returns', '{t("productDetail.sevenDayReturns", "7-day Returns")}'],
  ['Ratings & Reviews', '{t("productDetail.ratingsAndReviews", "Ratings & Reviews")}'],
  ['Customer Reviews', '{t("productDetail.customerReviews", "Customer Reviews")}'],
  ['total ratings', '{t("productDetail.totalRatings", "total ratings")}'],
  ['No reviews yet', '{t("productDetail.noReviewsYet", "No reviews yet")}'],
  ['Be the first to review this product', '{t("productDetail.beFirstToReview", "Be the first to review this product")}'],
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
console.log('Fixed ProductDetailPage');
