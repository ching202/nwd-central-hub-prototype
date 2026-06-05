'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BackButton from '@/components/BackButton'
import RouteGuard from '@/components/RouteGuard'
import {
    type Proposal,
    getProposalStatusClass,
    getProposalStatusLabel,
    canAdminReviewProposal,
} from '@/lib/proposals'
import { approveProposal, rejectProposal } from './actions'

type ProposalWithClient = Proposal & {
    client_name: string | null
    client_email: string | null
}

// Supabase types a foreign-table join as an array even on a many-to-one
// relationship, so `profiles` may come back as an array or a single object.
// shapeProposals normalizes that and is shared by the initial effect loader
// and the post-action refetch so the mapping logic lives in one place.
type ProposalJoinRow = {
    id: string
    title: string
    description: string | null
    budget: string | null
    status: ProposalWithClient['status']
    created_at: string | null
    profiles:
        | { name: string | null; email: string | null }[]
        | { name: string | null; email: string | null }
        | null
}

const PROPOSAL_SELECT = `
  id,
  title,
  description,
  budget,
  status,
  created_at,
  profiles!client_id (
    name,
    email
  )
`

function shapeProposals(rows: ProposalJoinRow[]): ProposalWithClient[] {
    return rows.map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return {
            id: row.id,
            title: row.title,
            description: row.description ?? undefined,
            budget: row.budget ?? undefined,
            status: row.status,
            createdAt: row.created_at ?? undefined,
            client_name: profile?.name ?? null,
            client_email: profile?.email ?? null,
        }
    })
}

function ProposalReviewContent() {
    const [proposals, setProposals] = useState<ProposalWithClient[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [processing, setProcessing] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    // Shared refetch used by the approve/reject handlers after a mutation.
    async function fetchProposals() {
        const { data, error } = await supabase
            .from('proposals')
            .select(PROPOSAL_SELECT)
            .eq('status', 'submitted')
            .order('created_at', { ascending: true })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        setProposals(shapeProposals((data ?? []) as ProposalJoinRow[]))
        setLoading(false)
    }

    // Initial load owns its own lifecycle. The `active` flag prevents a state
    // update if the component unmounts before the fetch resolves, which is what
    // keeps the react-hooks/set-state-in-effect rule satisfied without a disable.
    useEffect(() => {
        let active = true

        async function load() {
            const { data, error } = await supabase
                .from('proposals')
                .select(PROPOSAL_SELECT)
                .eq('status', 'submitted')
                .order('created_at', { ascending: true })

            if (!active) return

            if (error) {
                setError(error.message)
                setLoading(false)
                return
            }

            setProposals(shapeProposals((data ?? []) as ProposalJoinRow[]))
            setLoading(false)
        }

        void load()

        return () => {
            active = false
        }
    }, [])

    async function handleApprove(proposalId: string) {
        setProcessing(proposalId)
        const result = await approveProposal(proposalId)

        if (result.error) {
            setError(result.error)
        } else {
            setToast('Project created successfully.')
            await fetchProposals()
        }

        setProcessing(null)
    }

    async function handleReject(proposalId: string) {
        setProcessing(proposalId)
        const result = await rejectProposal(proposalId)

        if (result.error) {
            setError(result.error)
        } else {
            await fetchProposals()
        }

        setProcessing(null)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto p-6">
                <BackButton />

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Proposal Review
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Review submitted proposals and approve or reject them.
                        </p>
                    </div>

                    <span className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm">
            {proposals.length} pending
          </span>
                </div>

                {toast && (
                    <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm flex justify-between items-center">
                        {toast}
                        <button
                            onClick={() => setToast(null)}
                            className="ml-4 text-green-600 hover:text-green-800 font-medium"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Client
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
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : proposals.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                    No proposals awaiting review.
                                </td>
                            </tr>
                        ) : (
                            proposals.map((proposal) => {
                                const isReviewable = canAdminReviewProposal(proposal)
                                const isProcessing = processing === proposal.id

                                return (
                                    <tr key={proposal.id}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            <div>{proposal.title}</div>
                                            {proposal.description && (
                                                <div className="text-gray-500 font-normal mt-1 max-w-xs truncate">
                                                    {proposal.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div>{proposal.client_name ?? 'Unknown'}</div>
                                            <div className="text-xs text-gray-400">
                                                {proposal.client_email}
                                            </div>
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
                                                    disabled={!isReviewable || isProcessing}
                                                    onClick={() => handleApprove(proposal.id)}
                                                    className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {isProcessing ? 'Processing...' : 'Approve'}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!isReviewable || isProcessing}
                                                    onClick={() => handleReject(proposal.id)}
                                                    className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {isProcessing ? 'Processing...' : 'Reject'}
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

export default function ProposalReviewPage() {
    return (
        <RouteGuard allowedRoles={['admin']}>
            <ProposalReviewContent />
        </RouteGuard>
    )
}