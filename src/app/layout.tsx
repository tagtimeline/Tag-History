// src/app/layout.tsx
import type { Metadata } from 'next'
import '../styles/base.css'
import '../styles/fonts.css'
import '../styles/*'

export const metadata: Metadata = {
  title: 'TNT Tag History',
  description: 'An interactive journey through the TNT Tag History',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/favicon.png' }
  ],
  openGraph: {
    title: 'TNT Tag History',
    description: 'An interactive journey through the TNT Tag History',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/favicon.png',
        width: 64,
        height: 64,
        alt: 'TNT Tag History'
      }
    ],
  },
  themeColor: '#67181D',
  viewport: 'width=device-width, initial-scale=1.0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}