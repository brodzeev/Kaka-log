'use client'

import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

interface FamilyMember {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  password: string
  familyMembers: FamilyMember[]
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

export default function Home() {
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
  const [showAddMember, setShowAddMember] = useState(false)

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

  const getImage = (type: string) => {
    const pngPath = `/images/${type}.png`
    const svgPath = `/images/${type}.svg`
    return <img src={pngPath} onError={e => { (e.currentTarget as HTMLImageElement).src = svgPath }} className="w-12 h-12 object-contain" alt={type} />
  }

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const log = logs.find(log => log.date === date.toDateString())
      if (log) {
        return <div className="text-xs">{getImage(log.type)}</div>
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
      <main className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">Kaki Logger</h1>
          {!showRegister ? (
            <>
              <h2 className="text-lg font-semibold mb-4">Login</h2>
              <input
                type="text"
                placeholder="Username"
                value={loginName}
                onChange={e => setLoginName(e.target.value)}
                className="w-full mb-3 rounded-xl border border-slate-300 px-3 py-2"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full mb-3 rounded-xl border border-slate-300 px-3 py-2"
              />
              {loginError && <p className="text-red-500 text-sm mb-3">{loginError}</p>}
              <button
                onClick={login}
                className="w-full mb-3 rounded-xl bg-slate-900 px-3 py-2 text-white"
              >
                Login
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100"
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
                className="w-full mb-3 rounded-xl border border-slate-300 px-3 py-2"
              />
              <input
                type="password"
                placeholder="Password"
                value={registerPassword}
                onChange={e => setRegisterPassword(e.target.value)}
                className="w-full mb-3 rounded-xl border border-slate-300 px-3 py-2"
              />
              {registerError && <p className="text-red-500 text-sm mb-3">{registerError}</p>}
              <button
                onClick={register}
                className="w-full mb-3 rounded-xl bg-slate-900 px-3 py-2 text-white"
              >
                Register
              </button>
              <button
                onClick={() => setShowRegister(false)}
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100"
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
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl gap-6 p-4">
        {/* Sidebar for desktop */}
        <aside className="hidden md:block w-56 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Options</h2>
          <button
            className={`mb-2 block w-full rounded-xl px-3 py-2 text-left ${view === 'logs' ? 'bg-slate-200' : 'bg-slate-50 hover:bg-slate-100'}`}
            onClick={() => setView('logs')}
          >
            Show Poo Logs
          </button>
          <button
            className={`mb-2 block w-full rounded-xl px-3 py-2 text-left ${view === 'charts' ? 'bg-slate-200' : 'bg-slate-50 hover:bg-slate-100'}`}
            onClick={() => setView('charts')}
          >
            Show Charts
          </button>
          <button
            className={`block w-full rounded-xl px-3 py-2 text-left ${view === 'trends' ? 'bg-slate-200' : 'bg-slate-50 hover:bg-slate-100'}`}
            onClick={() => setView('trends')}
          >
            My Trends
          </button>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-56 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Options</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
              <button
                className={`mb-2 block w-full rounded-xl px-3 py-2 text-left ${view === 'logs' ? 'bg-slate-200' : 'bg-slate-50 hover:bg-slate-100'}`}
                onClick={() => { setView('logs'); setSidebarOpen(false); }}
              >
                Show Poo Logs
              </button>
              <button
                className={`mb-2 block w-full rounded-xl px-3 py-2 text-left ${view === 'charts' ? 'bg-slate-200' : 'bg-slate-50 hover:bg-slate-100'}`}
                onClick={() => { setView('charts'); setSidebarOpen(false); }}
              >
                Show Charts
              </button>
              <button
                className={`block w-full rounded-xl px-3 py-2 text-left ${view === 'trends' ? 'bg-slate-200' : 'bg-slate-50 hover:bg-slate-100'}`}
                onClick={() => { setView('trends'); setSidebarOpen(false); }}
              >
                My Trends
              </button>
            </aside>
          </div>
        )}

        <section className="flex-1 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full md:w-auto">
                <button
                  className="md:hidden text-slate-700 hover:text-slate-900"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h1 className="text-3xl font-bold">Kaki Logger</h1>
                  <p className="text-sm text-slate-600">Welcome, {loggedInUser.name}!</p>
                  <p className="text-sm text-slate-600">Tap a calendar date to add or update your entry.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end w-full">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3 w-full lg:w-auto">
                  <label className="text-sm font-medium whitespace-nowrap">Member:</label>
                  <select
                    value={currentMember?.id || ''}
                    onChange={e => {
                      const member = familyMembers.find(m => m.id === e.target.value)
                      setCurrentMember(member || null)
                    }}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-w-[10rem]"
                  >
                    <option value="">Select Member</option>
                    {familyMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="New member name"
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-w-[10rem]"
                  />
                </div>
                <div className="flex flex-wrap gap-3 items-center justify-end">
                  <button
                    onClick={addMember}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-white text-sm"
                  >
                    Add
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
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 whitespace-nowrap">
                    {view === 'calendar' ? 'Showing logs on calendar' : view === 'charts' ? 'Show charts' : 'Trend summary'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <Calendar onClickDay={onClickDay} tileContent={tileContent} />
            </div>

            <div className="space-y-6">
              {view === 'calendar' && (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <h2 className="text-xl font-semibold mb-3">Quick summary</h2>
                  <p className="text-sm text-slate-600">
                    {totalLogs === 0
                      ? 'No logs yet. Click a date to start tracking.'
                      : `You have ${totalLogs} logged days. Tap any date to edit or clear the log.`}
                  </p>
                </div>
              )}

              {view === 'logs' && (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <h2 className="text-xl font-semibold mb-3">Poo Logs</h2>
                  {logs.length === 0 ? (
                    <p className="text-sm text-slate-600">No logs yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.map(log => (
                        <div key={log.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                          <div>
                            <div className="font-medium">{log.date}</div>
                            <div className="text-sm text-slate-600">
                              {log.type.charAt(0).toUpperCase() + log.type.slice(1)} • {log.quantity} • {log.time} min
                            </div>
                            <div className="text-xs text-slate-500">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'No timestamp'}
                            </div>
                          </div>
                          <div className="flex items-center justify-center rounded-full bg-slate-100 p-2">
                            {getImage(log.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {view === 'charts' && (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <h2 className="text-xl font-semibold mb-3">Show Charts</h2>
                  <div className="space-y-4">
                    {['soft', 'liquid', 'solid'].map(typeKey => {
                      const count = typeCounts[typeKey] ?? 0
                      const width = totalLogs ? `${Math.round((count / totalLogs) * 100)}%` : '0%'
                      return (
                        <div key={typeKey}>
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span>{typeKey.charAt(0).toUpperCase() + typeKey.slice(1)}</span>
                            <span>{count}</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-3 rounded-full bg-slate-700" style={{ width }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {view === 'trends' && (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <h2 className="text-xl font-semibold mb-3">My Trends</h2>
                  <div className="space-y-3 text-sm text-slate-700">
                    <div>Total entries: <span className="font-semibold">{totalLogs}</span></div>
                    <div>Average time: <span className="font-semibold">{averageTime} min</span></div>
                    <div>Most common type: <span className="font-semibold">{mostCommonType.charAt(0).toUpperCase() + mostCommonType.slice(1)}</span></div>
                    <div>Most common quantity: <span className="font-semibold">{mostCommonQuantity.charAt(0).toUpperCase() + mostCommonQuantity.slice(1)}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Log for {selectedDate?.toDateString()} - {currentMember?.name}</h2>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Type</label>
              <div className="flex justify-around gap-4">
                {[
                  { key: 'soft', label: 'Soft stool' },
                  { key: 'liquid', label: 'Liquid stool' },
                  { key: 'solid', label: 'Solid stool' }
                ].map((stoolType) => (
                  <button
                    key={stoolType.key}
                    onClick={() => setType(stoolType.key)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-colors ${
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
                      className="w-16 h-16 object-contain mb-2"
                      alt={stoolType.label}
                    />
                    <span className="text-sm font-medium text-center">{stoolType.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Quantity</label>
              <select
                value={quantity}
                onChange={e => setQuantity(e.target.value as 'small' | 'medium' | 'a lot')}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="a lot">A lot</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Time (minutes)</label>
              <select
                value={time}
                onChange={e => setTime(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 bg-slate-100 text-slate-700"
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
                className="rounded-xl bg-slate-900 px-4 py-2 text-white"
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