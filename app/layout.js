import "@openfonts/cormorant-garamond_all";
import "@openfonts/montserrat_all";
import "@openfonts/playfair-display_all";
import "@openfonts/inter_all";
import "@openfonts/great-vibes_all";
import "@openfonts/ms-madi_all";
import "@fontsource/windsong/400.css";
import "./globals.css";
import "./chloe.css";
import "./veno.css";
import "./riviera.css";
import "./cathedral.css";

export const metadata = {
  title: "YesDay Studio — Váš digitálny svadobný pomocník",
  description:
    "Menej správ hosťom, viac pokoja pred svadbou. Svadobný web, pozvánky, potvrdenia účasti a prehľad hostí na jednom mieste. Vyskúšajte YesDay bez registrácie.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="sk"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
