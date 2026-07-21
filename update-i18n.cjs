const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'language');
const files = ['en.json', 'ta.json', 'te.json', 'kn.json', 'ml.json'];

const translations = {
  en: {
    'footer.tagline': 'Happiness in Every Cart',
    'footer.brandDesc': 'SadhanaCart is a multipurpose ecommerce platform for Electronics, Fashion, Groceries, Gifts, Medical, and more.',
    'footer.customerService': 'CUSTOMER SERVICE',
    'footer.helpCenter': 'Help Center',
    'footer.trackOrder': 'Track Order',
    'footer.policiesHeading': 'POLICIES',
    'return-Policy;': 'Return Policy',
    'shipping-Policy': 'Shipping Policy',
    "term's": 'Terms & Conditions',
    'returnPolicy': 'Return & Refund Policy',
    'home.viewAllDeals': 'View All Deals →',
    'footer.company': 'COMPANY',
    'footer.careers': 'Careers',
    'footer.blog': 'Blog',
    'footer.contactUsHeading': 'CONTACT US',
    'workingDays': 'Monday to Saturday',
    'footer.sundayClosed': 'Sunday Closed',
    'registeredOffice': 'REGISTERED OFFICE',
    'addresspage.line1': 'Ground Floor, Ward No. 24, A No. 4-14-155/36A,',
    'addresspage.line2': 'Teachers Colony, Near LIC Office,',
    'addresspage.line3': 'Gangawati – 583222, Koppal District,',
    'addresspage.line4': 'Karnataka.',
    'footer.weAccept': 'WE ACCEPT',
    'footer.followUs': 'FOLLOW US',
    'confirmLogoutTitle': 'Confirm Log Out',
    'confirmLogoutMessage': 'Are you sure you want to log out?',
    'confirmLogoutDesc': "You'll be signed out of your account and will need to log in again to access your profile, bookings, and other personalized features.",
    'staySignedIn': 'Stay Signed In'
  },
  ta: {
    'footer.tagline': 'ஒவ்வொரு கார்ட்டிலும் மகிழ்ச்சி',
    'footer.brandDesc': 'சாதனாகார்ட் என்பது மின்னணு, ஃபேஷன், மளிகை, பரிசுகள், மருத்துவம் மற்றும் பலவற்றுக்கான பல்நோக்கு ஈ-காமர்ஸ் தளமாகும்.',
    'footer.customerService': 'வாடிக்கையாளர் சேவை',
    'footer.helpCenter': 'உதவி மையம்',
    'footer.trackOrder': 'ஆர்டரை கண்காணிக்க',
    'footer.policiesHeading': 'கொள்கைகள்',
    'return-Policy;': 'திரும்பப் பெறும் கொள்கை',
    'shipping-Policy': 'ஷிப்பிங் கொள்கை',
    "term's": 'விதிமுறைகள் மற்றும் நிபந்தனைகள்',
    'returnPolicy': 'திரும்பப் பெறும் மற்றும் பணத்தைத் திரும்பப்பெறும் கொள்கை',
    'home.viewAllDeals': 'அனைத்து சலுகைகளையும் காண்க →',
    'footer.company': 'நிறுவனம்',
    'footer.careers': 'வேலைவாய்ப்புகள்',
    'footer.blog': 'வலைப்பதிவு',
    'footer.contactUsHeading': 'எங்களை தொடர்பு கொள்ள',
    'workingDays': 'திங்கள் முதல் சனி வரை',
    'footer.sundayClosed': 'ஞாயிறு விடுமுறை',
    'registeredOffice': 'பதிவு செய்யப்பட்ட அலுவலகம்',
    'addresspage.line1': 'தரை தளம், வார்டு எண். 24, A எண். 4-14-155/36A,',
    'addresspage.line2': 'டீச்சர்ஸ் காலனி, எல்.ஐ.சி அலுவலகம் அருகில்,',
    'addresspage.line3': 'கங்காவதி – 583222, கொப்பல் மாவட்டம்,',
    'addresspage.line4': 'கர்நாடகா.',
    'footer.weAccept': 'நாங்கள் ஏற்றுக்கொள்கிறோம்',
    'footer.followUs': 'எங்களை பின்தொடரவும்',
    'confirmLogoutTitle': 'வெளியேறுதலை உறுதிப்படுத்தவும்',
    'confirmLogoutMessage': 'நீங்கள் உறுதியாக வெளியேற விரும்புகிறீர்களா?',
    'confirmLogoutDesc': "உங்கள் கணக்கிலிருந்து நீங்கள் வெளியேற்றப்படுவீர்கள், உங்கள் சுயவிவரம், முன்பதிவுகள் மற்றும் பிற அம்சங்களை அணுக மீண்டும் உள்நுழைய வேண்டும்.",
    'staySignedIn': 'உள்நுழைந்திருக்கவும்'
  },
  te: {
    'footer.tagline': 'ప్రతి కార్ట్‌లో సంతోషం',
    'footer.brandDesc': 'సాధనకార్ట్ అనేది ఎలక్ట్రానిక్స్, ఫ్యాషన్, కిరాణా, బహుమతులు, మెడికల్ మరియు మరెన్నో బహుళార్ధసాధక ఇకామర్స్ వేదిక.',
    'footer.customerService': 'కస్టమర్ సేవ',
    'footer.helpCenter': 'సహాయ కేంద్రం',
    'footer.trackOrder': 'ఆర్డర్‌ను ట్రాక్ చేయండి',
    'footer.policiesHeading': 'విధానాలు',
    'return-Policy;': 'వాపసు విధానం',
    'shipping-Policy': 'షిప్పింగ్ విధానం',
    "term's": 'నిబంధనలు & షరతులు',
    'returnPolicy': 'వాపసు & రీఫండ్ విధానం',
    'home.viewAllDeals': 'అన్ని డీల్స్ చూడండి →',
    'footer.company': 'కంపెనీ',
    'footer.careers': 'కెరీర్లు',
    'footer.blog': 'బ్లాగ్',
    'footer.contactUsHeading': 'మమ్మల్ని సంప్రదించండి',
    'workingDays': 'సోమవారం నుండి శనివారం వరకు',
    'footer.sundayClosed': 'ఆదివారం సెలవు',
    'registeredOffice': 'నమోదిత కార్యాలయం',
    'addresspage.line1': 'గ్రౌండ్ ఫ్లోర్, వార్డ్ నెం. 24, ఏ నెం. 4-14-155/36A,',
    'addresspage.line2': 'టీచర్స్ కాలనీ, ఎల్ఐసి ఆఫీస్ దగ్గర,',
    'addresspage.line3': 'గంగావతి – 583222, కొప్పల్ జిల్లా,',
    'addresspage.line4': 'కర్ణాటక.',
    'footer.weAccept': 'మేము అంగీకరిస్తాము',
    'footer.followUs': 'మమ్మల్ని అనుసరించండి',
    'confirmLogoutTitle': 'లాగ్ అవుట్‌ని నిర్ధారించండి',
    'confirmLogoutMessage': 'మీరు ఖచ్చితంగా లాగ్ అవుట్ చేయాలనుకుంటున్నారా?',
    'confirmLogoutDesc': "మీరు మీ ఖాతా నుండి లాగ్ అవుట్ అవుతారు, మీ ప్రొఫైల్ మరియు ఇతర ఫీచర్లను యాక్సెస్ చేయడానికి మళ్లీ లాగిన్ అవ్వాలి.",
    'staySignedIn': 'సైన్ ఇన్ చేసి ఉండండి'
  },
  kn: {
    'footer.tagline': 'ಪ್ರತಿಯೊಂದು ಕಾರ್ಟ್‌ನಲ್ಲಿ ಸಂತೋಷ',
    'footer.brandDesc': 'ಸಾಧನಾಕಾರ್ಟ್ ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್, ಫ್ಯಾಷನ್, ದಿನಸಿ, ಉಡುಗೊರೆಗಳು, ವೈದ್ಯಕೀಯ ಮತ್ತು ಹೆಚ್ಚಿನವುಗಳಿಗಾಗಿ ಬಹುಪಯೋಗಿ ಇಕಾಮರ್ಸ್ ವೇದಿಕೆಯಾಗಿದೆ.',
    'footer.customerService': 'ಗ್ರಾಹಕ ಸೇವೆ',
    'footer.helpCenter': 'ಸಹಾಯ ಕೇಂದ್ರ',
    'footer.trackOrder': 'ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    'footer.policiesHeading': 'ನೀತಿಗಳು',
    'return-Policy;': 'ರಿಟರ್ನ್ ನೀತಿ',
    'shipping-Policy': 'ಶಿಪ್ಪಿಂಗ್ ನೀತಿ',
    "term's": 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು',
    'returnPolicy': 'ರಿಟರ್ನ್ ಮತ್ತು ಮರುಪಾವತಿ ನೀತಿ',
    'home.viewAllDeals': 'ಎಲ್ಲಾ ಡೀಲ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ →',
    'footer.company': 'ಕಂಪನಿ',
    'footer.careers': 'ವೃತ್ತಿಗಳು',
    'footer.blog': 'ಬ್ಲಾಗ್',
    'footer.contactUsHeading': 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ',
    'workingDays': 'ಸೋಮವಾರದಿಂದ ಶನಿವಾರದವರೆಗೆ',
    'footer.sundayClosed': 'ಭಾನುವಾರ ರಜೆ',
    'registeredOffice': 'ನೋಂದಾಯಿತ ಕಚೇರಿ',
    'addresspage.line1': 'ನೆಲ ಅಂತಸ್ತು, ವಾರ್ಡ್ ನಂ. 24, ಎ ನಂ. 4-14-155/36A,',
    'addresspage.line2': 'ಟೀಚರ್ಸ್ ಕಾಲೋನಿ, ಎಲ್ಐಸಿ ಕಚೇರಿ ಹತ್ತಿರ,',
    'addresspage.line3': 'ಗಂಗಾವತಿ - 583222, ಕೊಪ್ಪಳ ಜಿಲ್ಲೆ,',
    'addresspage.line4': 'ಕರ್ನಾಟಕ.',
    'footer.weAccept': 'ನಾವು ಸ್ವೀಕರಿಸುತ್ತೇವೆ',
    'footer.followUs': 'ನಮ್ಮನ್ನು ಅನುಸರಿಸಿ',
    'confirmLogoutTitle': 'ಲಾಗ್ ಔಟ್ ದೃಢೀಕರಿಸಿ',
    'confirmLogoutMessage': 'ನೀವು ಖಚಿತವಾಗಿ ಲಾಗ್ ಔಟ್ ಮಾಡಲು ಬಯಸುವಿರಾ?',
    'confirmLogoutDesc': "ನಿಮ್ಮ ಖಾತೆಯಿಂದ ನೀವು ಲಾಗ್ ಔಟ್ ಆಗುತ್ತೀರಿ, ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಇತರ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಪ್ರವೇಶಿಸಲು ಮತ್ತೆ ಲಾಗಿನ್ ಆಗಬೇಕಾಗುತ್ತದೆ.",
    'staySignedIn': 'ಸೈನ್ ಇನ್ ಆಗಿರಿ'
  },
  ml: {
    'footer.tagline': 'ഓരോ കാർട്ടിലും സന്തോഷം',
    'footer.brandDesc': 'ഇലക്ട്രോണിക്സ്, ഫാഷൻ, പലചരക്ക്, സമ്മാനങ്ങൾ, മെഡിക്കൽ എന്നിവയ്ക്കും അതിലേറെ കാര്യങ്ങൾക്കുമുള്ള ഒരു ബഹുവിധ ഇ-കൊമേഴ്‌സ് പ്ലാറ്റ്‌ഫോമാണ് സാധനാകാർട്ട്.',
    'footer.customerService': 'ഉപഭോക്തൃ സേവനം',
    'footer.helpCenter': 'സഹായ കേന്ദ്രം',
    'footer.trackOrder': 'ഓർഡർ ട്രാക്ക് ചെയ്യുക',
    'footer.policiesHeading': 'നയങ്ങൾ',
    'return-Policy;': 'മടക്കിനൽകൽ നയം',
    'shipping-Policy': 'ഷിപ്പിംഗ് നയം',
    "term's": 'നിബന്ധനകളും വ്യവസ്ഥകളും',
    'returnPolicy': 'മടക്കിനൽകൽ, റീഫണ്ട് നയം',
    'home.viewAllDeals': 'എല്ലാ ഡീലുകളും കാണുക →',
    'footer.company': 'കമ്പനി',
    'footer.careers': 'തൊഴിലവസരങ്ങൾ',
    'footer.blog': 'ബ്ലോഗ്',
    'footer.contactUsHeading': 'ഞങ്ങളെ ബന്ധപ്പെടുക',
    'workingDays': 'തിങ്കൾ മുതൽ ശനി വരെ',
    'footer.sundayClosed': 'ഞായറാഴ്ച അവധി',
    'registeredOffice': 'രജിസ്റ്റർ ചെയ്ത ഓഫീസ്',
    'addresspage.line1': 'താഴത്തെ നില, വാർഡ് നമ്പർ 24, എ നമ്പർ 4-14-155/36A,',
    'addresspage.line2': 'ടീച്ചേഴ്സ് കോളനി, എൽഐസി ഓഫീസിന് സമീപം,',
    'addresspage.line3': 'ഗംഗാവതി - 583222, കൊപ്പൽ ജില്ല,',
    'addresspage.line4': 'കർണാടക.',
    'footer.weAccept': 'ഞങ്ങൾ സ്വീകരിക്കുന്നു',
    'footer.followUs': 'ഞങ്ങളെ പിന്തുടരുക',
    'confirmLogoutTitle': 'ലോഗ് ഔട്ട് സ്ഥിരീകരിക്കുക',
    'confirmLogoutMessage': 'ലോഗ് ഔട്ട് ചെയ്യണമെന്ന് ഉറപ്പാണോ?',
    'confirmLogoutDesc': "നിങ്ങളുടെ അക്കൗണ്ടിൽ നിന്ന് ലോഗ് ഔട്ട് ആകും, നിങ്ങളുടെ പ്രൊഫൈലും മറ്റ് ഫീച്ചറുകളും ആക്സസ് ചെയ്യാൻ വീണ്ടും ലോഗിൻ ചെയ്യേണ്ടതുണ്ട്.",
    'staySignedIn': 'സൈൻ ഇൻ ചെയ്ത് തുടരുക'
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
