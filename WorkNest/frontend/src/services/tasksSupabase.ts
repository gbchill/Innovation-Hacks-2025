import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definition for Kanban tasks
export type KanbanTask = {
  id: string;
  created_at: string;
  content: string;
  column_id: string; // 'todo', 'doing', 'done', 'completed'
  priority: string;  // 'todo', 'doing', 'done', 'completed'
  position: number;
  user_id?: string;
};

// Functions for task operations

/**
 * Fetch all tasks
 */
export async function getTasks(userId?: string) {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  
  return data as KanbanTask[];
}

/**
 * Create a new task
 */
export async function createTask(task: Omit<KanbanTask, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }
  
  return data as KanbanTask;
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, updates: Partial<Omit<KanbanTask, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }
  
  return data as KanbanTask;
}

/**
 * Delete a task
 */
export async function deleteTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
  
  return true;
}

/**
 * Update multiple tasks at once (for batch position updates)
 */
export async function updateBatchTaskPositions(tasks: { id: string; position: number }[]) {
  // Supabase doesn't have a native batch update
  // So we'll make multiple calls in sequence
  try {
    for (const task of tasks) {
      await supabase
        .from('tasks')
        .update({ position: task.position })
        .eq('id', task.id);
    }
    return true;
  } catch (error) {
    console.error('Error batch updating task positions:', error);
    throw error;
  }
}

/**
 * Move a task to a different column
 */
export async function moveTask(id: string, columnId: string, position: number) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      column_id: columnId,
      priority: columnId, // Keep priority synced with column for simplicity
      position: position
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error moving task:', error);
    throw error;
  }
  
  return data as KanbanTask;
}