import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister'
import './globals.css'

export const metadata: Metadata = {
  title: 'kinPass — La billetterie intelligente en RDC',
  description: 'Créez, vendez et contrôlez vos billets numériques pour vos événements en République démocratique du Congo.',
  generator: 'v0.app',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f8fafc' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="bg-background" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          {/* PWA : enregistrement du service worker (production uniquement) */}
          <ServiceWorkerRegister />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
