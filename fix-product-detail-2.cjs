const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'ProductDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  />Explore more like this<\/h3>/g,
  '>{t("productDetail.exploreMore", "Explore more like this")}</h3\>'
);

content = content.replace(
  /\s*Value 365\s*/g,
  ' {t("productDetail.value365", "Value 365")} '
);

content = content.replace(
  /\s*Latest Trends\s*/g,
  ' {t("productDetail.latestTrends", "Latest Trends")} '
);

content = content.replace(
  /\s*Top Rated\s*/g,
  ' {t("productDetail.topRated", "Top Rated")} '
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed ProductDetailPage text');
