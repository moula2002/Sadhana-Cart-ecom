const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'ProductDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  ['Select Size', '{t("productDetail.selectSize", "Select Size")}'],
  ['Compare', '{t("productDetail.compare", "Compare")}'],
  ['Share', '{t("productDetail.share", "Share")}'],
  ['Description', '{t("productDetail.description", "Description")}'],
  ['Details', '{t("productDetail.details", "Details")}'],
  ['Available Offers', '{t("productDetail.availableOffers", "Available Offers")}'],
  ['Cash on Delivery', '{t("productDetail.cashOnDelivery", "Cash on Delivery")}'],
  ['7-day Returns', '{t("productDetail.sevenDayReturns", "7-day Returns")}'],
  ['Ratings & Reviews', '{t("productDetail.ratingsAndReviews", "Ratings & Reviews")}'],
  ['Customer Reviews', '{t("productDetail.customerReviews", "Customer Reviews")}'],
  ['No reviews yet', '{t("productDetail.noReviewsYet", "No reviews yet")}'],
  ['Be the first to review this product', '{t("productDetail.beFirstToReview", "Be the first to review this product")}']
];

for (const [s, r] of replacements) {
  // Use a regex that ignores whitespace around the text if it's inside a JSX text node
  // A simple way is to replace the exact strings. Since these are mostly unique, 
  // we can just replace them directly in the file where they are not part of other logic.
  // Wait, let's just do a manual replace for each occurrence to be safe.
}

// Actually, I'll just write a script to replace each one precisely.
content = content.replace(
  />\s*Select Size\s*</g, 
  '>{t("productDetail.selectSize", "Select Size")}<'
);

content = content.replace(
  />\s*Compare\s*</g, 
  '>{t("productDetail.compare", "Compare")}<'
);

content = content.replace(
  />\s*Share\s*</g, 
  '>{t("productDetail.share", "Share")}<'
);

content = content.replace(
  />\s*Description\s*</g, 
  '>{t("productDetail.description", "Description")}<'
);

content = content.replace(
  />\s*Details\s*</g, 
  '>{t("productDetail.details", "Details")}<'
);

content = content.replace(
  />\s*Available Offers\s*</g, 
  '>{t("productDetail.availableOffers", "Available Offers")}<'
);

content = content.replace(
  />\s*Cash on Delivery\s*</g, 
  '>{t("productDetail.cashOnDelivery", "Cash on Delivery")}<'
);

content = content.replace(
  />\s*7-day Returns\s*</g, 
  '>{t("productDetail.sevenDayReturns", "7-day Returns")}<'
);

content = content.replace(
  />\s*Ratings & Reviews\s*</g, 
  '>{t("productDetail.ratingsAndReviews", "Ratings & Reviews")}<'
);

content = content.replace(
  />\s*Customer Reviews\s*</g, 
  '>{t("productDetail.customerReviews", "Customer Reviews")}<'
);

content = content.replace(
  />\s*No reviews yet\s*</g, 
  '>{t("productDetail.noReviewsYet", "No reviews yet")}<'
);

content = content.replace(
  />\s*Be the first to review this product\s*</g, 
  '>{t("productDetail.beFirstToReview", "Be the first to review this product")}<'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed straggler translations');
