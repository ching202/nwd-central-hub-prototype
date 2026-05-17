'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import RouteGuard from '@/components/RouteGuard'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
  PROPOSAL_STATUSES,
  type Proposal,
  canContractorViewProposal,
  getProposalStatusLabel,
} from '@/lib/proposals'

type Project = {
  id: string
  proposalId?: string
  title: string
  description: string
}

function ContractorContent() {
  const { profile } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [approvedProposals, setApprovedProposals] = useState<Proposal[]>([])
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects_table')
        .select('id, title, description')
        .eq('status', 'Active')
        .eq('contractor_id', profile.id)

      const storedProjects: Project[] = JSON.parse(
        localStorage.getItem('activeProjects') || '[]'
      )

      if (!error) setProjects([...(data || []), ...storedProjects])
      setLoading(false)
    }

    fetchProjects()
  }, [profile])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const data = localStorage.getItem('proposals')
      const proposals: Proposal[] = data ? JSON.parse(data) : []
      const storedProjects: Project[] = JSON.parse(
        localStorage.getItem('activeProjects') || '[]'
      )
      const activeProposalIds = new Set(
        storedProjects
          .map((project) => project.proposalId)
          .filter(Boolean)
      )

      setApprovedProposals(
        proposals
          .filter(canContractorViewProposal)
          .filter((proposal) => !activeProposalIds.has(proposal.id))
      )
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  function moveProposalToActiveProjects(proposal: Proposal) {
    if (proposal.status !== PROPOSAL_STATUSES.Approved) return

    const newProject: Project = {
      id: crypto.randomUUID(),
      proposalId: proposal.id,
      title: proposal.title,
      description: proposal.description || 'No description provided.',
    }

    const storedProjects: Project[] = JSON.parse(
      localStorage.getItem('activeProjects') || '[]'
    )
    const nextStoredProjects = [...storedProjects, newProject]
    const nextProjects = [...projects, newProject]

    localStorage.setItem('activeProjects', JSON.stringify(nextStoredProjects))
    setProjects(nextProjects)
    setApprovedProposals((currentProposals) =>
      currentProposals.filter((item) => item.id !== proposal.id)
    )
    setSelectedProposal(null)
  }

  return (
    <div className="min-h-screen bg-stone-800">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-14">
        <div className="flex items-end justify-between mb-2">
          <h1 className="text-4xl font-black text-stone-50 tracking-tight leading-none">
            Active Projects
          </h1>

          {!loading && (
            <span className="mb-1 bg-stone-900 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="h-0.5 bg-gradient-to-r from-stone-50 to-transparent rounded-full mt-4 mb-10" />

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-9 h-9 rounded-full border-[3px] border-stone-200 border-t-stone-900 animate-spin" />
            <p className="text-sm text-stone-400">Fetching your projects…</p>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-5xl">📋</span>
            <p className="text-lg font-bold text-stone-800 mt-2">No active projects</p>
            <p className="text-sm text-stone-400 max-w-xs leading-relaxed">
              You have no active projects assigned right now. Check back later.
            </p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col"
              >
                <div className="h-1.5 bg-gradient-to-r from-stone-800 to-stone-500" />
                <div className="p-6 flex flex-col gap-3 flex-1">
                  <span className="self-start text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5">
                    ● Active
                  </span>
                  <h2 className="text-lg font-bold text-stone-900 leading-snug tracking-tight">
                    {project.title}
                  </h2>
                  <p className="text-sm text-stone-500 leading-relaxed flex-1">
                    {project.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="mt-16">
          <div className="flex items-end justify-between mb-2">
            <h2 className="text-3xl font-black text-stone-50 tracking-tight leading-none">
              Approved Proposals
            </h2>

            <span className="mb-1 bg-stone-900 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
              {approvedProposals.length} proposal
              {approvedProposals.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-0.5 bg-gradient-to-r from-stone-50 to-transparent rounded-full mt-4 mb-10" />

          {approvedProposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <span className="text-5xl">📋</span>
              <p className="text-lg font-bold text-stone-50 mt-2">
                No approved proposals
              </p>
              <p className="text-sm text-stone-400 max-w-xs leading-relaxed">
                Approved proposals will appear here once admin review is
                complete.
              </p>
            </div>
          ) : (
            <div className="-mx-6 overflow-x-auto px-6 pb-4">
              <div className="flex gap-6 min-w-max">
                {approvedProposals.map((proposal) => (
                  <button
                    type="button"
                    key={proposal.id}
                    onClick={() => setSelectedProposal(proposal)}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col w-72 flex-shrink-0 text-left"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-emerald-800 to-emerald-500" />
                    <div className="p-6 flex flex-col gap-3 flex-1">
                      <span className="self-start text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5">
                        ● {getProposalStatusLabel(proposal.status)}
                      </span>
                      <h3 className="text-lg font-bold text-stone-900 leading-snug tracking-tight">
                        {proposal.title}
                      </h3>
                      <p className="text-sm text-stone-500 leading-relaxed flex-1">
                        {proposal.description || 'No description provided.'}
                      </p>
                      <p className="text-sm font-semibold text-stone-700">
                        {proposal.budget ? `$${proposal.budget}` : 'Budget not set'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {selectedProposal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="proposal-preview-title"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-emerald-800 to-emerald-500" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5 mb-3">
                    ● {getProposalStatusLabel(selectedProposal.status)}
                  </span>
                  <h2
                    id="proposal-preview-title"
                    className="text-2xl font-black text-stone-900 tracking-tight"
                  >
                    {selectedProposal.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProposal(null)}
                  className="text-stone-400 hover:text-stone-700 transition text-2xl leading-none"
                  aria-label="Close proposal preview"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                    Description
                  </p>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {selectedProposal.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                    Budget
                  </p>
                  <p className="text-sm font-semibold text-stone-800">
                    {selectedProposal.budget
                      ? `$${selectedProposal.budget}`
                      : 'Budget not set'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setSelectedProposal(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => moveProposalToActiveProjects(selectedProposal)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 transition"
                >
                  Move to Active Projects
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ContractorDashboardPage() {
  return (
    <RouteGuard allowedRoles={['contractor']}>
      <ContractorContent />
    </RouteGuard>
  )
}
