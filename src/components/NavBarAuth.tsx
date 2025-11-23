"use client"
import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { Authenticated, Unauthenticated } from "convex/react"
import { Route } from "next"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"

export default function NavBarAuth() {
  const { user } = useAuth()

  return (
    <div className="flex items-center gap-2">
      <Authenticated>
        <Avatar className="rounded-lg">
          {user?.profilePictureUrl && (
            <AvatarImage src={user?.profilePictureUrl} alt={user?.email} />
          )}
          <AvatarFallback>
            <AvatarImage
              src="https://github.com/evilrabbit.png"
              alt="@evilrabbit"
            />
          </AvatarFallback>
        </Avatar>
        <Link href={"/sign-out" as Route}>
          <Button variant="ghost" size="sm">
            Cerrar sesión
          </Button>
        </Link>
      </Authenticated>
      <Unauthenticated>
        <Button variant="default" size="sm" asChild>
          <Link href={"/sign-in" as Route}>Iniciar sesión</Link>
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link href={"/sign-up" as Route}>Registrarse</Link>
        </Button>
      </Unauthenticated>
    </div>
  )
}
