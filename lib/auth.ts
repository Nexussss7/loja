import { supabase } from './supabase'

export type User = {
  id: string
  email: string
  role?: string
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
}

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw error
  }

  return user
}

// Check if user is authenticated
export async function isAuthenticated() {
  try {
    const user = await getCurrentUser()
    return !!user
  } catch {
    return false
  }
}

// Get session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    throw error
  }

  return session
}
