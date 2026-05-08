'use client'

import Navbar from '../../components/Navbar'
import RouteGuard from '../../components/RouteGuard'

export default function ClientDashboardPage() {
  return (
    <RouteGuard allowedRoles={['client']}>
      <Navbar />
    </RouteGuard>
  )
}
