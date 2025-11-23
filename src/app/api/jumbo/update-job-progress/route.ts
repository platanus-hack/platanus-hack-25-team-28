import { NextRequest, NextResponse } from "next/server"

const jobs = new Map<
  string,
  {
    status: string
    progress?: {
      current: number
      total: number
      cartReady?: boolean
      currentCartCount?: number
    }
  }
>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobId, current, total, cartReady, currentCartCount } = body

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId required" },
        { status: 400 }
      )
    }

    const existingJob = jobs.get(jobId)
    if (existingJob) {
      jobs.set(jobId, {
        ...existingJob,
        progress: {
          current: current ?? existingJob.progress?.current ?? 0,
          total: total ?? existingJob.progress?.total ?? 0,
          cartReady: cartReady ?? existingJob.progress?.cartReady ?? false,
          currentCartCount:
            currentCartCount ?? existingJob.progress?.currentCartCount ?? 0,
        },
      })
    } else {
      jobs.set(jobId, {
        status: "running",
        progress: {
          current: current ?? 0,
          total: total ?? 0,
          cartReady: cartReady ?? false,
          currentCartCount: currentCartCount ?? 0,
        },
      })
    }

    return NextResponse.json({ success: true })
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

  return NextResponse.json(job)
}
