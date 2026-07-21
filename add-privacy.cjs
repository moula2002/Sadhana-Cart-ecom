const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'language');
const files = ['en.json', 'ta.json', 'te.json', 'kn.json', 'ml.json'];

const translations = {
  en: {
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.sitemap': 'Sitemap'
  },
  ta: {
    'footer.privacyPolicy': 'தனியுரிமைக் கொள்கை',
    'footer.sitemap': 'தள வரைபடம்'
  },
  te: {
    'footer.privacyPolicy': 'గోప్యతా విధానం',
    'footer.sitemap': 'సైట్ మ్యాప్'
  },
  kn: {
    'footer.privacyPolicy': 'ಗೌಪ್ಯತಾ ನೀತಿ',
    'footer.sitemap': 'ಸೈಟ್ ಮ್ಯಾಪ್'
  },
  ml: {
    'footer.privacyPolicy': 'സ്വകാര്യതാ നയം',
    'footer.sitemap': 'സൈറ്റ് മാപ്പ്'
  }
};

files.forEach(file => {
  const lang = file.replace('.json', '');
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const trans = translations[lang];
    if (trans) {
      for (const key of Object.keys(trans)) {
        const parts = key.split('.');
        if (parts.length === 2) {
          if (!data[parts[0]]) data[parts[0]] = {};
          data[parts[0]][parts[1]] = trans[key];
        } else {
          data[key] = trans[key];
        }
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('Updated ' + file);
    }
  }
});
