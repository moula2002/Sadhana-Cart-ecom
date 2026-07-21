const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'language');
const files = ['en.json', 'ta.json', 'te.json', 'kn.json', 'ml.json'];

const translations = {
  en: {
    'addNewAddress': 'Add New Address',
    'edit': 'Edit',
    'delete': 'Delete',
    'setDefault': 'Set Default',
    'defaultAddress': 'Default',
    'all': 'All',
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'returnRequested': 'Return Requested',
    'returnApproved': 'Return Approved',
    'refundCompleted': 'Refund Completed',
    'orderId': 'Order ID:',
    'items': 'items',
    'viewDetails': 'View Details',
    'viewAllOrders': 'View All Orders',
    'addToCart': 'Add to Cart',
    'moveAllToCart': 'Move All to Cart',
    'removeAll': 'Remove All',
    'moveToCart': 'Move to Cart',
    'remove': 'Remove',
    'youMayAlsoLike': 'You May Also Like',
    'myOrdersPage': 'My Orders Page',
    'loadingWishlist': 'Loading your wishlist...',
    'emptyWishlistSub': 'Save your favorite items here to view them later.',
    'homeAddressType': 'Home',
    'noOrdersFound': 'No orders found',
    'noAddressesFound': 'No addresses found. Click "Add New Address" to add one!',
    'wishlistCleared': 'Wishlist cleared successfully',
    'failedToClearWishlist': 'Failed to clear wishlist'
  },
  ta: {
    'addNewAddress': 'புதிய முகவரியைச் சேர்',
    'edit': 'திருத்து',
    'delete': 'நீக்கு',
    'setDefault': 'இயல்பாக்கு',
    'defaultAddress': 'இயல்பு',
    'all': 'அனைத்தும்',
    'pending': 'நிலுவையில்',
    'processing': 'செயலாக்கத்தில்',
    'shipped': 'அனுப்பப்பட்டது',
    'delivered': 'வழங்கப்பட்டது',
    'cancelled': 'ரத்து செய்யப்பட்டது',
    'returnRequested': 'திரும்பப் பெறக் கோரப்பட்டது',
    'returnApproved': 'திரும்பப் பெற அங்கீகரிக்கப்பட்டது',
    'refundCompleted': 'பணம் திரும்பப் பெறப்பட்டது',
    'orderId': 'ஆர்டர் ஐடி:',
    'items': 'பொருட்கள்',
    'viewDetails': 'விவரங்களைக் காண்க',
    'viewAllOrders': 'அனைத்து ஆர்டர்களையும் காண்க',
    'addToCart': 'கூடையில் சேர்',
    'moveAllToCart': 'அனைத்தையும் கூடைக்கு மாற்று',
    'removeAll': 'அனைத்தையும் நீக்கு',
    'moveToCart': 'கூடைக்கு மாற்று',
    'remove': 'நீக்கு',
    'youMayAlsoLike': 'உங்களுக்குப் பிடித்திருக்கலாம்',
    'myOrdersPage': 'எனது ஆர்டர்கள் பக்கம்',
    'loadingWishlist': 'உங்கள் விருப்பப் பட்டியல் ஏற்றப்படுகிறது...',
    'emptyWishlistSub': 'உங்கள் விருப்பமான பொருட்களைப் பின்னர் காண இங்கே சேமிக்கவும்.',
    'homeAddressType': 'வீடு',
    'noOrdersFound': 'ஆர்டர்கள் எதுவும் இல்லை',
    'noAddressesFound': 'முகவரிகள் எதுவும் இல்லை. புதிய முகவரியைச் சேர்க்க "புதிய முகவரியைச் சேர்" என்பதைக் கிளிக் செய்யவும்!',
    'wishlistCleared': 'விருப்பப் பட்டியல் வெற்றிகரமாக அழிக்கப்பட்டது',
    'failedToClearWishlist': 'விருப்பப் பட்டியலை அழிக்க முடியவில்லை'
  },
  te: {
    'addNewAddress': 'కొత్త చిరునామాను జోడించండి',
    'edit': 'సవరించు',
    'delete': 'తొలగించు',
    'setDefault': 'డిఫాల్ట్‌గా చేయండి',
    'defaultAddress': 'డిఫాల్ట్',
    'all': 'అన్నీ',
    'pending': 'పెండింగ్',
    'processing': 'ప్రాసెసింగ్',
    'shipped': 'రవాణా చేయబడింది',
    'delivered': 'పంపిణీ చేయబడింది',
    'cancelled': 'రద్దు చేయబడింది',
    'returnRequested': 'వాపసు అభ్యర్థించబడింది',
    'returnApproved': 'వాపసు ఆమోదించబడింది',
    'refundCompleted': 'రీఫండ్ పూర్తయింది',
    'orderId': 'ఆర్డర్ ID:',
    'items': 'వస్తువులు',
    'viewDetails': 'వివరాలను చూడండి',
    'viewAllOrders': 'అన్ని ఆర్డర్‌లను చూడండి',
    'addToCart': 'కార్ట్‌కు జోడించు',
    'moveAllToCart': 'అన్నింటినీ కార్ట్‌కు తరలించు',
    'removeAll': 'అన్నింటినీ తొలగించు',
    'moveToCart': 'కార్ట్‌కు తరలించు',
    'remove': 'తొలగించు',
    'youMayAlsoLike': 'మీకు కూడా నచ్చవచ్చు',
    'myOrdersPage': 'నా ఆర్డర్‌ల పేజీ',
    'loadingWishlist': 'మీ విష్‌లిస్ట్ లోడ్ అవుతోంది...',
    'emptyWishlistSub': 'మీకు ఇష్టమైన వస్తువులను తర్వాత చూడటానికి ఇక్కడ సేవ్ చేయండి.',
    'homeAddressType': 'ఇల్లు',
    'noOrdersFound': 'ఆర్డర్‌లు ఏవీ లేవు',
    'noAddressesFound': 'చిరునామాలు ఏవీ లేవు. దయచేసి కొత్తదాన్ని జోడించండి.',
    'wishlistCleared': 'విష్‌లిస్ట్ విజయవంతంగా క్లియర్ చేయబడింది',
    'failedToClearWishlist': 'విష్‌లిస్ట్‌ని క్లియర్ చేయడం విఫలమైంది'
  },
  kn: {
    'addNewAddress': 'ಹೊಸ ವಿಳಾಸವನ್ನು ಸೇರಿಸಿ',
    'edit': 'ತಿದ್ದು',
    'delete': 'ಅಳಿಸು',
    'setDefault': 'ಡಿಫಾಲ್ಟ್ ಆಗಿ ಹೊಂದಿಸಿ',
    'defaultAddress': 'ಡಿಫಾಲ್ಟ್',
    'all': 'ಎಲ್ಲಾ',
    'pending': 'ಬಾಕಿ ಉಳಿದಿದೆ',
    'processing': 'ಕಾರ್ಯಗತಗೊಳಿಸಲಾಗುತ್ತಿದೆ',
    'shipped': 'ರವಾನಿಸಲಾಗಿದೆ',
    'delivered': 'ವಿತರಿಸಲಾಗಿದೆ',
    'cancelled': 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ',
    'returnRequested': 'ಹಿಂದಿರುಗಿಸಲು ವಿನಂತಿಸಲಾಗಿದೆ',
    'returnApproved': 'ಹಿಂದಿರುಗಿಸಲು ಅನುಮೋದಿಸಲಾಗಿದೆ',
    'refundCompleted': 'ಮರುಪಾವತಿ ಪೂರ್ಣಗೊಂಡಿದೆ',
    'orderId': 'ಆರ್ಡರ್ ID:',
    'items': 'ವಸ್ತುಗಳು',
    'viewDetails': 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    'viewAllOrders': 'ಎಲ್ಲಾ ಆರ್ಡರ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    'addToCart': 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
    'moveAllToCart': 'ಎಲ್ಲವನ್ನೂ ಕಾರ್ಟ್‌ಗೆ ಸರಿಸಿ',
    'removeAll': 'ಎಲ್ಲವನ್ನೂ ತೆಗೆದುಹಾಕಿ',
    'moveToCart': 'ಕಾರ್ಟ್‌ಗೆ ಸರಿಸಿ',
    'remove': 'ತೆಗೆದುಹಾಕಿ',
    'youMayAlsoLike': 'ನಿಮಗೂ ಇಷ್ಟವಾಗಬಹುದು',
    'myOrdersPage': 'ನನ್ನ ಆರ್ಡರ್‌ಗಳ ಪುಟ',
    'loadingWishlist': 'ನಿಮ್ಮ ವಿಶ್‌ಲಿಸ್ಟ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'emptyWishlistSub': 'ನಿಮ್ಮ ಮೆಚ್ಚಿನ ವಸ್ತುಗಳನ್ನು ನಂತರ ವೀಕ್ಷಿಸಲು ಇಲ್ಲಿ ಉಳಿಸಿ.',
    'homeAddressType': 'ಮನೆ',
    'noOrdersFound': 'ಯಾವುದೇ ಆರ್ಡರ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
    'noAddressesFound': 'ಯಾವುದೇ ವಿಳಾಸಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೊಸದನ್ನು ಸೇರಿಸಿ.',
    'wishlistCleared': 'ವಿಶ್‌ಲಿಸ್ಟ್ ಅನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ',
    'failedToClearWishlist': 'ವಿಶ್‌ಲಿಸ್ಟ್ ತೆರವುಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ'
  },
  ml: {
    'addNewAddress': 'പുതിയ വിലാസം ചേർക്കുക',
    'edit': 'തിരുത്തുക',
    'delete': 'ഇല്ലാതാക്കുക',
    'setDefault': 'ഡിഫോൾട്ട് ആക്കുക',
    'defaultAddress': 'ഡിഫോൾട്ട്',
    'all': 'എല്ലാം',
    'pending': 'തീർപ്പുകൽപ്പിച്ചിട്ടില്ല',
    'processing': 'പ്രോസസ്സ് ചെയ്യുന്നു',
    'shipped': 'അയച്ചു',
    'delivered': 'വിതരണം ചെയ്തു',
    'cancelled': 'റദ്ദാക്കി',
    'returnRequested': 'തിരികെ നൽകാൻ അഭ്യർത്ഥിച്ചു',
    'returnApproved': 'തിരികെ നൽകാൻ അംഗീകരിച്ചു',
    'refundCompleted': 'റീഫണ്ട് പൂർത്തിയായി',
    'orderId': 'ഓർഡർ ഐഡി:',
    'items': 'ഇനങ്ങൾ',
    'viewDetails': 'വിശദാംശങ്ങൾ കാണുക',
    'viewAllOrders': 'എല്ലാ ഓർഡറുകളും കാണുക',
    'addToCart': 'കാർട്ടിലേക്ക് ചേർക്കുക',
    'moveAllToCart': 'എല്ലാം കാർട്ടിലേക്ക് മാറ്റുക',
    'removeAll': 'എല്ലാം നീക്കംചെയ്യുക',
    'moveToCart': 'കാർട്ടിലേക്ക് മാറ്റുക',
    'remove': 'നീക്കംചെയ്യുക',
    'youMayAlsoLike': 'നിങ്ങൾക്കിതു കൂടി ഇഷ്ടപ്പെട്ടേക്കാം',
    'myOrdersPage': 'എന്റെ ഓർഡറുകളുടെ പേജ്',
    'loadingWishlist': 'നിങ്ങളുടെ വിഷ്‌ലിസ്റ്റ് ലോഡുചെയ്യുന്നു...',
    'emptyWishlistSub': 'നിങ്ങളുടെ പ്രിയപ്പെട്ട ഇനങ്ങൾ പിന്നീട് കാണുന്നതിന് ഇവിടെ സംരക്ഷിക്കുക.',
    'homeAddressType': 'വീട്',
    'noOrdersFound': 'ഓർഡറുകളൊന്നും കണ്ടെത്തിയില്ല',
    'noAddressesFound': 'വിലാസങ്ങളൊന്നും കണ്ടെത്തിയില്ല. ദയവായി ഒരെണ്ണം ചേർക്കുക.',
    'wishlistCleared': 'വിഷ്‌ലിസ്റ്റ് വിജയകരമായി മായ്‌ച്ചു',
    'failedToClearWishlist': 'വിഷ്‌ലിസ്റ്റ് മായ്‌ക്കുന്നതിൽ പരാജയപ്പെട്ടു'
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
