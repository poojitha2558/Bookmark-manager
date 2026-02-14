"use client"

import { createClient } from '@supabase/supabase-js'

// Lazy-load Supabase client only when actually used, never at import time
let supabaseClient: any = null

function initSupabase() {
  if (supabaseClient) return supabaseClient
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  supabaseClient = createClient(url, key)
  return supabaseClient
}

// Export a proxy that initializes on first access
export const supabase = new Proxy(
  {},
  {
    get: (target, prop) => {
      const client = initSupabase()
      return (client as any)[prop]
    }
  }
) as any
