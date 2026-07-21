const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // wishlist
      if (content.includes('t("wishlist",')) {
        content = content.replace(/t\("wishlist",\s*"Wishlist"\)/g, 't("wishlistLabel", "Wishlist")');
        changed = true;
      }
      if (content.includes("t('wishlist',")) {
        content = content.replace(/t\('wishlist',\s*'Wishlist'\)/g, "t('wishlistLabel', 'Wishlist')");
        changed = true;
      }
      
      // Add to Cart
      if (content.includes('>Add to Cart<')) {
        content = content.replace(/>Add to Cart</g, '>{t("addToCart", "Add to Cart")}<');
        changed = true;
      }
      
      // Move All to Cart
      if (content.includes('>Move All to Cart<')) {
        content = content.replace(/>Move All to Cart</g, '>{t("moveAllToCart", "Move All to Cart")}<');
        changed = true;
      }
      
      // Remove All
      if (content.includes('>Remove All<')) {
        content = content.replace(/>Remove All</g, '>{t("removeAll", "Remove All")}<');
        changed = true;
      }

      // Move to Cart
      if (content.includes('>Move to Cart<')) {
        content = content.replace(/>Move to Cart</g, '>{t("moveToCart", "Move to Cart")}<');
        changed = true;
      }
      
      // Remove (button)
      if (content.includes('>Remove<')) {
        content = content.replace(/>Remove</g, '>{t("remove", "Remove")}<');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated ' + fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
