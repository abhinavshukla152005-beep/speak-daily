import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Practice from './pages/Practice'

const DEMO_KEY = 'speakdaily-demo'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demo, setDemo] = useState(() => sessionStorage.getItem(DEMO_KEY) === '1')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  function enterDemo() {
    sessionStorage.setItem(DEMO_KEY, '1')
    setDemo(true)
  }

  function exitDemo() {
    sessionStorage.removeItem(DEMO_KEY)
    setDemo(false)
  }

  if (loading) return <div className="center">Loading…</div>
  if (user) return <Practice user={user} onSignOut={() => supabase.auth.signOut()} />
  if (demo) return <Practice demo onExitDemo={exitDemo} />
  return <Auth onDemo={enterDemo} />
}
