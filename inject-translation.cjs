const fs = require('fs');
const path = require('path');

const files = [
  'src/components/category/FeatureProducts.jsx',
  'src/components/category/RecentlyViewedProducts.jsx',
  'src/pages/ProductDetailPage.jsx',
  'src/components/searchBar/CategoryProducts.jsx',
  'src/components/category/BestArrivals.jsx',
  'src/components/category/BestProducts.jsx',
  'src/components/category/RecommendedProduct.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    if (!content.includes('useTranslation')) {
      content = content.replace(/import React/, 'import { useTranslation } from "react-i18next";\nimport React');
      
      const functionMatch = content.match(/function\s+(\w+)\s*\(/);
      if (functionMatch) {
         content = content.replace(new RegExp(`function\\s+${functionMatch[1]}\\s*\\([^)]*\\)\\s*\\{`), `$& \n  const { t } = useTranslation();`);
      } else {
         const constMatch = content.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{/);
         if (constMatch) {
            content = content.replace(new RegExp(`const\\s+${constMatch[1]}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{`), `$& \n  const { t } = useTranslation();`);
         }
      }
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed ' + file);
    }
  }
});
