'use client'

import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import CustomSelect from '../components/CustomSelect'
import StoolChart from '../components/StoolChart'
import { GoogleSignIn } from '../components/GoogleSignIn'
import { AppleSignIn } from '../components/AppleSignIn'
import { LinkOAuthButton } from '../components/LinkOAuthButton'
import { LinkAppleButton } from '../components/LinkAppleButton'
import { saveSession, clearSession, loadSession, handleGoogleOAuth, handleAppleOAuth, type AuthSession } from '../lib/auth'

interface FamilyMember {
  id: string
  name: string
  role?: 'adult' | 'child'
  relationship?: string
  dateOfBirth?: string
}

interface AuthMethod {
  type: 'username' | 'email' | 'google' | 'apple'
  linkedAt: string
  provider?: string
  providerId?: string
  identifier?: string
}

interface InviteCode {
  code: string
  familyId: string
  createdBy: string
  createdAt: string
  expiresAt: string
  usedBy?: string
  usedAt?: string
  active: boolean
}

interface User {
  id: string
  name: string
  password?: string
  role: 'adult' | 'child'
  familyMembers: FamilyMember[]
  authMethods?: AuthMethod[]
  theme?: 'light' | 'dark' | 'slate' | 'ocean' | 'forest' | 'sunset'
}

interface Log {
  id: string
  date: string
  type: string
  time: number
  quantity: 'small' | 'medium' | 'a lot'
  timestamp: string
  memberId: string
}

type View = 'calendar' | 'logs' | 'charts' | 'trends'
type Theme = 'light' | 'dark' | 'slate' | 'ocean' | 'forest' | 'sunset'

interface ThemeConfig {
  bg: {
    primary: string
    secondary: string
    tertiary: string
  }
  text: {
    primary: string
    secondary: string
  }
  button: {
    primary: string
    primaryText: string
    primaryHover: string
    secondary: string
    secondaryHover: string
  }
  border: string
  input: string
}

