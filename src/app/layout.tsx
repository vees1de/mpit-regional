import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Game Feed",
//   description: "Vertical game feed with swipeable mini-games.",
//   manifest: "/manifest.json",
//   icons: {
//     icon: [
//       { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
//       { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
//     ],
//     apple: "/icons/icon-192.png",
//   },
//   appleWebApp: {
//     capable: true,
//     statusBarStyle: "black-translucent",
//     title: "Game Feed",
//   },
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
