import "./global-style.css";

import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "LM",
  description: "Monitor Lighthouse scores over time",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <div className="py-4">
            <Navigation />
          </div>
        </header>
        <main className="p-4 pb-8">{children}</main>
      </body>
    </html>
  );
}
