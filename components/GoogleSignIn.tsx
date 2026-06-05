'use client'

import dynamic from 'next/dynamic'
import { GoogleLogin as GoogleLoginComponent } from '@react-oauth/google'

const GoogleLoginDynamic = dynamic(
  () => Promise.resolve(GoogleLoginComponent),
  { ssr: false }
)

export interface GoogleSignInProps {
  onSuccess: (credentialResponse: any) => void
  onError: () => void
}

export function GoogleSignIn({ onSuccess, onError }: GoogleSignInProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    return (
      <div className="w-full p-3 rounded-lg border border-yellow-500 bg-yellow-50 text-yellow-800 text-sm">
        <p>Google Sign-In not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local</p>
      </div>
    )
  }

  return (
    <GoogleLoginDynamic
      onSuccess={onSuccess}
      onError={onError}
      theme="outline"
      size="large"
      width="100%"
    />
  )
}
