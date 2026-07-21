const fs = require('fs');
const path = require('path');

const locales = ['en', 'ta', 'te', 'ml', 'kn'];

locales.forEach((locale) => {
  const filePath = path.join(__dirname, 'src', 'language', `${locale}.json`);
  if (!fs.existsSync(filePath)) return;
  
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!data.similarProducts) {
    data.similarProducts = "Similar Products";
  }
  
  if (!data.productDetail) {
    data.productDetail = {};
  }
  
  data.productDetail.exploreMore = "Explore more like this";
  data.productDetail.value365 = "Value 365";
  data.productDetail.latestTrends = "Latest Trends";
  data.productDetail.topRated = "Top Rated";

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
});

console.log('Updated translation files');
