import type { Metadata } from 'next'
import { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Berea Books Admin',
  description: 'Admin panel for Berea Books',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </body>
    </html>
  )
}
