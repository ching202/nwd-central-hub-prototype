'use client'

import { useEffect, useState } from 'react'
import BackButton from '@/components/BackButton'
import RouteGuard from '@/components/RouteGuard'
import {
  PROPOSAL_STATUSES,
  type Proposal,
  canAdminReviewProposal,
  getProposalStatusClass,
  getProposalStatusLabel,
} from '@/lib/proposals'

function AdminContent() {
  const [proposals, setProposals] = useState<Proposal[]>([])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const data = localStorage.getItem('proposals')
      setProposals(data ? JSON.parse(data) : [])
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  function updateProposalStatus(
    proposalId: string,
    status: Proposal['status']
  ) {
    const updatedProposals = proposals.map((proposal) =>
      proposal.id === proposalId ? { ...proposal, status } : proposal
    )

    localStorage.setItem('proposals', JSON.stringify(updatedProposals))
    setProposals(updatedProposals)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <BackButton />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review submitted ideas and update their proposal status.
            </p>
          </div>

          <span className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm">
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proposals.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No proposals awaiting review.
                  </td>
                </tr>
              ) : (
                proposals.map((proposal) => {
                  const isReviewable = canAdminReviewProposal(proposal)

                  return (
                    <tr key={proposal.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {proposal.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                        {proposal.description || 'No description provided.'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {proposal.budget ? `$${proposal.budget}` : 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getProposalStatusClass(proposal.status)}`}
                        >
                          {getProposalStatusLabel(proposal.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={!isReviewable}
                            onClick={() =>
                              updateProposalStatus(
                                proposal.id,
                                PROPOSAL_STATUSES.Approved
                              )
                            }
                            className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={!isReviewable}
                            onClick={() =>
                              updateProposalStatus(
                                proposal.id,
                                PROPOSAL_STATUSES.Rejected
                              )
                            }
                            className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <RouteGuard allowedRoles={['admin']}>
      <AdminContent />
    </RouteGuard>
  )
}
