'use client'

import { useState, useEffect } from 'react'

export interface LinkAppleButtonProps {
  userId: string
  onSuccess: (user: any) => void
  themeConfig: any
}

export function LinkAppleButton({ userId, onSuccess, themeConfig }: LinkAppleButtonProps) {
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [isAppleAvailable, setIsAppleAvailable] = useState(false)

  useEffect(() => {
    // Check if AppleID is available
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
      try {
        document.head.removeChild(script)
      } catch (e) {
        // Script already removed
      }
    }
  }, [isAppleAvailable])

  const handleAppleLinkSuccess = async (credentialResponse: any) => {
    setIsLinking(true)
    setLinkError('')

    try {
      const response = await fetch('/api/auth/link-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          identityToken: credentialResponse.id_token,
          userIdentifier: credentialResponse.user?.name?.firstName || credentialResponse.user?.email,
          oauthProvider: 'apple'
        })
      })

      const result = await response.json()

      if (result.success) {
        onSuccess(result.user)
      } else {
        setLinkError(result.error || 'Failed to link Apple account')
      }
    } catch (error: any) {
      setLinkError(error.message || 'Failed to link Apple account')
    } finally {
      setIsLinking(false)
    }
  }

  const handleAppleLinkError = () => {
    setLinkError('Apple sign-in failed')
  }

  const handleAppleSignIn = async () => {
    try {
      const AppleID = (window as any).AppleID
      if (!AppleID) {
        handleAppleLinkError()
        return
      }

      const response = await AppleID.auth.signIn()
      if (response.authorization) {
        await handleAppleLinkSuccess(response.authorization)
      } else {
        handleAppleLinkError()
      }
    } catch (error: any) {
      console.error('Apple Sign-In error:', error)
      handleAppleLinkError()
    }
  }

  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID

  if (!clientId) {
    return (
      <div className="w-full p-3 rounded-lg border border-yellow-500 bg-yellow-50 text-yellow-800 text-sm">
        <p>Apple Sign-In not configured</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {linkError && (
        <div className="p-3 rounded-lg border border-red-500 bg-red-50 text-red-800 text-sm">
          <p>{linkError}</p>
        </div>
      )}

      <div>
        <p className={`text-sm font-medium mb-2 ${themeConfig.text.secondary}`}>
          Link Apple Account
        </p>
        <button
          onClick={handleAppleSignIn}
          disabled={isLinking}
          className={`w-full px-4 py-3 rounded-lg border border-gray-300 bg-black text-white font-medium hover:bg-gray-900 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.05 13.5c-.91 0-1.82.55-2.25 1.74.5.5 1.8 2 4.2 2 2.4 0 3.7-1.5 4.2-2-.43-1.19-1.34-1.74-2.25-1.74-1.51 0-2.48 1.1-2.48 1.74 0 .64.97 1.74 2.48 1.74.91 0 1.82-.55 2.25-1.74-.5-.5-1.8-2-4.2-2-2.4 0-3.7 1.5-4.2 2 .43 1.19 1.34 1.74 2.25 1.74 1.51 0 2.48-1.1 2.48-1.74 0-.64-.97-1.74-2.48-1.74zm-10.95-2c-1.51 0-2.48 1.1-2.48 1.74 0 .64.97 1.74 2.48 1.74.91 0 1.82-.55 2.25-1.74-.5-.5-1.8-2-4.2-2-2.4 0-3.7 1.5-4.2 2 .43 1.19 1.34 1.74 2.25 1.74 1.51 0 2.48-1.1 2.48-1.74 0-.64-.97-1.74-2.48-1.74z" />
          </svg>
          {isLinking ? 'Linking...' : 'Sign in with Apple'}
        </button>
      </div>
    </div>
  )
}
