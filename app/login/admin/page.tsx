'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import RouteGuard from '@/components/RouteGuard'

export default function AdminDashboardPage() {
  return (
    <RouteGuard allowedRoles={['admin']}>
      <Navbar />
      <div style={{ padding: '24px' }}>
        <Link href="/login/admin/users/create">
          <button>Create User</button>
        </Link>
      </div>
    </RouteGuard>
  )
}
