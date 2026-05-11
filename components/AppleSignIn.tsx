'use client'

import { useEffect, useState } from 'react'

export interface AppleSignInProps {
  onSuccess: (credentialResponse: any) => void
  onError: () => void
}

export function AppleSignIn({ onSuccess, onError }: AppleSignInProps) {
  const [isAppleAvailable, setIsAppleAvailable] = useState(false)

  useEffect(() => {
    // Check if AppleID is available on the window object
    setIsAppleAvailable(!!(window as any).AppleID)
  }, [])

  useEffect(() => {
    if (!isAppleAvailable) return

    const script = document.createElement('script')
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid.js'
    script.async = true
    script.onload = () => {
      const AppleID = (window as any).AppleID
      if (AppleID) {
        AppleID.auth.init({
          clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
          teamId: process.env.NEXT_PUBLIC_APPLE_TEAM_ID,
          redirectURI: `${window.location.origin}/api/auth/apple/callback`,
          scope: 'email name',
          usePopup: true
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [isAppleAvailable])

  const handleAppleSignIn = async () => {
    try {
      const AppleID = (window as any).AppleID
      if (!AppleID) {
        onError()
        return
      }

      const response = await AppleID.auth.signIn()
      if (response.authorization) {
        onSuccess(response.authorization)
      } else {
        onError()
      }
    } catch (error) {
      console.error('Apple Sign-In error:', error)
      onError()
    }
  }

  if (!process.env.NEXT_PUBLIC_APPLE_CLIENT_ID) {
    return (
      <div className="w-full p-3 rounded-lg border border-yellow-500 bg-yellow-50 text-yellow-800 text-sm">
        <p>Apple Sign-In not configured. Please set NEXT_PUBLIC_APPLE_CLIENT_ID in .env.local</p>
      </div>
    )
  }

  return (
    <button
      onClick={handleAppleSignIn}
      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-black text-white font-medium hover:bg-gray-900 transition flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.05 13.5c-.91 0-1.82.55-2.25 1.74.5.5 1.8 2 4.2 2 2.4 0 3.7-1.5 4.2-2-.43-1.19-1.34-1.74-2.25-1.74-1.51 0-2.48 1.1-2.48 1.74 0 .64.97 1.74 2.48 1.74.91 0 1.82-.55 2.25-1.74-.5-.5-1.8-2-4.2-2-2.4 0-3.7 1.5-4.2 2 .43 1.19 1.34 1.74 2.25 1.74 1.51 0 2.48-1.1 2.48-1.74 0-.64-.97-1.74-2.48-1.74zm-10.95-2c-1.51 0-2.48 1.1-2.48 1.74 0 .64.97 1.74 2.48 1.74.91 0 1.82-.55 2.25-1.74-.5-.5-1.8-2-4.2-2-2.4 0-3.7 1.5-4.2 2 .43 1.19 1.34 1.74 2.25 1.74 1.51 0 2.48-1.1 2.48-1.74 0-.64-.97-1.74-2.48-1.74z" />
      </svg>
      Sign in with Apple
    </button>
  )
}
