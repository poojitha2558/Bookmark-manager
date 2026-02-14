"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const router = useRouter()

  // 🔹 Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push("/dashboard")
      }
    }
    checkUser()
  }, [router])

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={login}
        className="bg-black text-white text-2xl px-6 py-2 rounded border-2 border-b-white hover:bg-white hover:text-black transition"
      >
        Login with Google
      </button>
    </div>
  )
}
