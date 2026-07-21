const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'language');
const files = ['en.json', 'ta.json', 'te.json', 'kn.json', 'ml.json'];

const translations = {
  en: {
    'shoppingCart': 'Shopping Cart',
    'checkout': 'Checkout',
    'orderComplete': 'Order Complete',
    'item': 'item',
    'orderSummary': 'Order Summary',
    'subtotalItems': 'Subtotal ({{count}} items)',
    'deliveryCharges': 'Delivery Charges',
    'free': 'FREE',
    'estimatedTax': 'Estimated Tax',
    'included': 'Included',
    'totalAmount': 'Total Amount',
    'proceedToCheckout': 'Proceed to Checkout',
    'clearShoppingCart': 'Clear Shopping Cart',
    'quantity': 'QUANTITY',
    'subtotal': 'SUBTOTAL',
    'remove': 'Remove',
    'myWishlistTitle': 'My Wishlist',
    'emptyWishlistTitle': 'Your wishlist is empty',
    'goShopping': 'Go Shopping'
  },
  ta: {
    'shoppingCart': 'ஷாப்பிங் கூடை',
    'checkout': 'சரிபார்',
    'orderComplete': 'ஆர்டர் முடிந்தது',
    'item': 'பொருள்',
    'orderSummary': 'ஆர்டர் சுருக்கம்',
    'subtotalItems': 'உபமொத்தம் ({{count}} பொருட்கள்)',
    'deliveryCharges': 'விநியோக கட்டணங்கள்',
    'free': 'இலவசம்',
    'estimatedTax': 'மதிப்பிடப்பட்ட வரி',
    'included': 'சேர்க்கப்பட்டுள்ளது',
    'totalAmount': 'மொத்த தொகை',
    'proceedToCheckout': 'சரிபார்க்க தொடரவும்',
    'clearShoppingCart': 'கூடையை காலியாக்கு',
    'quantity': 'அளவு',
    'subtotal': 'உபமொத்தம்',
    'remove': 'நீக்கு',
    'myWishlistTitle': 'எனது விருப்பப்பட்டியல்',
    'emptyWishlistTitle': 'உங்கள் விருப்பப்பட்டியல் காலியாக உள்ளது',
    'goShopping': 'ஷாப்பிங் தொடரவும்'
  },
  te: {
    'shoppingCart': 'షాపింగ్ కార్ట్',
    'checkout': 'చెక్అవుట్',
    'orderComplete': 'ఆర్డర్ పూర్తయింది',
    'item': 'వస్తువు',
    'orderSummary': 'ఆర్డర్ సారాంశం',
    'subtotalItems': 'సబ్‌టోటల్ ({{count}} వస్తువులు)',
    'deliveryCharges': 'డెలివరీ ఛార్జీలు',
    'free': 'ఉచితం',
    'estimatedTax': 'అంచనా వేసిన పన్ను',
    'included': 'చేర్చబడింది',
    'totalAmount': 'మొత్తం మొత్తం',
    'proceedToCheckout': 'చెక్అవుట్‌కు కొనసాగండి',
    'clearShoppingCart': 'కార్ట్‌ను క్లియర్ చేయండి',
    'quantity': 'పరిమాణం',
    'subtotal': 'సబ్‌టోటల్',
    'remove': 'తొలగించు',
    'myWishlistTitle': 'నా విష్‌లిస్ట్',
    'emptyWishlistTitle': 'మీ విష్‌లిస్ట్ ఖాళీగా ఉంది',
    'goShopping': 'షాపింగ్ కొనసాగించండి'
  },
  kn: {
    'shoppingCart': 'ಶಾಪಿಂಗ್ ಕಾರ್ಟ್',
    'checkout': 'ಚೆಕ್‌ಔಟ್',
    'orderComplete': 'ಆರ್ಡರ್ ಪೂರ್ಣಗೊಂಡಿದೆ',
    'item': 'ವಸ್ತು',
    'orderSummary': 'ಆರ್ಡರ್ ಸಾರಾಂಶ',
    'subtotalItems': 'ಉಪಮೊತ್ತ ({{count}} ವಸ್ತುಗಳು)',
    'deliveryCharges': 'ವಿತರಣಾ ಶುಲ್ಕಗಳು',
    'free': 'ಉಚಿತ',
    'estimatedTax': 'ಅಂದಾಜು ತೆರಿಗೆ',
    'included': 'ಸೇರಿಸಲಾಗಿದೆ',
    'totalAmount': 'ಒಟ್ಟು ಮೊತ್ತ',
    'proceedToCheckout': 'ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
    'clearShoppingCart': 'ಕಾರ್ಟ್ ತೆರವುಗೊಳಿಸಿ',
    'quantity': 'ಪ್ರಮಾಣ',
    'subtotal': 'ಉಪಮೊತ್ತ',
    'remove': 'ತೆಗೆದುಹಾಕಿ',
    'myWishlistTitle': 'ನನ್ನ ವಿಶ್‌ಲಿಸ್ಟ್',
    'emptyWishlistTitle': 'ನಿಮ್ಮ ವಿಶ್‌ಲಿಸ್ಟ್ ಖಾಲಿಯಾಗಿದೆ',
    'goShopping': 'ಶಾಪಿಂಗ್ ಮುಂದುವರಿಸಿ'
  },
  ml: {
    'shoppingCart': 'ഷോപ്പിംഗ് കാർട്ട്',
    'checkout': 'ചെക്ക്ഔട്ട്',
    'orderComplete': 'ഓർഡർ പൂർത്തിയായി',
    'item': 'ഇനം',
    'orderSummary': 'ഓർഡർ സംഗ്രഹം',
    'subtotalItems': 'ഉപമൊത്തം ({{count}} ഇനങ്ങൾ)',
    'deliveryCharges': 'ഡെലിവറി നിരക്കുകൾ',
    'free': 'സൗജന്യം',
    'estimatedTax': 'കണക്കാക്കിയ നികുതി',
    'included': 'ഉൾപ്പെടുത്തിയിട്ടുണ്ട്',
    'totalAmount': 'മൊത്തം തുക',
    'proceedToCheckout': 'ചെക്ക്ഔട്ടിലേക്ക് തുടരുക',
    'clearShoppingCart': 'കാർട്ട് മായ്‌ക്കുക',
    'quantity': 'അളവ്',
    'subtotal': 'ഉപമൊത്തം',
    'remove': 'നീക്കംചെയ്യുക',
    'myWishlistTitle': 'എന്റെ വിഷ്‌ലിസ്റ്റ്',
    'emptyWishlistTitle': 'നിങ്ങളുടെ വിഷ്‌ലിസ്റ്റ് ശൂന്യമാണ്',
    'goShopping': 'ഷോപ്പിംഗ് തുടരുക'
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
        data[key] = trans[key];
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('Updated ' + file);
    }
  }
});
