import fs from "fs"
import os from "os"
import path from "path"

function tryEnsureDir(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    return dirPath
  } catch {
    return null
  }
}

export function resolveUserDataDir(folderName: string) {
  const candidates: string[] = []
  const envDir = process.env.PLAYWRIGHT_USER_DATA_DIR

  if (envDir) {
    const envPath = path.isAbsolute(envDir)
      ? envDir
      : path.join(process.cwd(), envDir)
    candidates.push(envPath)
    candidates.push(path.join(envPath, folderName))
  }

  candidates.push(path.join(process.cwd(), folderName))
  candidates.push(path.join(os.tmpdir(), folderName))

  for (const candidate of candidates) {
    const resolved = tryEnsureDir(candidate)
    if (resolved) {
      return resolved
    }
  }

  throw new Error("Unable to resolve a writable Playwright user data dir")
}

const busyDirs = new Set<string>()
const dirQueues = new Map<string, Array<() => void>>()

async function acquireDirLock(dir: string) {
  if (!busyDirs.has(dir)) {
    busyDirs.add(dir)
    return
  }
  return new Promise<void>((resolve) => {
    const queue = dirQueues.get(dir) ?? []
    queue.push(resolve)
    dirQueues.set(dir, queue)
  })
}

function releaseDirLock(dir: string) {
  const queue = dirQueues.get(dir)
  if (queue && queue.length > 0) {
    const next = queue.shift()
    if (next) {
      next()
      return
    }
  }
  busyDirs.delete(dir)
}

export async function withUserDataDirLock<T>(
  dir: string,
  fn: () => Promise<T>
) {
  await acquireDirLock(dir)
  try {
    return await fn()
  } finally {
    releaseDirLock(dir)
  }
}
