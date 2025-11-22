"use client"

import React, { useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "./button"

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-50 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-main">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

