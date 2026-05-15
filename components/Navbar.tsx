'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

export default function Navbar() {
  const { profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole(profile?.role || null)
    }

    fetchRole()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ padding: 20, borderBottom: '1px solid gray' }}>
      {profile?.role === 'admin' && (
        <>
          <span>Admin Panel | </span>

          <button onClick={() => router.push('/login/admin')}>
            Approve Projects
          </button>
        </>
      )}

      {profile?.role === 'contractor' && (
        <>
          <span>Contractor Dashboard | </span>

          <button onClick={() => router.push('/login/contractor')}>
            My Projects
          </button>
        </>
      )}

      {profile?.role === 'client' && (
        <>
          <span>Client Dashboard | </span>
<<<<<<< 37-navbar-back-navigation

=======
>>>>>>> main
          <button onClick={() => router.push('/login/client')}>
            My Projects
          </button>
        </>
      )}

      <button onClick={handleLogout} style={{ marginLeft: 20 }}>
        Logout
      </button>
    </div>
  )
}
