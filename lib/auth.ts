import { createClient } from "@supabase/supabase-js"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("🔧 Auth Configuration Check:")
console.log("URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
console.log("Key:", supabaseAnonKey ? "✅ Set" : "❌ Missing")

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.includes("supabase"))
}

// Create Supabase client only if configured
export const supabase = isSupabaseConfigured() ? createClient(supabaseUrl!, supabaseAnonKey!) : null

// Types
export interface User {
  id: string
  email: string
  name?: string
  role?: string
}

/**
 * Signs in with email and password
 */
export async function signIn(email: string, password: string) {
  if (!supabase) {
    console.log("⚠️ Supabase not configured - using mock authentication")
    // Mock authentication for development
    if (email === "admin@example.com" && password === "admin123") {
      return {
        data: {
          user: {
            id: "mock-user-1",
            email: "admin@example.com",
            user_metadata: { name: "Admin User" },
          },
        },
        error: null,
      }
    }
    return { data: null, error: { message: "Invalid credentials" } }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  } catch (error) {
    console.error("Error signing in:", error)
    return { data: null, error }
  }
}

/**
 * Signs out the current user
 */
export async function signOut() {
  if (!supabase) {
    console.log("⚠️ Supabase not configured - mock sign out")
    return { error: null }
  }

  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error("Error signing out:", error)
    return { error }
  }
}

/**
 * Gets the current authenticated user
 */
export async function getCurrentUser() {
  if (!supabase) {
    console.log("⚠️ Supabase not configured - no current user")
    return null
  }

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return null
    }

    const user = session.user
    return {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
      role: user.user_metadata?.role || "user",
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Sets up a subscription to auth state changes
 */
export function onAuthStateChange(callback: (user: any) => void) {
  if (!supabase) {
    console.log("⚠️ Supabase not configured - no auth state changes")
    return { data: { subscription: null } }
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      const user = {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
        role: session.user.user_metadata?.role || "user",
      }
      callback(user)
    } else {
      callback(null)
    }
  })
}

/**
 * Signs up a new user
 */
export async function signUpWithPassword(email: string, password: string, name?: string) {
  if (!supabase) {
    console.log("⚠️ Supabase not configured - mock sign up")
    return { user: null, error: { message: "Supabase not configured" } }
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
        },
      },
    })

    if (error) {
      throw error
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Error signing up:", error)
    return { user: null, error }
  }
}
