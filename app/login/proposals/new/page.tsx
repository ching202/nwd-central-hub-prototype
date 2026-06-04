'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import BackButton from '@/components/BackButton'

export default function NewProposal() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!profile?.id) {
      setError('You must be logged in to submit a proposal.')
      setIsSubmitting(false)
      return
    }

    const formData = new FormData(e.currentTarget as HTMLFormElement)

    const { error: insertError } = await supabase
        .from('proposals')
        .insert({
          client_id: profile.id,
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          budget: formData.get('budget') as string,
          status: 'submitted',
        })

    if (insertError) {
      setError(insertError.message)
      setIsSubmitting(false)
      return
    }

    router.push('/login/proposals')
  }

  return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <BackButton />
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Submit Project Idea
            </h2>

            {error && (
                <p className="mb-4 text-sm text-red-600">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Project Title
                </label>
                <input
                    name="title"
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Enter a descriptive title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                    name="description"
                    required
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="What is your project about?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Budget ($)
                </label>
                <input
                    name="budget"
                    type="number"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="5000"
                />
              </div>

              <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </form>
          </div>
        </div>
      </div>
  )
}