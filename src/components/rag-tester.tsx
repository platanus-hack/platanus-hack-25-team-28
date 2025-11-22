"use client"

import { api } from "@/convex/_generated/api"
import { useAction, useQuery } from "convex/react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Id } from "@/convex/_generated/dataModel"

export function RAGTester() {
  const [prompt, setPrompt] = useState("")
  const [jobId, setJobId] = useState<Id<"recommendation_jobs"> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createJob = useAction(api.myFunctions.createRecommendationJob)
  const job = useQuery(
    api.myFunctions.getRecommendationJob,
    jobId ? { jobId } : "skip"
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsSubmitting(true)
    try {
      const result = await createJob({
        userPrompt: prompt,
        budget: undefined,
        limit: 5,
        storeId: undefined,
      })
      setJobId(result.jobId as Id<"recommendation_jobs">)
    } catch (error) {
      console.error("Failed to create job:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetTest = () => {
    setJobId(null)
    setPrompt("")
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <Card className="p-6">
        <h1 className="mb-6 text-2xl font-bold">RAG Recommendation Tester</h1>

        {!jobId ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="prompt"
                className="mb-2 block text-sm font-medium"
              >
                Enter your request:
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., I want to create a barbeque with 15 friends"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                rows={4}
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !prompt.trim()}
              className="w-full"
            >
              {isSubmitting ? "Processing..." : "Get Recommendations"}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="mb-1 text-sm text-slate-600 dark:text-slate-300">
                Your Request:
              </p>
              <p className="font-medium">{prompt}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Status:</p>
                <StatusBadge status={job?.status} />
              </div>

              {job?.status === "pending" && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Waiting to process...
                </div>
              )}

              {job?.status === "processing" && (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Analyzing and retrieving recommendations...
                  </span>
                </div>
              )}

              {job?.status === "completed" && job.result && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="mb-3 font-semibold">Analysis</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Categories:
                        </p>
                        <p className="font-medium">
                          {job.result.analysis.categories.join(", ") || "None"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Keywords:
                        </p>
                        <p className="font-medium">
                          {job.result.analysis.keywords.join(", ") || "None"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Occasion:
                        </p>
                        <p className="font-medium">
                          {job.result.analysis.occasion}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Quantity:
                        </p>
                        <p className="font-medium">
                          {job.result.analysis.quantity_hint}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="mb-3 font-semibold">Recommendation</h3>
                    <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
                      {job.result.recommendation.recommendation}
                    </p>

                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                        Selected Products:
                      </p>
                      <div className="space-y-2">
                        {job.result.recommendation.selectedProducts.map(
                          (product) => (
                            <div
                              key={product._id}
                              className="flex items-start gap-2 rounded bg-slate-50 p-2 dark:bg-slate-800"
                            >
                              <span className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {product.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {product.category}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {job?.status === "failed" && (
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Error: {job.error || "Unknown error"}
                  </p>
                </div>
              )}
            </div>

            <Button onClick={resetTest} variant="outline" className="w-full">
              New Recommendation
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const statusConfig = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
    processing: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Processing",
    },
    completed: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Completed",
    },
    failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
  }

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  )
}
