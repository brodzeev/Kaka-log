import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 font-sans">
      {/* Header / Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌿</span>
            <div>
              <span className="text-xl font-bold text-slate-800">KaKa</span>
              <span className="text-xl font-bold text-emerald-600">-Log</span>
            </div>
          </div>
          <Link
            href="/app"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md hover:shadow-lg text-sm"
          >
            Use KaKa-Log →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
          <span>🌱</span>
          <span>Free family health tracker — no subscriptions</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
          Track Your Family&apos;s
          <br />
          <span className="text-emerald-600">Digestive Health</span>
          <br />
          Together
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          KaKa-Log helps families monitor digestive wellness using the clinically-recognized Bristol Stool Chart.
          Log entries for every family member, spot patterns, and share data with your healthcare provider.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/app"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl text-lg"
          >
            Get Started Free →
          </Link>
          <a
            href="#how-it-works"
            className="border-2 border-slate-200 hover:border-emerald-400 text-slate-600 hover:text-emerald-700 font-semibold px-8 py-4 rounded-2xl transition-all text-lg"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* Screenshot Hero */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="ml-3 text-xs text-slate-400 font-mono">kakilogger.app</span>
          </div>
          <div className="p-10 flex flex-col items-center gap-6 bg-gradient-to-b from-white to-slate-50">
            <div className="text-center">
              <div className="text-4xl mb-2">🌿</div>
              <h2 className="text-2xl font-bold text-slate-800">Kaki Logger</h2>
              <p className="text-slate-400 text-sm mt-1">Family stool logging app</p>
            </div>
            <div className="w-full max-w-xs space-y-3">
              <div className="bg-slate-100 rounded-xl px-4 py-3 text-slate-400 text-sm">Username</div>
              <div className="bg-slate-100 rounded-xl px-4 py-3 text-slate-400 text-sm">Password</div>
              <div className="bg-emerald-600 rounded-xl px-4 py-3 text-white text-sm font-semibold text-center">Sign In</div>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <div className="flex-1 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-slate-600">
                <span className="font-bold text-blue-500">G</span> Continue with Google
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-400 text-sm mt-4">Simple, secure sign-in — no email verification required</p>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything Your Family Needs</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">Built for parents, caregivers, and health-conscious families.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '📊', title: 'Bristol Stool Chart', desc: 'Log entries using the internationally-recognized 7-type Bristol Stool Chart for accurate health tracking.', color: 'bg-blue-50 border-blue-100' },
            { icon: '👨‍👩‍👧', title: 'Family Profiles', desc: 'Create profiles for every family member — adults and children. Each person gets their own private log.', color: 'bg-emerald-50 border-emerald-100' },
            { icon: '📅', title: 'Calendar View', desc: 'Browse your log history on a calendar. Color-coded entries make it easy to see patterns at a glance.', color: 'bg-violet-50 border-violet-100' },
            { icon: '🔐', title: 'Secure & Private', desc: 'Your data stays yours. Secure JWT authentication, family-level access control, and role-based permissions.', color: 'bg-orange-50 border-orange-100' },
            { icon: '🌙', title: 'Light & Dark Themes', desc: 'Switch between light, dark, and soft themes. Comfortable viewing any time of day.', color: 'bg-slate-50 border-slate-200' },
            { icon: '🔗', title: 'Google Sign-In', desc: 'Sign in with Google for fast, password-free access. Link your social accounts to an existing profile.', color: 'bg-red-50 border-red-100' },
          ].map((f) => (
            <div key={f.title} className={`${f.color} border rounded-2xl p-6 hover:shadow-md transition-shadow`}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-20 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500 text-lg">Up and running in under a minute.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', icon: '👤', title: 'Create Account', desc: 'Sign up with a username or Google account. No email required.' },
              { step: '2', icon: '👨‍👩‍👧', title: 'Add Family', desc: 'Add family members with roles (adult/child), relationship, and date of birth.' },
              { step: '3', icon: '✏️', title: 'Log Entries', desc: 'Select a family member, pick a Bristol type, add optional notes, and save.' },
              { step: '4', icon: '📈', title: 'Track Patterns', desc: 'Review logs on the calendar or table. Share details with your doctor if needed.' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl mb-4 shadow-lg">
                  {s.step}
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Screenshots */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">A Clean, Familiar Interface</h2>
          <p className="text-slate-500 text-lg">Designed for ease of use — no training needed.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-emerald-600 px-4 py-3">
              <div className="text-white font-semibold text-sm">Dashboard</div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg">👤</div>
                <div>
                  <div className="font-semibold text-slate-700 text-sm">John (Adult)</div>
                  <div className="text-xs text-slate-400">Last log: Today</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">🧒</div>
                <div>
                  <div className="font-semibold text-slate-700 text-sm">Emma (Child)</div>
                  <div className="text-xs text-slate-400">Last log: Yesterday</div>
                </div>
              </div>
              <div className="bg-emerald-600 text-white text-xs font-semibold text-center py-2 rounded-xl">+ Log New Entry</div>
            </div>
            <p className="text-xs text-slate-400 text-center pb-3">Family member selection</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-blue-600 px-4 py-3">
              <div className="text-white font-semibold text-sm">New Log Entry</div>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Bristol Stool Type</div>
              <div className="grid grid-cols-4 gap-1">
                {[1,2,3,4,5,6,7].map(n => (
                  <div key={n} className={`rounded-lg p-2 text-center text-xs font-bold ${n === 4 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{n}</div>
                ))}
              </div>
              <div className="bg-slate-100 rounded-xl px-3 py-2 text-slate-400 text-xs">Add notes (optional)...</div>
              <div className="bg-blue-600 text-white text-xs font-semibold text-center py-2 rounded-xl">Save Log</div>
            </div>
            <p className="text-xs text-slate-400 text-center pb-3">Bristol Stool Chart selector</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-violet-600 px-4 py-3">
              <div className="text-white font-semibold text-sm">Log History</div>
            </div>
            <div className="p-4">
              <div className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">June 2026</div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                {['M','T','W','T','F','S','S'].map((d,i) => (
                  <div key={i} className="text-slate-400 font-medium py-1">{d}</div>
                ))}
                {Array.from({length: 30}, (_, i) => i + 1).map(d => (
                  <div key={d} className={`rounded-md py-1 text-xs ${[2,5,7,11,14,18,21,24,27].includes(d) ? 'bg-emerald-500 text-white font-bold' : 'text-slate-600'}`}>{d}</div>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center pb-3">Calendar log history view</p>
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="bg-emerald-50 border-y border-emerald-100 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">Who Is KaKa-Log For?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '👶', title: 'Parents of Young Children', desc: "Track your child's digestive patterns and share data at pediatric check-ups." },
              { icon: '🧓', title: 'Elderly Care', desc: 'Monitor bowel health for elderly family members as part of a daily care routine.' },
              { icon: '🏥', title: 'Health-Conscious Families', desc: 'Maintain a consistent family health diary for routine check-ups and wellness monitoring.' },
            ].map(u => (
              <div key={u.title} className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
                <div className="text-4xl mb-4">{u.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{u.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="text-5xl mb-6">🌿</div>
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Ready to start tracking?</h2>
        <p className="text-slate-500 text-lg mb-10">Free to use. No setup required. Works on any device.</p>
        <Link
          href="/app"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 py-5 rounded-2xl transition-all shadow-xl hover:shadow-2xl text-xl"
        >
          Open KaKa-Log →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <span>🌿</span>
            <span className="font-semibold">KaKa-Log</span>
            <span className="text-slate-400 text-sm">— Family Digestive Health Tracker</span>
          </div>
          <div className="text-slate-400 text-sm">Built with care for families everywhere</div>
        </div>
      </footer>
    </div>
  )
}
