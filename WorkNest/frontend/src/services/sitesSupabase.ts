// src/services/sitesSupabase.ts
import { supabase } from './supabaseClient'

export interface BlockedWebsite {
  id: string
  url: string
  created_at: string
  user_id?: string
}

/** Fetch all blocked URLs */
export async function getBlockedWebsites(): Promise<BlockedWebsite[]> {
  const { data, error } = await supabase
    .from('blocked_websites')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching blocked sites:', error)
    return []
  }
  return data as BlockedWebsite[]
}

/** Insert a new blocked URL — throws on failure */
export async function addBlockedWebsite(
  url: string
): Promise<BlockedWebsite> {
  const { data, error } = await supabase
    .from('blocked_websites')
    .insert({ url })
    .select()   // return the newly inserted row
    .single()   // unwrap from array

  if (error) {
    console.error('Error inserting blocked site:', error)
    throw error
  }
  return data as BlockedWebsite
}

/** Delete by id */
export async function removeBlockedWebsite(id: string): Promise<void> {
  const { error } = await supabase
    .from('blocked_websites')
    .delete()
    .eq('id', id)

  if (error) console.error('Error deleting blocked site:', error)
}
