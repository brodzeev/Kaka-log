import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { OAuthProvider } from '../components/OAuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kaki Logger',
  description: 'Personal calendar tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OAuthProvider>{children}</OAuthProvider>
      </body>
    </html>
  )
}