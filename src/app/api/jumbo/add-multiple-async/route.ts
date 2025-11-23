import { NextRequest, NextResponse } from "next/server"

type Job = {
  status: "pending" | "running" | "completed" | "failed"
  result?: unknown
  error?: string
  startedAt: number
  progress?: {
    current: number
    total: number
    cartReady?: boolean
    currentCartCount?: number
  }
}

const jobs = new Map<string, Job>()

function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const jobId = generateJobId()

    jobs.set(jobId, {
      status: "pending",
      startedAt: Date.now(),
    })

    setImmediate(async () => {
      jobs.set(jobId, {
        ...jobs.get(jobId)!,
        status: "running",
        progress: {
          current: 0,
          total: body.products?.length || body.productUrls?.length || 0,
          cartReady: false,
          currentCartCount: 0,
        },
      })

      try {
        const response = await fetch(
          `${req.nextUrl.origin}/api/jumbo/add-multiple`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...body,
              onProgress: jobId,
            }),
          }
        )

        const result = await response.json()

        jobs.set(jobId, {
          status: response.ok ? "completed" : "failed",
          result: response.ok ? result : undefined,
          error: response.ok ? undefined : result.error || "Unknown error",
          startedAt: jobs.get(jobId)!.startedAt,
          progress: jobs.get(jobId)!.progress,
        })
      } catch (error) {
        jobs.set(jobId, {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          startedAt: jobs.get(jobId)!.startedAt,
        })
      }

      setTimeout(
        () => {
          jobs.delete(jobId)
        },
        5 * 60 * 1000
      )
    })

    return NextResponse.json({ jobId })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId")

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "jobId required" },
      { status: 400 }
    )
  }

  const job = jobs.get(jobId)

  if (!job) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({
    status: job.status,
    result: job.result,
    error: job.error,
    elapsedMs: Date.now() - job.startedAt,
    progress: job.progress,
  })
}
