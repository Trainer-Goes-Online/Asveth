import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import TrackingCapture from '../components/TrackingCapture'

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
        {/* ── Microsoft Clarity (hardcoded project id) ── */}
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xf59a6qu6o");
          `}
        </Script>

        {/* ── Google Analytics 4 (gtag.js, hardcoded measurement id) ── */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-68RSECV7GG"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-68RSECV7GG');
          `}
        </Script>

        <TrackingCapture />
        {children}
      </body>
    </html>
  )
}