export default function Home() {
  const themes: Record<Theme, ThemeConfig> = {
    light: {
      bg: { primary: 'bg-slate-50', secondary: 'bg-white', tertiary: 'bg-slate-100' },
      text: { primary: 'text-slate-900', secondary: 'text-slate-600' },
      button: { primary: 'bg-slate-900', primaryText: 'text-white', primaryHover: 'hover:bg-slate-800', secondary: 'bg-slate-50', secondaryHover: 'hover:bg-slate-100' },
      border: 'border-slate-300',
      input: 'border-slate-300'
    },
    dark: {
      bg: { primary: 'bg-slate-900', secondary: 'bg-slate-800', tertiary: 'bg-slate-700' },
      text: { primary: 'text-white', secondary: 'text-slate-300' },
      button: { primary: 'bg-blue-600', primaryText: 'text-white', primaryHover: 'hover:bg-blue-700', secondary: 'bg-slate-700', secondaryHover: 'hover:bg-slate-600' },
      border: 'border-slate-700',
      input: 'border-slate-600'
    },
    slate: {
      bg: { primary: 'bg-slate-100', secondary: 'bg-slate-50', tertiary: 'bg-slate-200' },
      text: { primary: 'text-slate-900', secondary: 'text-slate-700' },
      button: { primary: 'bg-slate-700', primaryText: 'text-white', primaryHover: 'hover:bg-slate-600', secondary: 'bg-slate-100', secondaryHover: 'hover:bg-slate-200' },
      border: 'border-slate-300',
      input: 'border-slate-300'
    },
    ocean: {
      bg: { primary: 'bg-blue-50', secondary: 'bg-white', tertiary: 'bg-blue-100' },
      text: { primary: 'text-blue-900', secondary: 'text-blue-700' },
      button: { primary: 'bg-blue-600', primaryText: 'text-white', primaryHover: 'hover:bg-blue-700', secondary: 'bg-blue-50', secondaryHover: 'hover:bg-blue-100' },
      border: 'border-blue-300',
      input: 'border-blue-300'
    },
    forest: {
      bg: { primary: 'bg-green-50', secondary: 'bg-white', tertiary: 'bg-green-100' },
      text: { primary: 'text-green-900', secondary: 'text-green-700' },
      button: { primary: 'bg-green-700', primaryText: 'text-white', primaryHover: 'hover:bg-green-800', secondary: 'bg-green-50', secondaryHover: 'hover:bg-green-100' },
      border: 'border-green-300',
      input: 'border-green-300'
    },
    sunset: {
      bg: { primary: 'bg-orange-50', secondary: 'bg-white', tertiary: 'bg-orange-100' },
      text: { primary: 'text-orange-900', secondary: 'text-orange-700' },
      button: { primary: 'bg-orange-600', primaryText: 'text-white', primaryHover: 'hover:bg-orange-700', secondary: 'bg-orange-50', secondaryHover: 'hover:bg-orange-100' },
      border: 'border-orange-300',
      input: 'border-orange-300'
    }
  }

  const [theme, setTheme] = useState<Theme>('light')
  const [showModal, setShowModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [type, setType] = useState('soft')
  const [time, setTime] = useState(5)
  const [logs, setLogs] = useState<Log[]>([])
  const [view, setView] = useState<View>('calendar')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loginName, setLoginName] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [authMethod, setAuthMethod] = useState<'legacy' | 'modern'>('legacy')
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [quantity, setQuantity] = useState<'small' | 'medium' | 'a lot'>('medium')
  const [newMemberName, setNewMemberName] = useState('')
  const [addMemberError, setAddMemberError] = useState('')
  const [removeMemberError, setRemoveMemberError] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)
  
  // Settings/Profile state
  const [showSettings, setShowSettings] = useState(false)
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [showInviteCodeForm, setShowInviteCodeForm] = useState(false)
  const [inviteCodeError, setInviteCodeError] = useState('')
  const [showChildRegister, setShowChildRegister] = useState(false)
  const [childRegisterCode, setChildRegisterCode] = useState('')
  const [showLinkOAuth, setShowLinkOAuth] = useState(false)
  const [childRegisterName, setChildRegisterName] = useState('')
  const [childRegisterPassword, setChildRegisterPassword] = useState('')
  const [childRegisterError, setChildRegisterError] = useState('')
  const [linkedOAuthMethods, setLinkedOAuthMethods] = useState<string[]>([])
  const [showLinkAppleOAuth, setShowLinkAppleOAuth] = useState(false)
  // Family member editing state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editMemberName, setEditMemberName] = useState('')
  const [editMemberRole, setEditMemberRole] = useState<'adult' | 'child'>('child')
  const [editMemberRelationship, setEditMemberRelationship] = useState('')
  const [editMemberDateOfBirth, setEditMemberDateOfBirth] = useState('')
  const [editMemberError, setEditMemberError] = useState('')

  const tc = themes[theme]

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && (Object.keys(themes) as Theme[]).includes(savedTheme)) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  useEffect(() => {
    // Load session on mount
    const session = loadSession()
    if (session) {
      setLoggedInUser(session.user as User)
      setFamilyMembers(session.user.familyMembers)
      setCurrentMember(session.user.familyMembers[0] || null)
      const userTheme = (session.user.theme as Theme) || 'light'
      setTheme(userTheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (currentMember) {
      loadLogs()
    }
  }, [currentMember])

  const loadLogs = async () => {
    if (!currentMember || !loggedInUser) return
    const response = await fetch(`/api/logs?userId=${loggedInUser.id}&memberId=${currentMember.id}`)
    const data = await response.json()
    setLogs(data)
  }

  const onClickDay = (value: Date) => {
    if (!currentMember) return
    const dateString = value.toDateString()
    setSelectedDate(value)
    setType('soft') // Reset to default
    setTime(5)
    setQuantity('medium')
    setShowModal(true)
  }

  const save = async () => {
    if (!selectedDate || !currentMember) return

    const dateString = selectedDate.toDateString()
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: dateString,
        type,
        time,
        quantity,
        timestamp: new Date().toISOString(),
        memberId: currentMember.id
      })
    })

    await loadLogs()
    setShowModal(false)
  }

  const deleteSingleLog = async (logId: string) => {
    await fetch(`/api/log?logId=${logId}`, {
      method: 'DELETE'
    })

    await loadLogs()
  }

  const getLogsForDate = (date: Date | null) => {
    if (!date) return []
    const dateString = date.toDateString()
    return logs.filter(log => log.date === dateString)
  }

  const login = async () => {
    setLoginError('')
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: loginName || undefined, 
        email: loginEmail || undefined,
        password: loginPassword 
      })
    })
    const result = await response.json()
    if (result.success) {
      setLoggedInUser(result.user)
      setFamilyMembers(result.user.familyMembers)
      setCurrentMember(result.user.familyMembers[0] || null)
      // Set theme from user preference or default to light
      const userTheme = (result.user.theme as Theme) || 'light'
      setTheme(userTheme)
      document.documentElement.setAttribute('data-theme', userTheme)
      localStorage.setItem('theme', userTheme)
      // Save session with access token
      const expiresAt = result.expiresIn ? Date.now() + result.expiresIn * 1000 : Date.now() + 24 * 60 * 60 * 1000
      saveSession({ 
        user: result.user, 
        accessToken: result.accessToken,
        expiresAt
      })
      setLoginName('')
      setLoginEmail('')
      setLoginPassword('')
    } else {
      setLoginError(result.error || 'Login failed')
    }
  }

  const register = async () => {
    setRegisterError('')
    
    if (authMethod === 'modern') {
      // Email-based registration
      if (!registerEmail || !registerPassword || !registerName) {
        setRegisterError('Name, email, and password are required')
        return
      }
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: registerName, 
          email: registerEmail,
          password: registerPassword,
          authMethod: 'email'
        })
      })
      const result = await response.json()
      if (result.success) {
        // Auto-login with token from registration
        setLoggedInUser(result.user)
        setFamilyMembers(result.user.familyMembers)
        setCurrentMember(result.user.familyMembers[0] || null)
        const userTheme = (result.user.theme as Theme) || 'light'
        setTheme(userTheme)
        document.documentElement.setAttribute('data-theme', userTheme)
        localStorage.setItem('theme', userTheme)
        
        // Save session with access token
        const expiresAt = result.expiresIn ? Date.now() + result.expiresIn * 1000 : Date.now() + 24 * 60 * 60 * 1000
        saveSession({ 
          user: result.user, 
          accessToken: result.accessToken,
          expiresAt
        })
        
        setShowRegister(false)
        setRegisterName('')
        setRegisterEmail('')
        setRegisterPassword('')
      } else {
        setRegisterError(result.error || 'Registration failed')
      }
    } else {
      // Username-based registration (legacy)
      if (!registerName || !registerPassword) {
        setRegisterError('Username and password are required')
        return
      }
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: registerName, 
          password: registerPassword 
        })
      })
      const result = await response.json()
      if (result.success) {
        // Auto-login with token from registration
        setLoggedInUser(result.user)
        setFamilyMembers(result.user.familyMembers)
        setCurrentMember(result.user.familyMembers[0] || null)
        const userTheme = (result.user.theme as Theme) || 'light'
        setTheme(userTheme)
        document.documentElement.setAttribute('data-theme', userTheme)
        localStorage.setItem('theme', userTheme)
        
        // Save session with access token
        const expiresAt = result.expiresIn ? Date.now() + result.expiresIn * 1000 : Date.now() + 24 * 60 * 60 * 1000
        saveSession({ 
          user: result.user, 
          accessToken: result.accessToken,
          expiresAt
        })
        
        setShowRegister(false)
        setRegisterName('')
        setRegisterPassword('')
      } else {
        setRegisterError(result.error || 'Registration failed')
      }
    }
  }
  
  const handleGoogleSignIn = async (credentialResponse: any) => {
    try {
      const session = await handleGoogleOAuth(credentialResponse)
      if (session) {
        setLoggedInUser(session.user)
        setFamilyMembers(session.user.familyMembers)
        setCurrentMember(session.user.familyMembers[0] || null)
        const userTheme = (session.user.theme as Theme) || 'light'
        setTheme(userTheme)
        setLoginError('')
      } else {
        setLoginError('Google Sign-In failed')
      }
    } catch (error) {
      console.error('Google Sign-In error:', error)
      setLoginError('Google Sign-In failed')
    }
  }
  
  const handleAppleSignIn = async (credentialResponse: any) => {
    // credentialResponse is the Apple authorization response
    const identityToken = credentialResponse.id_token
    const userIdentifier = credentialResponse.user?.name?.firstName || credentialResponse.user?.email || ''
    const userEmail = credentialResponse.user?.email || ''

    if (!identityToken) {
      setLoginError('Apple Sign-In failed: Missing identity token')
      return
    }

    try {
      const session = await handleAppleOAuth(userIdentifier, userEmail || undefined)
      if (session) {
        setLoggedInUser(session.user)
        setFamilyMembers(session.user.familyMembers)
        setCurrentMember(session.user.familyMembers[0] || null)
        const userTheme = (session.user.theme as Theme) || 'light'
        setTheme(userTheme)
        setLoginError('')
      } else {
        setLoginError('Apple Sign-In failed')
      }
    } catch (error) {
      console.error('Apple Sign-In error:', error)
      setLoginError('Apple Sign-In failed')
    }
  }

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Save to database if user is logged in
    if (loggedInUser) {
      await fetch('/api/users/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser.id, theme: newTheme })
      })
    }
  }

  const addMember = async () => {
    if (!loggedInUser || !newMemberName.trim()) return
    // Only adults can add members
    if (loggedInUser.role !== 'adult') {
      setAddMemberError('Only adults can add family members')
      return
    }
    setAddMemberError('')
    const response = await fetch('/api/family-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: loggedInUser.id, name: newMemberName, role: 'child' })
    })
    const result = await response.json()
    if (result.success) {
      setFamilyMembers(prev => [...prev, result.member])
      if (!currentMember) setCurrentMember(result.member)
      setNewMemberName('')
    } else {
      setAddMemberError(result.error || 'Failed to add member')
    }
  }

  const removeMember = async () => {
    if (!loggedInUser || !currentMember) return
    // Only adults can remove members
    if (loggedInUser.role !== 'adult') {
      setRemoveMemberError('Only adults can remove family members')
      return
    }
    setRemoveMemberError('')
    const response = await fetch('/api/family-members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: loggedInUser.id, memberId: currentMember.id })
    })
    const result = await response.json()
    if (result.success) {
      const updatedMembers = familyMembers.filter(m => m.id !== currentMember.id)
      setFamilyMembers(updatedMembers)
      setCurrentMember(updatedMembers[0] || null)
      setLogs([]) // Clear logs since member changed
    } else {
      setRemoveMemberError(result.error || 'Failed to remove member')
    }
  }

  const startEditingMember = (member: FamilyMember) => {
    setEditingMemberId(member.id)
    setEditMemberName(member.name)
    setEditMemberRole(member.role || 'child')
    setEditMemberRelationship(member.relationship || '')
    setEditMemberDateOfBirth(member.dateOfBirth || '')
    setEditMemberError('')
  }

  const cancelEditingMember = () => {
    setEditingMemberId(null)
    setEditMemberName('')
    setEditMemberRole('child')
    setEditMemberRelationship('')
    setEditMemberDateOfBirth('')
    setEditMemberError('')
  }

  const updateFamilyMember = async () => {
    if (!loggedInUser || !editingMemberId) return
    if (!editMemberName.trim()) {
      setEditMemberError('Name is required')
      return
    }
    setEditMemberError('')
    const response = await fetch('/api/family-members', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: loggedInUser.id,
        memberId: editingMemberId,
        name: editMemberName,
        role: editMemberRole,
        relationship: editMemberRelationship,
        dateOfBirth: editMemberDateOfBirth
      })
    })
    const result = await response.json()
    if (result.success) {
      const updatedMembers = familyMembers.map(m => 
        m.id === editingMemberId ? result.member : m
      )
      setFamilyMembers(updatedMembers)
      if (currentMember?.id === editingMemberId) {
        setCurrentMember(result.member)
      }
      cancelEditingMember()
    } else {
      setEditMemberError(result.error || 'Failed to update member')
    }
  }

  // Load invite codes for adult user
  const loadInviteCodes = async () => {
    if (!loggedInUser) return
    
    // Load invite codes if adult
    if (loggedInUser.role === 'adult') {
      try {
        const response = await fetch(`/api/invite-codes?userId=${loggedInUser.id}`)
        const result = await response.json()
        if (result.success) {
          setInviteCodes(result.codes)
        }
      } catch (error) {
        console.error('Failed to load invite codes:', error)
      }
    }
    
    // Load auth methods
    try {
      const response = await fetch(`/api/auth/me?userId=${loggedInUser.id}`)
      const result = await response.json()
      if (result.success && result.user) {
        setLoggedInUser(prev => prev ? { ...prev, authMethods: result.user.authMethods } : null)
      }
    } catch (error) {
      console.error('Failed to load auth methods:', error)
    }
  }

  // Generate new invite code
  const generateInviteCode = async () => {
    if (!loggedInUser || loggedInUser.role !== 'adult') return
    setInviteCodeError('')
    try {
      const response = await fetch('/api/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser.id })
      })
      const result = await response.json()
      if (result.success) {
        setInviteCodes(prev => [...prev, result.code])
        setShowInviteCodeForm(false)
      } else {
        setInviteCodeError(result.error || 'Failed to generate invite code')
      }
    } catch (error) {
      setInviteCodeError('Error generating invite code')
    }
  }

  // Revoke invite code
  const revokeInviteCode = async (code: string) => {
    if (!loggedInUser || loggedInUser.role !== 'adult') return
    try {
      const response = await fetch(`/api/invite-codes?code=${code}&userId=${loggedInUser.id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        setInviteCodes(prev => prev.filter(c => c.code !== code))
      }
    } catch (error) {
      console.error('Failed to revoke invite code:', error)
    }
  }

  // Register as child with invite code
  const registerAsChild = async () => {
    setChildRegisterError('')
    if (!childRegisterCode || !childRegisterName || !childRegisterPassword) {
      setChildRegisterError('All fields are required')
      return
    }
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: childRegisterName,
          password: childRegisterPassword,
          inviteCode: childRegisterCode,
          parentId: '' // Will be determined by invite code
        })
      })
      const result = await response.json()
      if (result.success) {
        // Auto-login the child account
        setLoggedInUser(result.user)
        setFamilyMembers(result.user.familyMembers)
        setCurrentMember(result.user.familyMembers[0] || null)
        
        // Set theme from user preference or default to light
        const userTheme = (result.user.theme as Theme) || 'light'
        setTheme(userTheme)
        document.documentElement.setAttribute('data-theme', userTheme)
        localStorage.setItem('theme', userTheme)
        
        // Save session with access token (child account still gets JWT tokens)
        const expiresAt = result.expiresIn ? Date.now() + result.expiresIn * 1000 : Date.now() + 24 * 60 * 60 * 1000
        saveSession({ 
          user: result.user, 
          accessToken: result.accessToken,
          expiresAt
        })
        
        // Clear form and hide UI
        setShowChildRegister(false)
        setChildRegisterCode('')
        setChildRegisterName('')
        setChildRegisterPassword('')
      } else {
        setChildRegisterError(result.error || 'Failed to create account')
      }
    } catch (error) {
      setChildRegisterError('Error creating account')
    }
  }

  // Unlink OAuth method
  const unlinkOAuth = async (provider: 'google' | 'apple') => {
    if (!loggedInUser || linkedOAuthMethods.length <= 1) {
      alert('You must keep at least one authentication method')
      return
    }
    try {
      const response = await fetch(
        `/api/auth/link-oauth?userId=${loggedInUser.id}&provider=${provider}`,
        { method: 'DELETE' }
      )
      const result = await response.json()
      if (result.success) {
        setLinkedOAuthMethods(prev => prev.filter(m => m !== provider))
        setLoggedInUser(result.user)
      }
    } catch (error) {
      console.error('Failed to unlink OAuth:', error)
    }
  }

  const getChartTextColor = () => {
    const colorMap: Record<Theme, string> = {
      light: '#1e293b',
      dark: '#f1f5f9',
      slate: '#1e293b',
      ocean: '#0c2340',
      forest: '#15803d',
      sunset: '#92400e'
    }
    return colorMap[theme]
  }

  const getChartGridColor = () => {
    const colorMap: Record<Theme, string> = {
      light: '#cbd5e1',
      dark: '#475569',
      slate: '#cbd5e1',
      ocean: '#93c5fd',
      forest: '#86efac',
      sunset: '#fed7aa'
    }
    return colorMap[theme]
  }

  const shareStatistics = async () => {
    if (!currentMember || logs.length === 0) return

    const typeCounts = logs.reduce(
      (counts, log) => ({ ...counts, [log.type]: (counts[log.type] ?? 0) + 1 }),
      {} as Record<string, number>
    )
    const quantityCounts = logs.reduce(
      (counts, log) => ({ ...counts, [log.quantity]: (counts[log.quantity] ?? 0) + 1 }),
      {} as Record<string, number>
    )
    const totalLogs = logs.length
    const averageTime = totalLogs ? Math.round(logs.reduce((sum, log) => sum + log.time, 0) / totalLogs) : 0
    const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None'
    const mostCommonQuantity = Object.entries(quantityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None'

    const stats = `Kaki Logger Statistics for ${currentMember.name}

Total Logs: ${totalLogs}
Average Time: ${averageTime} minutes
Most Common Type: ${mostCommonType}
Most Common Quantity: ${mostCommonQuantity}
Average Weekly Frequency: ${getWeeklyFrequency()}

Breakdown by Type:
${Object.entries(typeCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`)
  .join('\n')}

Breakdown by Quantity:
${Object.entries(quantityCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([qty, count]) => `${qty.charAt(0).toUpperCase() + qty.slice(1)}: ${count}`)
  .join('\n')}

Generated on: ${new Date().toLocaleDateString()}`

    // Helper function to copy using legacy method
    const copyToClipboardLegacy = (text: string): boolean => {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      try {
        textarea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textarea)
        return success
      } catch (error) {
        document.body.removeChild(textarea)
        return false
      }
    }

    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kaki Logger Statistics',
          text: stats
        })
        return
      } catch (error: unknown) {
        // User cancelled or error - continue to fallback
        if ((error as Error).name === 'AbortError') {
          return // User cancelled
        }
      }
    }

    // Try modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(stats)
        alert('Statistics copied to clipboard!')
        return
      } catch (clipboardError) {
        console.log('Modern clipboard API failed, trying legacy method')
      }
    }

    // Try legacy clipboard method
    if (copyToClipboardLegacy(stats)) {
      alert('Statistics copied to clipboard!')
      return
    }

    // Final fallback: show statistics in an alert
    alert(`Copy this text:\n\n${stats}`)
  }

  const getWeeklyFrequency = () => {
    if (logs.length === 0) return 'No data'

    // Get the date range
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const firstDate = new Date(sortedLogs[0].date)
    const lastDate = new Date(sortedLogs[sortedLogs.length - 1].date)

    // Calculate number of days between first and last log
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    const weeks = daysDiff / 7 || 1 // Ensure at least 1 week for calculation

    // Calculate average logs per week
    const logsPerWeek = logs.length / weeks

    // Map to human-readable descriptions
    if (logsPerWeek >= 6.5) return 'Every day'
    if (logsPerWeek >= 5) return 'Almost every day'
    if (logsPerWeek >= 3) return '3-4 times a week'
    if (logsPerWeek >= 2) return 'Twice a week'
    if (logsPerWeek >= 1) return 'Once a week'
    if (logsPerWeek >= 0.5) return 'Once every 2 weeks'
    if (logsPerWeek >= 0.33) return 'Once every 3 weeks'
    return 'Less than once a month'
  }

  const generateReportHTML = async () => {
    if (!currentMember || logs.length === 0) return

    // Filter logs to only current month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    
    const currentMonthLogs = logs.filter(log => {
      const logDate = new Date(log.date)
      return logDate >= monthStart && logDate <= monthEnd
    })

    if (currentMonthLogs.length === 0) {
      return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kaki Logger Report</title>
      </head>
      <body>
        <div style="text-align: center; padding: 40px;">
          <h1>No logs for this month</h1>
        </div>
      </body>
      </html>
      `
    }

    // Helper function to convert and compress image to base64 with transparent background
    const imageToBase64 = async (imagePath: string): Promise<string> => {
      try {
        const response = await fetch(imagePath)
        const blob = await response.blob()
        
        // Create image element to load the image
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        return new Promise((resolve) => {
          img.onload = () => {
            // Create canvas and resize image to 60x60 for reports
            const canvas = document.createElement('canvas')
            const targetSize = 60
            canvas.width = targetSize
            canvas.height = targetSize
            
            const ctx = canvas.getContext('2d')
            if (ctx) {
              // Ensure transparent background (no fillStyle)
              ctx.clearRect(0, 0, targetSize, targetSize)
              
              // Draw resized image on canvas with transparent background
              ctx.drawImage(img, 0, 0, targetSize, targetSize)
              
              // Convert to PNG with transparency
              const compressedBase64 = canvas.toDataURL('image/png')
              resolve(compressedBase64)
            } else {
              resolve('')
            }
          }
          
          img.onerror = () => {
            console.log(`Could not load image: ${imagePath}`)
            resolve('')
          }
          
          // Set src to blob URL to trigger load
          img.src = URL.createObjectURL(blob)
        })
      } catch (error) {
        console.log(`Could not load image: ${imagePath}`)
        return ''
      }
    }

    // Pre-load all unique stool type images
    const imageCache: Record<string, string> = {}
    const stoolTypes = Array.from(new Set(currentMonthLogs.map(log => log.type)))
    for (const type of stoolTypes) {
      const imagePath = `/images/${type}.png`
      imageCache[type] = await imageToBase64(imagePath)
    }

    const typeCounts = currentMonthLogs.reduce(
      (counts, log) => ({ ...counts, [log.type]: (counts[log.type] ?? 0) + 1 }),
      {} as Record<string, number>
    )
    const quantityCounts = currentMonthLogs.reduce(
      (counts, log) => ({ ...counts, [log.quantity]: (counts[log.quantity] ?? 0) + 1 }),
      {} as Record<string, number>
    )
    const totalLogs = currentMonthLogs.length
    const averageTime = totalLogs ? Math.round(currentMonthLogs.reduce((sum, log) => sum + log.time, 0) / totalLogs) : 0
    const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None'
    const mostCommonQuantity = Object.entries(quantityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None'
    const weeklyFreq = getWeeklyFrequency()

    const sortedLogs = [...currentMonthLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const logsHTML = sortedLogs.map(log => {
      const imageBase64 = imageCache[log.type] || ''
      const imageTag = imageBase64 
        ? `<img src="${imageBase64}" alt="${log.type}" style="width: 40px; height: 40px; object-fit: contain;"/>`
        : `<div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">${log.type.charAt(0).toUpperCase()}</div>`

      return `
      <div style="display: flex; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px;">
        <div style="flex-shrink: 0;">
          ${imageTag}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">${new Date(log.date).toLocaleDateString()}</div>
          <div style="font-size: 14px; color: #666;">Type: <strong>${log.type}</strong></div>
          <div style="font-size: 14px; color: #666;">Quantity: <strong>${log.quantity}</strong></div>
          <div style="font-size: 14px; color: #666;">Time: <strong>${log.time} minutes</strong></div>
        </div>
      </div>
    `
    }).join('')

    const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kaki Logger Report - ${currentMember.name} - ${monthName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          padding: 20px;
          background: #f9fafb;
          color: #1f2937;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
          text-align: center;
          color: #1e40af;
          margin-bottom: 8px;
        }
        .member-name {
          text-align: center;
          color: #6b7280;
          margin-bottom: 30px;
          font-size: 18px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #1e40af;
        }
        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e40af;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 8px;
        }
        .logs-container {
          max-height: 600px;
          overflow-y: auto;
        }
        .footer {
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          margin-top: 40px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Kaki Logger Report</h1>
        <div class="member-name">For: ${currentMember.name} | ${monthName}</div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Entries</div>
            <div class="stat-value">${totalLogs}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Average Time</div>
            <div class="stat-value">${averageTime} min</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Most Common Type</div>
            <div class="stat-value">${mostCommonType.charAt(0).toUpperCase() + mostCommonType.slice(1)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Most Common Qty</div>
            <div class="stat-value">${mostCommonQuantity.charAt(0).toUpperCase() + mostCommonQuantity.slice(1)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Weekly Frequency</div>
            <div class="stat-value" style="font-size: 16px;">${weeklyFreq}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Type Distribution</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            ${Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => `
                <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${type}</div>
                  <div style="font-size: 20px; font-weight: 700; color: #1e40af;">${count}</div>
                </div>
              `).join('')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Quantity Distribution</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            ${Object.entries(quantityCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([qty, count]) => `
                <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${qty}</div>
                  <div style="font-size: 20px; font-weight: 700; color: #1e40af;">${count}</div>
                </div>
              `).join('')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Recent Logs (${totalLogs} total)</div>
          <div class="logs-container">
            ${logsHTML}
          </div>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>Kaki Logger Report</p>
        </div>
      </div>
    </body>
    </html>
    `

    return html
  }

  const downloadReport = async () => {
    const html = await generateReportHTML()
    if (!html) return

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kaki-logger-report-${currentMember?.name}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getImage = (type: string) => {
    const pngPath = `/images/${type}.png`
    const svgPath = `/images/${type}.svg`
    return <img src={pngPath} onError={e => { (e.currentTarget as HTMLImageElement).src = svgPath }} className="w-12 h-12 object-contain" alt={type} />
  }

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const log = logs.find(log => log.date === date.toDateString())
      if (log) {
        return <div className="flex justify-center"><img src={`/images/${log.type}.png`} onError={e => { (e.currentTarget as HTMLImageElement).src = `/images/${log.type}.svg` }} className="w-8 h-8 object-contain" alt={log.type} /></div>
      }
    }
    return null
  }

  const typeCounts = logs.reduce(
    (counts, log) => ({ ...counts, [log.type]: (counts[log.type] ?? 0) + 1 }),
    {} as Record<string, number>
  )
  const quantityCounts = logs.reduce(
    (counts, log) => ({ ...counts, [log.quantity]: (counts[log.quantity] ?? 0) + 1 }),
    {} as Record<string, number>
  )
  const totalLogs = logs.length
  const averageTime = totalLogs ? Math.round(logs.reduce((sum, log) => sum + log.time, 0) / totalLogs) : 0
  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None'
  const mostCommonQuantity = Object.entries(quantityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None'

  if (!loggedInUser) {
    return (
      <main className={`min-h-screen ${tc.bg.primary} ${tc.text.primary} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md rounded-xl ${tc.bg.secondary} p-8 shadow-sm`}>
          <h1 className="text-3xl font-bold mb-2 text-center">Kaki Logger</h1>
          <p className="text-center text-sm mb-6 opacity-70">Family stool logging app</p>
          
          {!showRegister ? (
            <>
              {/* OAuth Sign-In Section */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Sign In</h2>
                <GoogleSignIn
                  onSuccess={handleGoogleSignIn}
                  onError={() => setLoginError('Google Sign-In failed')}
                />
                {process.env.NEXT_PUBLIC_APPLE_CLIENT_ID && process.env.NEXT_PUBLIC_APPLE_CLIENT_ID !== 'your_apple_client_id_here' && (
                  <div className="mt-2">
                    <AppleSignIn
                      onSuccess={handleAppleSignIn}
                      onError={() => setLoginError('Apple Sign-In failed')}
                    />
                  </div>
                )}
              </div>
              
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${tc.border}`}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`${tc.bg.secondary} px-2 opacity-70`}>Or</span>
                </div>
              </div>
              
              {/* Username Sign-In Section (Legacy) */}
              {authMethod === 'legacy' && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">Username Sign-In</h3>
                  <input
                    type="text"
                    placeholder="Username"
                    value={loginName}
                    onChange={e => setLoginName(e.target.value)}
                    className={`w-full mb-2 rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className={`w-full rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                </div>
              )}
              
              {/* Email Sign-In Section (Modern) */}
              {authMethod === 'modern' && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">Email Sign-In</h3>
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className={`w-full mb-2 rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className={`w-full rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                </div>
              )}
              
              {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
              
              {/* Sign In Button */}
              <button
                onClick={login}
                className={`w-full mb-3 rounded-lg ${tc.button.primary} px-3 py-2 font-medium ${tc.button.primaryText}`}
              >
                Sign In
              </button>
              
              {/* Auth Method Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setAuthMethod('legacy'); setLoginEmail(''); setLoginError('') }}
                  className={`flex-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                    authMethod === 'legacy'
                      ? `${tc.button.primary} ${tc.button.primaryText}`
                      : `border ${tc.border} ${tc.button.secondaryHover}`
                  }`}
                >
                  Username
                </button>
                <button
                  onClick={() => { setAuthMethod('modern'); setLoginName(''); setLoginError('') }}
                  className={`flex-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                    authMethod === 'modern'
                      ? `${tc.button.primary} ${tc.button.primaryText}`
                      : `border ${tc.border} ${tc.button.secondaryHover}`
                  }`}
                >
                  Email
                </button>
              </div>
              
              {/* Register Switch */}
              <div className="text-center">
                <p className="text-sm opacity-70">Don&apos;t have an account?</p>
                <button
                  onClick={() => setShowRegister(true)}
                  className={`text-sm font-medium mt-1 px-3 py-2 rounded-lg ${tc.button.primary} ${tc.button.primaryText}`}
                >
                  Create one
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-4">Create Account</h2>
              
              {/* Registration Method Selection */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setAuthMethod('legacy'); setRegisterEmail(''); setRegisterError(''); setShowChildRegister(false) }}
                  className={`flex-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                    authMethod === 'legacy' && !showChildRegister
                      ? `${tc.button.primary} ${tc.button.primaryText}`
                      : `border ${tc.border} ${tc.button.secondaryHover}`
                  }`}
                >
                  Username
                </button>
                <button
                  onClick={() => { setAuthMethod('modern'); setRegisterError(''); setShowChildRegister(false) }}
                  className={`flex-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                    authMethod === 'modern' && !showChildRegister
                      ? `${tc.button.primary} ${tc.button.primaryText}`
                      : `border ${tc.border} ${tc.button.secondaryHover}`
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => { setShowChildRegister(true); setRegisterError('') }}
                  className={`flex-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                    showChildRegister
                      ? `${tc.button.primary} ${tc.button.primaryText}`
                      : `border ${tc.border} ${tc.button.secondaryHover}`
                  }`}
                >
                  Child
                </button>
              </div>
              
              {/* Child Registration with Invite Code */}
              {showChildRegister && (
                <>
                  <input
                    type="text"
                    placeholder="Invite Code"
                    value={childRegisterCode}
                    onChange={e => setChildRegisterCode(e.target.value)}
                    className={`w-full mb-3 rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={childRegisterName}
                    onChange={e => setChildRegisterName(e.target.value)}
                    className={`w-full mb-3 rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={childRegisterPassword}
                    onChange={e => setChildRegisterPassword(e.target.value)}
                    className={`w-full rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                </>
              )}
              
              {/* Username Registration */}
              {authMethod === 'legacy' && !showChildRegister && (
                <>
                  <input
                    type="text"
                    placeholder="Username"
                    value={registerName}
                    onChange={e => setRegisterName(e.target.value)}
                    className={`w-full mb-3 rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={registerPassword}
                    onChange={e => setRegisterPassword(e.target.value)}
                    className={`w-full mb-3 rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                </>
              )}
              
              {/* Email Registration */}
              {authMethod === 'modern' && !showChildRegister && (
                <>
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={registerName}
                    onChange={e => setRegisterName(e.target.value)}
                    className={`w-full mb-3 rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerEmail}
                    onChange={e => setRegisterEmail(e.target.value)}
                    className={`w-full mb-3 rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={registerPassword}
                    onChange={e => setRegisterPassword(e.target.value)}
                    className={`w-full mb-3 rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                  />
                </>
              )}
              
              {registerError && <p className="text-red-500 text-sm mb-3">{registerError}</p>}
              {childRegisterError && <p className="text-red-500 text-sm mb-3">{childRegisterError}</p>}
              
              <button
                onClick={() => {
                  if (showChildRegister) {
                    registerAsChild()
                  } else {
                    register()
                  }
                }}
                className={`w-full mb-3 rounded-lg ${tc.button.primary} px-3 py-2 font-medium ${tc.button.primaryText}`}
              >
                {showChildRegister ? 'Join Family' : 'Create Account'}
              </button>
              <button
                onClick={() => {
                  setShowRegister(false)
                  setRegisterName('')
                  setRegisterEmail('')
                  setRegisterPassword('')
                  setRegisterError('')
                  setChildRegisterCode('')
                  setChildRegisterName('')
                  setChildRegisterPassword('')
                  setChildRegisterError('')
                  setShowChildRegister(false)
                }}
                className={`w-full rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.button.secondaryHover}`}
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen ${tc.bg.primary} ${tc.text.primary}`}>
      <div className="mx-auto flex w-full max-w-7xl gap-6 p-4">
        {/* Sidebar for desktop */}
        <aside className={`hidden md:block w-56 rounded-xl ${tc.bg.secondary} p-4 shadow-sm`}>
          <h2 className="text-lg font-semibold mb-4">Options</h2>
          <div className="mb-6">
            <label className="text-sm font-semibold block mb-2">Theme:</label>
            <CustomSelect
              value={theme}
              onChange={(value) => handleThemeChange(value as Theme)}
              options={[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
                { label: 'Slate', value: 'slate' },
                { label: 'Ocean', value: 'ocean' },
                { label: 'Forest', value: 'forest' },
                { label: 'Sunset', value: 'sunset' }
              ]}
              textColor={tc.text.primary}
              bgColor={tc.bg.tertiary}
              borderColor={tc.border}
            />
          </div>
          <button
            className={`mb-2 block w-full rounded-xl px-3 py-2 text-left ${view === 'logs' ? tc.bg.tertiary : `${tc.button.secondary} ${tc.button.secondaryHover}`}`}
            onClick={() => setView('logs')}
          >
            Show Poo Logs
          </button>
          <button
            className={`mb-2 block w-full rounded-xl px-3 py-2 text-left ${view === 'charts' ? tc.bg.tertiary : `${tc.button.secondary} ${tc.button.secondaryHover}`}`}
            onClick={() => setView('charts')}
          >
            Show Charts
          </button>
          <button
            className={`block w-full rounded-xl px-3 py-2 text-left ${view === 'trends' ? tc.bg.tertiary : `${tc.button.secondary} ${tc.button.secondaryHover}`}`}
            onClick={() => setView('trends')}
          >
            My Trends
          </button>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
            <aside className={`absolute left-0 top-0 h-full w-56 ${tc.bg.secondary} p-4 shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Options</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`${tc.text.secondary} hover:${tc.text.primary}`}
                >
                  ✕
                </button>
              </div>
              <div className="mb-6">
                <label className="text-sm font-semibold block mb-2">Theme:</label>
                <CustomSelect
                  value={theme}
                  onChange={(value) => handleThemeChange(value as Theme)}
                  options={[
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                    { label: 'Slate', value: 'slate' },
                    { label: 'Ocean', value: 'ocean' },
                    { label: 'Forest', value: 'forest' },
                    { label: 'Sunset', value: 'sunset' }
                  ]}
                  textColor={tc.text.primary}
                  bgColor={tc.bg.tertiary}
                  borderColor={tc.border}
                />
              </div>
              <button
                className={`mb-2 block w-full rounded-xl px-3 py-2 text-left ${view === 'logs' ? tc.bg.tertiary : `${tc.button.secondary} ${tc.button.secondaryHover}`}`}
                onClick={() => { setView('logs'); setSidebarOpen(false); }}
              >
                Show Poo Logs
              </button>
              <button
                className={`mb-2 block w-full rounded-xl px-3 py-2 text-left ${view === 'charts' ? tc.bg.tertiary : `${tc.button.secondary} ${tc.button.secondaryHover}`}`}
                onClick={() => { setView('charts'); setSidebarOpen(false); }}
              >
                Show Charts
              </button>
              <button
                className={`block w-full rounded-xl px-3 py-2 text-left ${view === 'trends' ? tc.bg.tertiary : `${tc.button.secondary} ${tc.button.secondaryHover}`}`}
                onClick={() => { setView('trends'); setSidebarOpen(false); }}
              >
                My Trends
              </button>
            </aside>
          </div>
        )}

        <section className="flex-1 space-y-6">
          <div className={`rounded-xl ${tc.bg.secondary} p-6 shadow-sm`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full md:w-auto">
                <button
                  className={`md:hidden ${tc.text.secondary}`}
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h1 className="text-3xl font-bold">Kaki Logger</h1>
                  <p className={`text-sm ${tc.text.secondary}`}>Welcome, {loggedInUser.name}!</p>
                  <p className={`text-sm ${tc.text.secondary}`}>Tap a calendar date to add or update your entry.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end w-full">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3 w-full lg:w-auto">
                  <label className="text-sm font-medium whitespace-nowrap">Member:</label>
                  {(() => {
                    // Filter family members based on user role
                    const accessibleMembers = loggedInUser?.role === 'child' 
                      ? familyMembers.filter(m => m.name === loggedInUser?.name)
                      : familyMembers
                    
                    return (
                      <CustomSelect
                        value={currentMember?.id || ''}
                        onChange={(value) => {
                          const member = accessibleMembers.find(m => m.id === value)
                          setCurrentMember(member || null)
                        }}
                        options={[
                          { label: 'Select Member', value: '' },
                          ...accessibleMembers.map(member => ({ label: member.name, value: member.id }))
                        ]}
                        className="min-w-[10rem]"
                        textColor={tc.text.primary}
                        bgColor={tc.bg.tertiary}
                        borderColor={tc.border}
                      />
                    )
                  })()}
                  {loggedInUser?.role === 'adult' && (
                    <>
                      <input
                        type="text"
                        placeholder="New member name"
                        value={newMemberName}
                        onChange={e => setNewMemberName(e.target.value)}
                        className={`rounded-xl border ${tc.border} px-3 py-2 text-sm min-w-[10rem] ${tc.text.primary} ${tc.bg.tertiary}`}
                      />
                      {(addMemberError || removeMemberError) && (
                        <p className="text-red-500 text-sm">{addMemberError || removeMemberError}</p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 items-center justify-end">
                  {loggedInUser?.role === 'adult' && (
                    <>
                      <button
                        onClick={addMember}
                        className={`rounded-xl ${tc.button.primary} px-3 py-2 ${tc.button.primaryText} text-sm`}
                      >
                        Add
                      </button>
                      <button
                        onClick={removeMember}
                        disabled={familyMembers.length <= 1}
                        className="rounded-xl bg-red-500 px-3 py-2 text-white text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowSettings(true)
                      loadInviteCodes()
                    }}
                    className={`rounded-xl ${tc.button.primary} px-3 py-2 ${tc.button.primaryText} text-sm`}
                  >
                    ⚙️ Settings
                  </button>
                  <button
                    onClick={() => {
                      clearSession()
                      setLoggedInUser(null)
                      setCurrentMember(null)
                      setFamilyMembers([])
                      setLogs([])
                    }}
                    className="rounded-xl bg-red-600 px-3 py-2 text-white text-sm"
                  >
                    Logout
                  </button>
                  <div className={`rounded-full border ${tc.border} ${tc.bg.tertiary} px-4 py-2 text-sm whitespace-nowrap`}>
                    {view === 'calendar' ? 'Showing logs on calendar' : view === 'charts' ? 'Show charts' : 'Trend summary'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className={`rounded-xl ${tc.bg.secondary} p-4 shadow-sm`}>
              <div className="max-w-md mx-auto">
                <Calendar onClickDay={onClickDay} tileContent={tileContent} />
              </div>
            </div>

            <div className="space-y-6">
              {view === 'calendar' && (
                <div className={`rounded-xl ${tc.bg.secondary} p-4 shadow-sm`}>
                  <h2 className="text-xl font-semibold mb-3">Quick summary</h2>
                  <p className={`text-sm ${tc.text.secondary}`}>
                    {totalLogs === 0
                      ? 'No logs yet. Click a date to start tracking.'
                      : `You have ${totalLogs} logged days. Tap any date to edit or clear the log.`}
                  </p>
                </div>
              )}

              {view === 'logs' && (
                <div className={`rounded-xl ${tc.bg.secondary} p-4 shadow-sm`}>
                  <h2 className="text-xl font-semibold mb-3">Poo Logs</h2>
                  {logs.length === 0 ? (
                    <p className={`text-sm ${tc.text.secondary}`}>No logs yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.map(log => (
                        <div key={log.id} className={`flex items-center justify-between rounded-xl border ${tc.border} p-3`}>
                          <div>
                            <div className="font-medium">{log.date}</div>
                            <div className={`text-sm ${tc.text.secondary}`}>
                              {log.type.charAt(0).toUpperCase() + log.type.slice(1)} • {log.quantity} • {log.time} min
                            </div>
                            <div className={`text-xs ${tc.text.secondary}`}>
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'No timestamp'}
                            </div>
                          </div>
                          <div className={`flex items-center justify-center rounded-full ${tc.bg.tertiary} p-2`}>
                            {getImage(log.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {view === 'charts' && (
                <div className={`rounded-xl ${tc.bg.secondary} p-4 shadow-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Show Charts</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={downloadReport}
                        disabled={logs.length === 0}
                        className={`text-sm px-3 py-2 rounded-xl ${
                          logs.length === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : `${tc.button.secondary} ${tc.button.secondaryHover}`
                        }`}
                      >
                        📥 Download Report
                      </button>
                      <button
                        onClick={shareStatistics}
                        disabled={logs.length === 0}
                        className={`text-sm px-3 py-2 rounded-xl ${
                          logs.length === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : `${tc.button.primary} ${tc.button.primaryText}`
                        }`}
                      >
                        📊 Share Stats
                      </button>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Stool Type Distribution</h3>
                    <StoolChart
                      logs={logs}
                      primaryColor={tc.bg.secondary}
                      secondaryColor={getChartGridColor()}
                      textColor={getChartTextColor()}
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Summary</h3>
                    {['soft', 'liquid', 'solid', 'const'].map(typeKey => {
                      const count = typeCounts[typeKey] ?? 0
                      const width = totalLogs ? `${Math.round((count / totalLogs) * 100)}%` : '0%'
                      return (
                        <div key={typeKey}>
                          <div className="flex items-center justify-between text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {getImage(typeKey)}
                            </div>
                            <span>{count}</span>
                          </div>
                          <div className={`h-3 overflow-hidden rounded-full ${tc.bg.tertiary}`}>
                            <div className={`h-3 rounded-full ${theme === 'light' || theme === 'slate' ? 'bg-slate-700' : theme === 'dark' ? 'bg-white' : theme === 'ocean' ? 'bg-blue-600' : theme === 'forest' ? 'bg-green-700' : 'bg-orange-600'}`} style={{ width }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {view === 'trends' && (
                <div className={`rounded-xl ${tc.bg.secondary} p-4 shadow-sm`}>
                  <h2 className="text-xl font-semibold mb-3">My Trends</h2>
                  <div className={`space-y-3 text-sm ${tc.text.primary}`}>
                    <div>Total entries: <span className="font-semibold">{totalLogs}</span></div>
                    <div>Average time: <span className="font-semibold">{averageTime} min</span></div>
                    <div className="flex items-center gap-2">
                      Most common type:
                      <span className="font-semibold inline-flex items-center">
                        {getImage(mostCommonType.toLowerCase())}
                      </span>
                    </div>
                    <div>Most common quantity: <span className="font-semibold">{mostCommonQuantity.charAt(0).toUpperCase() + mostCommonQuantity.slice(1)}</span></div>
                    <div className="pt-2 border-t" style={{ borderColor: tc.border }}>
                      <div className="font-semibold mb-1">Average Weekly Frequency:</div>
                      <div className="text-base font-bold" style={{ color: tc.button.primary }}>
                        {getWeeklyFrequency()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-2xl ${tc.bg.secondary} p-6 shadow-xl`}>
            <h2 className="text-xl font-semibold mb-4">Log for {selectedDate?.toDateString()} - {currentMember?.name}</h2>
            
            {/* Display existing logs for this date */}
            {getLogsForDate(selectedDate).length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-3 text-sm">Existing logs for this day:</h3>
                <div className="space-y-2">
                  {getLogsForDate(selectedDate).map((log) => (
                    <div key={log.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                      <div className="text-sm">
                        <span className="font-medium capitalize">{log.type}</span>
                        <span className="text-gray-600 ml-2">• {log.time} min</span>
                        <span className="text-gray-600 ml-2">• {log.quantity}</span>
                      </div>
                      <button
                        onClick={() => deleteSingleLog(log.id)}
                        className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-lg font-semibold mb-4">Add new log for this day</h3>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Type</label>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { key: 'soft', label: 'Soft stool' },
                  { key: 'liquid', label: 'Liquid stool' },
                  { key: 'solid', label: 'Solid stool' },
                  { key: 'const', label: 'Constipated stool' }
                ].map((stoolType) => (
                  <button
                    key={stoolType.key}
                    onClick={() => setType(stoolType.key)}
                    className={`flex flex-col items-center p-2 rounded-xl border-2 transition-colors flex-1 min-w-[90px] max-w-[110px] ${
                      type === stoolType.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={`/images/${stoolType.key}.png`}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `/images/${stoolType.key}.svg`;
                      }}
                      className="w-12 h-12 object-contain mb-1"
                      alt={stoolType.label}
                    />
                    <span className="text-xs font-medium text-center leading-tight">{stoolType.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Quantity</label>
              <CustomSelect
                value={quantity}
                onChange={(value) => setQuantity(value as 'small' | 'medium' | 'a lot')}
                options={[
                  { label: 'Small', value: 'small' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'A lot', value: 'a lot' }
                ]}
                textColor={tc.text.primary}
                bgColor={tc.bg.tertiary}
                borderColor={tc.border}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Time (minutes)</label>
              <CustomSelect
                value={String(time)}
                onChange={(value) => setTime(Number(value))}
                options={[
                  { label: '5', value: '5' },
                  { label: '10', value: '10' },
                  { label: '20', value: '20' }
                ]}
                textColor={tc.text.primary}
                bgColor={tc.bg.tertiary}
                borderColor={tc.border}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowModal(false)}
                className={`rounded-xl border ${tc.border} px-4 py-2 ${tc.bg.tertiary} ${tc.text.primary}`}
              >
                Close
              </button>
              <button
                onClick={save}
                className={`rounded-xl ${tc.button.primary} px-4 py-2 ${tc.button.primaryText}`}
              >
                Add Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className={`w-full max-w-2xl rounded-xl ${tc.bg.secondary} p-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Settings</h2>
              <button onClick={() => setShowSettings(false)} className={`text-2xl ${tc.text.secondary}`}>✕</button>
            </div>

            {/* Linked Accounts Section - Show for all users */}
            {loggedInUser && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Linked Accounts</h3>
                <div className={`rounded-xl ${tc.bg.tertiary} p-4 space-y-3`}>
                  {loggedInUser.authMethods && loggedInUser.authMethods.length > 0 ? (
                    loggedInUser.authMethods.map(method => (
                      <div key={method.type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{method.type === 'username' ? 'Username/Password' : method.type}</p>
                          {method.identifier && <p className={`text-sm ${tc.text.secondary}`}>{method.identifier}</p>}
                          <p className={`text-xs ${tc.text.secondary}`}>Linked {new Date(method.linkedAt).toLocaleDateString()}</p>
                        </div>
                        {(loggedInUser.authMethods?.length ?? 0) > 1 && (
                          <button
                            onClick={() => unlinkOAuth(method.type as 'google' | 'apple')}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Unlink
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className={`text-sm ${tc.text.secondary}`}>No linked accounts</p>
                  )}
                </div>

                {/* Link New OAuth Account */}
                <div className="mt-4 space-y-3">
                  {!showLinkOAuth && !showLinkAppleOAuth ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLinkOAuth(true)}
                        className={`rounded-xl ${tc.button.primary} px-4 py-2 ${tc.button.primaryText} flex-1`}
                      >
                        + Link Google
                      </button>
                      {process.env.NEXT_PUBLIC_APPLE_CLIENT_ID && process.env.NEXT_PUBLIC_APPLE_CLIENT_ID !== 'your_apple_client_id_here' && (
                        <button
                          onClick={() => setShowLinkAppleOAuth(true)}
                          className={`rounded-xl ${tc.button.primary} px-4 py-2 ${tc.button.primaryText} flex-1`}
                        >
                          + Link Apple
                        </button>
                      )}
                    </div>
                  ) : null}

                  {showLinkOAuth && (
                    <div className={`rounded-xl ${tc.bg.tertiary} p-4`}>
                      <button
                        onClick={() => setShowLinkOAuth(false)}
                        className={`text-sm ${tc.text.secondary} mb-3`}
                      >
                        ✕ Close
                      </button>
                      <LinkOAuthButton
                        userId={loggedInUser.id}
                        onSuccess={(user) => {
                          setLoggedInUser(user)
                          setShowLinkOAuth(false)
                        }}
                        themeConfig={tc}
                      />
                    </div>
                  )}

                  {process.env.NEXT_PUBLIC_APPLE_CLIENT_ID && process.env.NEXT_PUBLIC_APPLE_CLIENT_ID !== 'your_apple_client_id_here' && showLinkAppleOAuth && (
                    <div className={`rounded-xl ${tc.bg.tertiary} p-4`}>
                      <button
                        onClick={() => setShowLinkAppleOAuth(false)}
                        className={`text-sm ${tc.text.secondary} mb-3`}
                      >
                        ✕ Close
                      </button>
                      <LinkAppleButton
                        userId={loggedInUser.id}
                        onSuccess={(user) => {
                          setLoggedInUser(user)
                          setShowLinkAppleOAuth(false)
                        }}
                        themeConfig={tc}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Family Members Management (Adults Only) */}
            {loggedInUser?.role === 'adult' && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Family Members</h3>
                <div className={`rounded-xl ${tc.bg.tertiary} p-4 space-y-3`}>
                  {familyMembers.length > 0 ? (
                    familyMembers.map(member => (
                      <div key={member.id} className={`border rounded-lg p-3 ${tc.bg.secondary}`}>
                        {editingMemberId === member.id ? (
                          // Edit Form
                          <div className="space-y-3">
                            {editMemberError && <p className="text-red-500 text-sm">{editMemberError}</p>}
                            <input
                              type="text"
                              placeholder="Member Name"
                              value={editMemberName}
                              onChange={e => setEditMemberName(e.target.value)}
                              className={`w-full rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                            />
                            <select
                              value={editMemberRole}
                              onChange={e => setEditMemberRole(e.target.value as 'adult' | 'child')}
                              className={`w-full rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                            >
                              <option value="child">Child</option>
                              <option value="adult">Adult</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Relationship (e.g., Son, Daughter)"
                              value={editMemberRelationship}
                              onChange={e => setEditMemberRelationship(e.target.value)}
                              className={`w-full rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                            />
                            <input
                              type="date"
                              value={editMemberDateOfBirth}
                              onChange={e => setEditMemberDateOfBirth(e.target.value)}
                              className={`w-full rounded-lg border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={updateFamilyMember}
                                className={`flex-1 rounded-lg ${tc.button.primary} px-3 py-2 ${tc.button.primaryText} text-sm`}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditingMember}
                                className={`flex-1 rounded-lg ${tc.button.secondary} px-3 py-2 text-sm`}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display Mode
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className={`text-xs ${tc.text.secondary}`}>Role: {member.role || 'child'}</p>
                              {member.relationship && <p className={`text-xs ${tc.text.secondary}`}>Relationship: {member.relationship}</p>}
                              {member.dateOfBirth && <p className={`text-xs ${tc.text.secondary}`}>DOB: {member.dateOfBirth}</p>}
                            </div>
                            <button
                              onClick={() => startEditingMember(member)}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className={`text-sm ${tc.text.secondary}`}>No family members</p>
                  )}
                </div>
              </div>
            )}

            {/* Invite Codes Section (Adults Only) */}
            {loggedInUser?.role === 'adult' && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Invite Codes for Children</h3>
                
                {!showInviteCodeForm ? (
                  <button
                    onClick={() => setShowInviteCodeForm(true)}
                    className={`rounded-xl ${tc.button.primary} px-4 py-2 ${tc.button.primaryText} mb-4`}
                  >
                    + Generate New Code
                  </button>
                ) : (
                  <div className={`rounded-xl ${tc.bg.tertiary} p-4 mb-4`}>
                    {inviteCodeError && <p className="text-red-500 text-sm mb-2">{inviteCodeError}</p>}
                    <button
                      onClick={generateInviteCode}
                      className={`rounded-xl ${tc.button.primary} px-4 py-2 ${tc.button.primaryText} mr-2`}
                    >
                      Generate Code
                    </button>
                    <button
                      onClick={() => setShowInviteCodeForm(false)}
                      className={`rounded-xl ${tc.button.secondary} px-4 py-2`}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className={`rounded-xl ${tc.bg.tertiary} p-4 space-y-2`}>
                  {inviteCodes.length > 0 ? (
                    inviteCodes.map(code => (
                      <div key={code.code} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-mono font-semibold">{code.code}</p>
                          <p className={`text-xs ${tc.text.secondary}`}>
                            Expires: {new Date(code.expiresAt).toLocaleDateString()}
                            {code.usedBy && ` • Used by: ${code.usedBy}`}
                          </p>
                        </div>
                        <button
                          onClick={() => revokeInviteCode(code.code)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Revoke
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className={`text-sm ${tc.text.secondary}`}>No active invite codes</p>
                  )}
                </div>
              </div>
            )}

            {/* Child Registration Section (For non-logged-in users) */}
            {!loggedInUser && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Register as Child</h3>
                <button
                  onClick={() => setShowChildRegister(!showChildRegister)}
                  className={`rounded-xl ${tc.button.primary} px-4 py-2 ${tc.button.primaryText}`}
                >
                  {showChildRegister ? 'Cancel' : 'Join Family with Invite Code'}
                </button>

                {showChildRegister && (
                  <div className={`rounded-xl ${tc.bg.tertiary} p-4 mt-4 space-y-3`}>
                    {childRegisterError && <p className="text-red-500 text-sm">{childRegisterError}</p>}
                    <input
                      type="text"
                      placeholder="Invite Code"
                      value={childRegisterCode}
                      onChange={e => setChildRegisterCode(e.target.value)}
                      className={`w-full rounded-xl border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.secondary}`}
                    />
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={childRegisterName}
                      onChange={e => setChildRegisterName(e.target.value)}
                      className={`w-full rounded-xl border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.secondary}`}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={childRegisterPassword}
                      onChange={e => setChildRegisterPassword(e.target.value)}
                      className={`w-full rounded-xl border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.secondary}`}
                    />
                    <button
                      onClick={registerAsChild}
                      className={`w-full rounded-xl ${tc.button.primary} px-4 py-2 ${tc.button.primaryText}`}
                    >
                      Create Account
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Info message for child users */}
            {loggedInUser?.role === 'child' && (
              <div className={`mb-6 p-4 rounded-xl ${tc.bg.tertiary} border-l-4 border-blue-500`}>
                <p className={`text-sm ${tc.text.secondary}`}>
                  Your account is a child account. The available settings are limited to viewing your linked authentication methods.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowSettings(false)}
              className={`w-full rounded-xl ${tc.button.primary} px-4 py-2 ${tc.button.primaryText}`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  )
}