'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import BackButton from '@/components/BackButton'
import {
  type Proposal,
  getProposalStatusClass,
  getProposalStatusLabel,
} from '@/lib/proposals'

export default function SubmissionsList() {
  const { profile } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return

    async function fetchProposals() {
      const { data, error } = await supabase
          .from('proposals')
          .select('id, title, description, budget, status, created_at')
          .eq('client_id', profile!.id)
          .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setProposals((data as Proposal[]) || [])
      }

      setLoading(false)
    }

    fetchProposals()
  }, [profile?.id])

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <BackButton />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">My Submissions</h1>
            <Link
                href="/login/proposals/new"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              + New Proposal
            </Link>
          </div>

          {error && (
              <p className="mb-4 text-sm text-red-600">{error}</p>
          )}

          <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
              ) : proposals.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                      No proposals found.
                    </td>
                  </tr>
              ) : (
                  proposals.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.budget ? `$${item.budget}` : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                      <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getProposalStatusClass(item.status)}`}
                      >
                        {getProposalStatusLabel(item.status)}
                      </span>
                        </td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  )
}