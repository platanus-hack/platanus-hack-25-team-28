"use client"

import { useMutation, useQuery } from "convex/react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { api } from "../convex/_generated/api"

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-slate-200 bg-background/80 p-4 shadow-sm backdrop-blur-md dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Image src="/convex.svg" alt="Convex Logo" width={32} height={32} />
            <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
            <Image
              src="/nextjs-icon-light-background.svg"
              alt="Next.js Logo"
              width={32}
              height={32}
              className="dark:hidden"
            />
            <Image
              src="/nextjs-icon-dark-background.svg"
              alt="Next.js Logo"
              width={32}
              height={32}
              className="hidden dark:block"
            />
          </div>
          <h1 className="font-semibold text-slate-800 dark:text-slate-200">
            SuperTracker
          </h1>
        </div>
        <AuthPopoverButton />
      </header>
      <main className="flex flex-col gap-8 p-8">
        <Content />
      </main>
    </>
  )
}

function Content() {
  const { viewer, numbers } =
    useQuery(api.myFunctions.listNumbers, {
      count: 10,
    }) ?? {}
  const addNumber = useMutation(api.myFunctions.addNumber)

  if (viewer === undefined || numbers === undefined) {
    return (
      <div className="mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-slate-500"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-slate-600"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <p className="ml-2 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Welcome!
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          This demo app generates random numbers and stores them in your Convex
          database.
        </p>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          Number generator
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Click the button below to generate a new number. The data is persisted
          in the Convex cloud database - open this page in another window and
          see the data sync automatically!
        </p>
        <button
          className="cursor-pointer rounded-lg bg-slate-700 px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] dark:bg-slate-600 dark:hover:bg-slate-500"
          onClick={() => {
            void addNumber({ value: Math.floor(Math.random() * 10) })
          }}
        >
          + Generate random number
        </button>
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800">
          <p className="mb-2 font-semibold text-slate-800 dark:text-slate-200">
            Newest Numbers
          </p>
          <p className="font-mono text-lg text-slate-700 dark:text-slate-300">
            {numbers?.length === 0
              ? "Click the button to generate a number!"
              : (numbers?.join(", ") ?? "...")}
          </p>
        </div>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          Making changes
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Edit{" "}
          <code className="rounded-md border border-slate-300 bg-slate-200 px-2 py-1 font-mono text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
            convex/myFunctions.ts
          </code>{" "}
          to change the backend.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Edit{" "}
          <code className="rounded-md border border-slate-300 bg-slate-200 px-2 py-1 font-mono text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
            app/page.tsx
          </code>{" "}
          to change the frontend.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          See the{" "}
          <Link
            href="/server"
            className="font-medium text-slate-700 underline decoration-2 underline-offset-2 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            /server route
          </Link>{" "}
          for an example of loading data in a server component
        </p>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Useful resources
        </h2>
        <div className="flex gap-4">
          <div className="flex w-1/2 flex-col gap-4">
            <ResourceCard
              title="Convex docs"
              description="Read comprehensive documentation for all Convex features."
              href="https://docs.convex.dev/home"
            />
            <ResourceCard
              title="Stack articles"
              description="Learn about best practices, use cases, and more from a growing
            collection of articles, videos, and walkthroughs."
              href="https://www.typescriptlang.org/docs/handbook/2/basic-types.html"
            />
          </div>
          <div className="flex w-1/2 flex-col gap-4">
            <ResourceCard
              title="Templates"
              description="Browse our collection of templates to get started quickly."
              href="https://www.convex.dev/templates"
            />
            <ResourceCard
              title="Discord"
              description="Join our developer community to ask questions, trade tips & tricks,
            and show off your projects."
              href="https://www.convex.dev/community"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ResourceCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="group flex h-36 cursor-pointer flex-col gap-2 overflow-auto rounded-xl border border-slate-300 bg-slate-100 p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-slate-400 hover:bg-slate-200 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:hover:bg-slate-700"
    >
      <h3 className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">
        {title} →
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </a>
  )
}

function AuthPopoverButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAuth, setSelectedAuth] = useState<
    "authkit" | "clerk" | "convexauth"
  >("authkit")
  const [copied, setCopied] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const commands = {
    authkit: "npm create convex@latest -- --template nextjs-authkit",
    clerk: "npm create convex@latest -- --template nextjs-clerk",
    convexauth: "npm create convex@latest -- --template nextjs-convexauth",
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(commands[selectedAuth])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-green-700 hover:shadow-md dark:bg-green-600 dark:hover:bg-green-500"
      >
        Want Auth?
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[560px] rounded-xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-600 dark:bg-slate-800">
          <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
            You can create a copy of this project with auth integrated by using
            this command.
          </p>

          <div className="mb-4 flex flex-col gap-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="auth"
                value="authkit"
                checked={selectedAuth === "authkit"}
                onChange={(e) => setSelectedAuth(e.target.value as "authkit")}
                className="h-4 w-4 cursor-pointer"
              />
              <Image src="/workos.svg" alt="WorkOS" width={20} height={20} />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                WorkOS AuthKit
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="auth"
                value="clerk"
                checked={selectedAuth === "clerk"}
                onChange={(e) => setSelectedAuth(e.target.value as "clerk")}
                className="h-4 w-4 cursor-pointer"
              />
              <Image src="/clerk.svg" alt="Clerk" width={20} height={20} />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Clerk
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="auth"
                value="convexauth"
                checked={selectedAuth === "convexauth"}
                onChange={(e) =>
                  setSelectedAuth(e.target.value as "convexauth")
                }
                className="h-4 w-4 cursor-pointer"
              />
              <Image src="/convex.svg" alt="Convex" width={20} height={20} />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Convex Auth
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-slate-100 p-3 dark:border-slate-600 dark:bg-slate-900">
            <code className="font-mono text-xs break-all text-slate-700 dark:text-slate-300">
              {commands[selectedAuth]}
            </code>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 cursor-pointer rounded bg-slate-600 px-3 py-1 text-xs text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
