import { supabase } from './supabaseClient'

export interface CalendarEvent {
  id: string;
  created_at?: string;
  title: string;
  day_index: number;
  start_time: string;
  end_time: string;
  color: string;
  is_deep_work?: boolean;
  week_index: number;
  user_id?: string;
}

/**
 * Fetch all calendar events for a specific week
 */
export async function getCalendarEvents(weekIndex: number, userId?: string) {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('week_index', weekIndex);
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
  
  return data as CalendarEvent[];
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(event)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
  
  return data as CalendarEvent;
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
  
  return data as CalendarEvent;
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(id: string) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
  
  return true;
}