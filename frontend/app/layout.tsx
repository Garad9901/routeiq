import React from 'react';
import './globals.css';

export const metadata = {
  title: 'RouteIQ – Smart Road Intelligence Platform',
  description: 'AI-powered smart city road intelligence dashboard, predicting infrastructure degradation and optimizing maintenance plans.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        {/* Leaflet CDN Stylesheet - critical for the client map-component */}
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
          crossOrigin="" 
        />
      </head>
      <body className="antialiased bg-background text-white selection:bg-electricBlue selection:text-background">
        {children}
      </body>
    </html>
  );
}
