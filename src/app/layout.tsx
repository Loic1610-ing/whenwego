// src/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhenWeGo — Planifiez un voyage en groupe",
  description: "Synchronisez les disponibilités de tout le groupe en quelques clics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,700;0,900;1,300;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: "#f7f5f0", fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
