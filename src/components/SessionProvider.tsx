"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import React from "react"

interface SessionProviderProps {
  children: React.ReactNode
  session?: Session | null
}

export default function SessionProvider({
  children,
  session,
}: SessionProviderProps): React.JSX.Element {
  // Cast to unknown first then to the expected type to avoid React type conflicts
  const childrenElement = children as unknown as Parameters<typeof NextAuthSessionProvider>[0]["children"]

  return (
    <NextAuthSessionProvider session={session}>
      {childrenElement}
    </NextAuthSessionProvider>
  )
}
