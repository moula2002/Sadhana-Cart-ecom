const fs = require('fs');
const path = require('path');

function updateComponent(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const replaceSidebar = (original, translationKey, englishText) => {
    const searchStr = `<span>${englishText}</span>`;
    if (content.includes(searchStr)) {
      content = content.replace(new RegExp(`<span>${englishText}</span>`, 'g'), `<span>{t("${translationKey}", "${englishText}")}</span>`);
      changed = true;
    }
    const boldStr = `<span style={{ fontWeight: "bold" }}>${englishText}</span>`;
    if (content.includes(boldStr)) {
      content = content.replace(new RegExp(`<span style=\\{\\{ fontWeight: "bold" \\}\\}>${englishText}</span>`, 'g'), `<span style={{ fontWeight: "bold" }}>{t("${translationKey}", "${englishText}")}</span>`);
      changed = true;
    }
  };

  replaceSidebar(content, 'myProfile', 'My Profile');
  replaceSidebar(content, 'myOrders', 'My Orders');
  replaceSidebar(content, 'wishlistLabel', 'Wishlist');
  replaceSidebar(content, 'myAddresses', 'My Addresses');
  replaceSidebar(content, 'sadhanaRewards', 'Sadhana Rewards');
  replaceSidebar(content, 'paymentMethods', 'Payment Methods');
  replaceSidebar(content, 'accountSettings', 'Account Settings');
  replaceSidebar(content, 'logout', 'Logout');

  if (content.includes('My Orders Page')) {
    content = content.replace(/My Orders Page/g, '{t("myOrdersPage", "My Orders Page")}');
    changed = true;
  }
  if (content.includes('>My Orders<')) {
    content = content.replace(/>My Orders</g, '>{t("myOrders", "My Orders")}<');
    changed = true;
  }

  // Tabs for orders
  const tabsReplace = [
    ['"All",', 't("all", "All"),'],
    ['"Pending",', 't("pending", "Pending"),'],
    ['"Processing",', 't("processing", "Processing"),'],
    ['"Shipped",', 't("shipped", "Shipped"),'],
    ['"Delivered",', 't("delivered", "Delivered"),'],
    ['"Cancelled",', 't("cancelled", "Cancelled"),'],
    ['"Return Requested",', 't("returnRequested", "Return Requested"),'],
    ['"Return Approved",', 't("returnApproved", "Return Approved"),'],
    ['"Refund Completed"', 't("refundCompleted", "Refund Completed")']
  ];
  for (const [s, r] of tabsReplace) {
    if (content.includes(s)) {
      content = content.replace(new RegExp(s, 'g'), r);
      changed = true;
    }
  }

  if (content.includes('Order ID:')) {
    content = content.replace(/Order ID:/g, '{t("orderId", "Order ID:")}');
    changed = true;
  }
  if (content.includes('> items<')) {
    content = content.replace(/> items</g, '> {t("items", "items")}<');
    changed = true;
  }
  if (content.includes('>View Details<')) {
    content = content.replace(/>View Details</g, '>{t("viewDetails", "View Details")}<');
    changed = true;
  }
  if (content.includes('>View All Orders<')) {
    content = content.replace(/>View All Orders</g, '>{t("viewAllOrders", "View All Orders")}<');
    changed = true;
  }
  
  if (content.includes('No {selectedTab !== "All" ? selectedTab.toLowerCase() : ""} orders found')) {
    content = content.replace(/No \{selectedTab !== "All" \? selectedTab\.toLowerCase\(\) : ""\} orders found/g, '{t("noOrdersFound", "No orders found")}');
    changed = true;
  }

  // Address List stuff
  if (content.includes('>Add New Address<')) {
    content = content.replace(/>Add New Address</g, '>{t("addNewAddress", "Add New Address")}<');
    changed = true;
  }
  if (content.includes('>Default<')) {
    content = content.replace(/>Default</g, '>{t("default", "Default")}<');
    changed = true;
  }
  if (content.includes('>Home<')) {
    content = content.replace(/>Home</g, '>{t("homeAddressType", "Home")}<');
    changed = true;
  }
  if (content.includes('>Edit<')) {
    content = content.replace(/>Edit</g, '>{t("edit", "Edit")}<');
    changed = true;
  }
  if (content.includes('>Delete<')) {
    content = content.replace(/>Delete</g, '>{t("delete", "Delete")}<');
    changed = true;
  }
  if (content.includes('>Set Default<')) {
    content = content.replace(/>Set Default</g, '>{t("setDefault", "Set Default")}<');
    changed = true;
  }

  if (changed) {
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
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
}

const files = [
  path.join(__dirname, 'src', 'components', 'cartPage', 'ViewOrderDetails.jsx'),
  path.join(__dirname, 'src', 'pages', 'AddressList.jsx'),
  path.join(__dirname, 'src', 'pages', 'SaveAddress.jsx'),
  path.join(__dirname, 'src', 'pages', 'Wishlist.jsx')
];

for (const file of files) {
  if (fs.existsSync(file)) {
    updateComponent(file);
  }
}
