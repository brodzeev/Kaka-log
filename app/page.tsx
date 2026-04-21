'use client'

import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import CustomSelect from '../components/CustomSelect'
import StoolChart from '../components/StoolChart'

interface FamilyMember {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  password: string
  familyMembers: FamilyMember[]
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
  const [registerName, setRegisterName] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [quantity, setQuantity] = useState<'small' | 'medium' | 'a lot'>('medium')
  const [newMemberName, setNewMemberName] = useState('')
  const [addMemberError, setAddMemberError] = useState('')
  const [removeMemberError, setRemoveMemberError] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)

  const tc = themes[theme]

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && (Object.keys(themes) as Theme[]).includes(savedTheme)) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
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
    if (!currentMember) return
    const response = await fetch(`/api/logs?memberId=${currentMember.id}`)
    const data = await response.json()
    setLogs(data)
  }

  const onClickDay = (value: Date) => {
    if (!currentMember) return
    const dateString = value.toDateString()
    const existingLog = logs.find(log => log.date === dateString)
    setSelectedDate(value)
    setType(existingLog?.type ?? 'soft')
    setTime(existingLog?.time ?? 5)
    setQuantity(existingLog?.quantity ?? 'medium')
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

  const clearLog = async () => {
    if (!selectedDate || !currentMember) return

    const dateString = selectedDate.toDateString()
    await fetch(`/api/log?date=${encodeURIComponent(dateString)}&memberId=${currentMember.id}`, {
      method: 'DELETE'
    })

    await loadLogs()
    setShowModal(false)
  }

  const login = async () => {
    setLoginError('')
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: loginName, password: loginPassword })
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
      setLoginName('')
      setLoginPassword('')
    } else {
      setLoginError(result.error || 'Login failed')
    }
  }

  const register = async () => {
    setRegisterError('')
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: registerName, password: registerPassword })
    })
    const result = await response.json()
    if (result.success) {
      // After register, login
      setLoginName(registerName)
      setLoginPassword(registerPassword)
      await login()
      setShowRegister(false)
      setRegisterName('')
      setRegisterPassword('')
    } else {
      setRegisterError(result.error || 'Registration failed')
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
    setAddMemberError('')
    const response = await fetch('/api/family-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: loggedInUser.id, name: newMemberName })
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
      <main className={`min-h-screen ${tc.bg.primary} ${tc.text.primary} flex items-center justify-center`}>
        <div className={`w-full max-w-md rounded-xl ${tc.bg.secondary} p-6 shadow-sm`}>
          <h1 className="text-2xl font-bold mb-6 text-center">Kaki Logger</h1>
          {!showRegister ? (
            <>
              <h2 className="text-lg font-semibold mb-4">Login</h2>
              <input
                type="text"
                placeholder="Username"
                value={loginName}
                onChange={e => setLoginName(e.target.value)}
                className={`w-full mb-3 rounded-xl border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className={`w-full mb-3 rounded-xl border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
              />
              {loginError && <p className="text-red-500 text-sm mb-3">{loginError}</p>}
              <button
                onClick={login}
                className={`w-full mb-3 rounded-xl ${tc.button.primary} px-3 py-2 ${tc.button.primaryText}`}
              >
                Login
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className={`w-full rounded-xl ${tc.button.secondary} px-3 py-2 ${tc.text.primary} ${tc.button.secondaryHover}`}
              >
                Register
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-4">Register</h2>
              <input
                type="text"
                placeholder="Username"
                value={registerName}
                onChange={e => setRegisterName(e.target.value)}
                className={`w-full mb-3 rounded-xl border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
              />
              <input
                type="password"
                placeholder="Password"
                value={registerPassword}
                onChange={e => setRegisterPassword(e.target.value)}
                className={`w-full mb-3 rounded-xl border ${tc.border} px-3 py-2 ${tc.text.primary} ${tc.bg.tertiary}`}
              />
              {registerError && <p className="text-red-500 text-sm mb-3">{registerError}</p>}
              <button
                onClick={register}
                className={`w-full mb-3 rounded-xl ${tc.button.primary} px-3 py-2 ${tc.button.primaryText}`}
              >
                Register
              </button>
              <button
                onClick={() => setShowRegister(false)}
                className={`w-full rounded-xl ${tc.button.secondary} px-3 py-2 ${tc.text.primary} ${tc.button.secondaryHover}`}
              >
                Back to Login
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
                  <CustomSelect
                    value={currentMember?.id || ''}
                    onChange={(value) => {
                      const member = familyMembers.find(m => m.id === value)
                      setCurrentMember(member || null)
                    }}
                    options={[
                      { label: 'Select Member', value: '' },
                      ...familyMembers.map(member => ({ label: member.name, value: member.id }))
                    ]}
                    className="min-w-[10rem]"
                    textColor={tc.text.primary}
                    bgColor={tc.bg.tertiary}
                    borderColor={tc.border}
                  />
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
                </div>
                <div className="flex flex-wrap gap-3 items-center justify-end">
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
                  <button
                    onClick={() => {
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl ${tc.bg.secondary} p-6 shadow-xl`}>
            <h2 className="text-xl font-semibold mb-4">Log for {selectedDate?.toDateString()} - {currentMember?.name}</h2>
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
                Cancel
              </button>
              <button
                onClick={clearLog}
                className="rounded-xl border border-red-300 px-4 py-2 bg-red-50 text-red-700"
              >
                Clear Log
              </button>
              <button
                onClick={save}
                className={`rounded-xl ${tc.button.primary} px-4 py-2 ${tc.button.primaryText}`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}