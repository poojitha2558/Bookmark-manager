"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// Disable prerendering for this dynamic, auth-protected page
export const dynamic = "force-dynamic"

export default function Dashboard() {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 🔹 BroadcastChannel for cross-tab communication (browser-only)
  const getChannel = useCallback(() => {
    if (typeof window === "undefined") return null
    try {
      return new BroadcastChannel("bookmarks-channel")
    } catch {
      return null
    }
  }, [])

  // 🔹 Get logged-in user and redirect if not authenticated
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/")  // ✅ Redirect to login if not authenticated
        return
      }
      
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [router])

  // 🔹 Fetch bookmarks for current user
  const fetchBookmarks = useCallback(async () => {
    if (!user?.id) return

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bookmarks:", error)
      return
    }

    console.log("✅ Bookmarks fetched:", data?.length)
    setBookmarks(data || [])
  }, [user?.id])

  // 🔹 Setup realtime listener across tabs (client-only)
  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return

    console.log("🔥 Setting up cross-tab communication")
    
    fetchBookmarks()

    // Create broadcast channel for cross-tab sync
    const channel = getChannel()
    
    if (channel) {
      channel.onmessage = (event) => {
        console.log("📡 Message from another tab:", event.data)
        fetchBookmarks()
      }
    }

    return () => {
      if (channel) {
        channel.close()
      }
    }

  }, [user?.id, fetchBookmarks, getChannel])

  // 🔹 Add bookmark
  const addBookmark = async () => {
    if (!user?.id) return
    if (!title || !url) return

    const { error } = await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: user.id
    })

    if (error) {
      console.error("Error adding bookmark:", error)
      return
    }

    setTitle("")
    setUrl("")
    
    // 📢 Broadcast to other tabs
    if (typeof window !== "undefined") {
      const channel = getChannel()
      if (channel) {
        channel.postMessage({ type: "bookmark-added", title, url })
      }
    }
    
    await fetchBookmarks()
  }

  // 🔹 Delete bookmark
  const deleteBookmark = async (id: string) => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting bookmark:", error)
      return
    }

    // 📢 Broadcast to other tabs
    if (typeof window !== "undefined") {
      const channel = getChannel()
      if (channel) {
        channel.postMessage({ type: "bookmark-deleted", id })
      }
    }
    
    await fetchBookmarks()
  }

  return (
    <div className="p-8">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="mb-8">
            
            <div className="text-right">
              <p className="text-sm font-semibold">
                {user?.user_metadata?.name || "User"}
              </p>
              <p className="text-sm text-gray-600">
                {user?.email}
              </p>
              <h1 
                className="text-sm font-semibold text-red-500 hover:underline cursor-pointer" 
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push("/")
                }}
              >
                Log out
              </h1>
            </div>
          </div>

           <div className="flex justify-center mb-7">
              <h1 className="text-2xl font-bold">My Bookmarks</h1>
            </div>

          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  await addBookmark()
                }}
                className="flex gap-2 mb-6"
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="border p-2 flex-1 rounded"
                />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="URL"
                  className="border p-2 flex-1 rounded"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition whitespace-nowrap"
                >
                  Add
                </button>
              </form>

              {bookmarks.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No bookmarks yet. Add one above!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {bookmarks.map((b) => (
                    <div 
                      key={b.id} 
                      className="border border-gray-700 rounded-lg p-3 hover:shadow-lg transition bg-gray-800 flex items-center gap-3"
                    >
                      <h3 className="font-semibold text-blue-400 min-w-fit">
                        {b.title}
                      </h3>
                      <a 
                        href={b.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 text-sm break-all hover:underline flex-1"
                      >
                        {b.url}
                      </a>
                      <button
                        onClick={() => deleteBookmark(b.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm whitespace-nowrap"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
