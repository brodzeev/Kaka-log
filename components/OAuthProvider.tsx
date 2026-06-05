'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { ReactNode } from 'react'

interface OAuthProviderProps {
  children: ReactNode
}

export function OAuthProvider({ children }: OAuthProviderProps) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!googleClientId) {
    console.warn('Google OAuth Client ID not configured. OAuth sign-in will not work.')
    return <>{children}</>
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {children}
    </GoogleOAuthProvider>
  )
}
