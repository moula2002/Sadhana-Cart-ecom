import { useTranslation } from "react-i18next";
import "./LanguageSwitcher.css";

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLang = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  return (
    <div className="language-switcher">
      <select value={i18n.language} onChange={changeLang}>
        <option value="en">English</option>
        <option value="ta">Tamil</option>
        <option value="te">Telugu</option>
        <option value="kn">Kannada</option>
        <option value="ml">Malayalam</option>
      </select>
    </div>
  );
}

export default LanguageSwitcher;
