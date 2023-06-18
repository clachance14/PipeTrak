export default function LanguageSwitch({
  locales,
  currentLang,
}: {
  locales: string[];
  currentLang: string;
}) {
  return (
    <div>
      {locales.map((locale) => {
        const isActive = locale === currentLang;

        return (
          <a
            key={locale}
            href={`?lang=${locale}`}
            className={isActive ? "font-bold" : ""}
          >
            {locale}
          </a>
        );
      })}
    </div>
  );
}
