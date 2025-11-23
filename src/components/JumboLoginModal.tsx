"use client"

import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useState } from "react"

interface JumboLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (credentials: { username: string; password: string }) => void
}

export function JumboLoginModal({
  isOpen,
  onClose,
  onSubmit,
}: JumboLoginModalProps) {
  const [loginType, setLoginType] = useState<"correo" | "rut">("correo")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      onSubmit({ username: username.trim(), password })
      setUsername("")
      setPassword("")
    } catch (error) {
      console.error("Error submitting credentials:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setUsername("")
      setPassword("")
      onClose()
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="">
      <div className="flex flex-col items-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/images/jumbo.png"
            alt="Jumbo"
            width={120}
            height={60}
            className="h-auto w-auto object-contain"
            priority
            unoptimized
          />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-text-main">
          Iniciar sesión
        </h2>
        <p className="mb-6 text-sm text-text-muted">
          Ingresa tus credenciales de Jumbo
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-2">
            <Label variant="required">Tipo de inicio de sesión</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLoginType("correo")}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  loginType === "correo"
                    ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                    : "border-gray-200 bg-white text-text-muted hover:border-gray-300"
                }`}
              >
                Correo
              </button>
              <button
                type="button"
                onClick={() => setLoginType("rut")}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  loginType === "rut"
                    ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                    : "border-gray-200 bg-white text-text-muted hover:border-gray-300"
                }`}
              >
                RUT
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label variant="required" htmlFor="username">
              {loginType === "correo" ? "Correo electrónico" : "RUT"}
            </Label>
            <Input
              id="username"
              type={loginType === "correo" ? "email" : "text"}
              placeholder={
                loginType === "correo" ? "tu@email.com" : "12345678-9"
              }
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-lg border-gray-200 bg-white transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label variant="required" htmlFor="password">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border-gray-200 bg-white transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !username.trim() || !password.trim()}
              className="w-full rounded-xl bg-black py-3.5 font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
