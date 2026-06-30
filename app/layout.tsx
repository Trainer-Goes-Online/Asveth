import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Athletic Indian – Male VSL',
  description: 'Transform your body and mindset with The Athletic Indian program',
  keywords: 'fitness, transformation, athletic, indian, male, workout, health',
  authors: [{ name: 'The Athletic Indian' }],
  creator: 'The Athletic Indian',
  publisher: 'The Athletic Indian',
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/final-logo.png', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/final-logo.png',
  },
  openGraph: {
    title: 'The Athletic Indian – Male VSL',
    description: 'Transform your body and mindset with The Athletic Indian program',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Athletic Indian – Male VSL',
    description: 'Transform your body and mindset with The Athletic Indian program',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,400;0,600;0,700;1,400&family=Barlow+Condensed:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}