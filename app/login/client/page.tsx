'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from '@/components/Navbar'
import RouteGuard from '@/components/RouteGuard'
import {
  type Proposal,
  getProposalStatusClass,
  getProposalStatusLabel,
  isFinalProposalStatus,
} from "@/lib/proposals";

function ClientContent() {
  const [fullProposals, setFullProposals] = useState<Proposal[]>([]);
  const [submittedProposals, setSubmittedProposals] = useState<Proposal[]>([]);
  const [reviewedProposals, setReviewedProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const data = localStorage.getItem("proposals");
      const proposals: Proposal[] = data ? JSON.parse(data) : [];

      setFullProposals(proposals);
      setSubmittedProposals(
        proposals.filter((proposal) => proposal.status == "awaiting approval"),
      );
      setReviewedProposals(
        proposals.filter((proposal) => isFinalProposalStatus(proposal.status)),
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Client Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create proposals and view ideas that have been approved or
              rejected.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm">
              {reviewedProposals.length} reviewed proposal
              {reviewedProposals.length !== 1 ? "s" : ""}
            </span>
            <Link
              href="/proposals/new"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm font-medium"
            >
              + New Proposal
            </Link>
          </div>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviewedProposals.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No reviewed proposals available.
                  </td>
                </tr>
              ) : (
                reviewedProposals.map((proposal) => (
                  <tr key={proposal.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {proposal.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                      {proposal.description || "No description provided."}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proposal.budget ? `$${proposal.budget}` : "Not set"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getProposalStatusClass(proposal.status)}`}
                      >
                        {getProposalStatusLabel(proposal.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
              {fullProposals.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No proposals submitted.
                  </td>
                </tr>
              ) : (
                submittedProposals.map((proposal) => (
                  <tr key={proposal.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {proposal.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                      {proposal.description || "No description provided."}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proposal.budget ? `$${proposal.budget}` : "Not set"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getProposalStatusClass(proposal.status)}`}
                      >
                        {getProposalStatusLabel(proposal.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default function ClientDashboardPage() {
  return (
    <RouteGuard allowedRoles={["client"]}>
      <ClientContent />
    </RouteGuard>
  );
}
