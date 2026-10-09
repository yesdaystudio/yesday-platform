import "@openfonts/cormorant-garamond_all";
import "@openfonts/montserrat_all";
import "@openfonts/playfair-display_all";
import "@openfonts/inter_all";
import "@openfonts/great-vibes_all";
import "@openfonts/ms-madi_all";
import "./globals.css";

export const metadata = {
  title: "YesDay Studio — Svadobné weby s charakterom",
  description:
    "Elegantný digitálny priestor pre váš svadobný web, hostí a organizáciu. Prepojte svadobné pozvánky s výhodami moderného svadobného webu.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
