'use client'

import { useState } from 'react'
import { GoogleLogin as GoogleLoginComponent } from '@react-oauth/google'
import dynamic from 'next/dynamic'

const GoogleLoginDynamic = dynamic(
  () => Promise.resolve(GoogleLoginComponent),
  { ssr: false }
)

export interface LinkOAuthButtonProps {
  userId: string
  onSuccess: (user: any) => void
  themeConfig: any
}

export function LinkOAuthButton({ userId, onSuccess, themeConfig }: LinkOAuthButtonProps) {
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkedProviders, setLinkedProviders] = useState<string[]>([])

  const handleGoogleLinkSuccess = async (credentialResponse: any) => {
    setIsLinking(true)
    setLinkError('')
    
    try {
      const response = await fetch('/api/auth/link-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          idToken: credentialResponse.credential,
          oauthProvider: 'google'
        })
      })

      const result = await response.json()

      if (result.success) {
        setLinkedProviders(prev => [...prev, 'google'])
        onSuccess(result.user)
      } else {
        setLinkError(result.error || 'Failed to link Google account')
      }
    } catch (error: any) {
      setLinkError(error.message || 'Failed to link Google account')
    } finally {
      setIsLinking(false)
    }
  }

  const handleGoogleLinkError = () => {
    setLinkError('Google sign-in failed')
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    return (
      <div className="w-full p-3 rounded-lg border border-yellow-500 bg-yellow-50 text-yellow-800 text-sm">
        <p>Google Sign-In not configured</p>
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
          Link Google Account
        </p>
        <GoogleLoginDynamic
          onSuccess={handleGoogleLinkSuccess}
          onError={handleGoogleLinkError}
          theme="outline"
          size="large"
          width="100%"
        />
      </div>
    </div>
  )
}
