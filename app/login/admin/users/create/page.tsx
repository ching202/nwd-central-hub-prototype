'use client'

import { useState } from 'react'
import RouteGuard from '@/components/RouteGuard'
import { createUser } from './actions'
import type { UserRole } from '@/types/auth'

function CreateUserForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('client')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setTemporaryPassword(null)

    const result = await createUser(email, role, name)

    if (result.success) {
      setTemporaryPassword(result.temporaryPassword)
      setEmail('')
      setName('')
      setRole('client')
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 16px' }}>
      <h1>Create User</h1>

      {temporaryPassword && (
        <div
          style={{
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>User created successfully!</p>
          <p style={{ margin: '0 0 4px' }}>Share this temporary password with the new user:</p>
          <code
            style={{
              display: 'block',
              background: '#fff',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              padding: '8px',
              fontFamily: 'monospace',
              fontSize: '1.1em',
              letterSpacing: '0.05em',
            }}
          >
            {temporaryPassword}
          </code>
          <p style={{ margin: '8px 0 0', fontSize: '0.875em', color: '#555' }}>
            The user will be required to change this password on first login.
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px',
            color: '#721c24',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Full name"
            style={{ padding: '8px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@example.com"
            style={{ padding: '8px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            style={{ padding: '8px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="client">Client</option>
            <option value="contractor">Contractor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            fontSize: '1rem',
            background: loading ? '#6c757d' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </div>
  )
}

export default function CreateUserPage() {
  return (
    <RouteGuard allowedRoles={['admin']}>
      <CreateUserForm />
    </RouteGuard>
  )
}
