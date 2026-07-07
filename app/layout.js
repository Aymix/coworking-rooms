import "./globals.css";

export const metadata = {
  title: "Coworking Rooms",
  description: "Live room availability for the coworking space",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rooms",
  },
};

export const viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
