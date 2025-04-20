import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { supabase } from '../services/tasksSupabase';

type Task = { 
  id: string; 
  content: string;
  column_id: string;
  position: number;
};

type Column = { 
  id: string; 
  title: string; 
  tasks: Task[] 
};

const columnTitles = {
  todo: 'High Priority 🔥',
  doing: 'Medium Priority ⚠️',
  done: 'Low Priority ✅',
  completed: 'Completed 🎉',
};

const InteractiveTodo: React.FC = () => {
  const [columns, setColumns] = useState<Record<string, Column>>({
    todo: { id: 'todo', title: 'High Priority 🔥', tasks: [] },
    doing: { id: 'doing', title: 'Medium Priority ⚠️', tasks: [] },
    done: { id: 'done', title: 'Low Priority ✅', tasks: [] },
    completed: { id: 'completed', title: 'Completed 🎉', tasks: [] },
  });
  const [newTask, setNewTask] = useState('');
  const [targetColumn, setTargetColumn] = useState<'todo' | 'doing' | 'done'>('todo');
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [modalTask, setModalTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalPriority, setModalPriority] = useState<'todo' | 'doing' | 'done'>('todo');

  // Fetch tasks from Supabase when component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        // Group tasks by column
        const columnData: Record<string, Column> = {
          todo: { id: 'todo', title: columnTitles.todo, tasks: [] },
          doing: { id: 'doing', title: columnTitles.doing, tasks: [] },
          done: { id: 'done', title: columnTitles.done, tasks: [] },
          completed: { id: 'completed', title: columnTitles.completed, tasks: [] },
        };

        // Convert database tasks to our Task type and organize by column
        data.forEach((task) => {
          const columnId = task.column_id;
          if (columnData[columnId]) {
            columnData[columnId].tasks.push({
              id: task.id,
              content: task.content,
              column_id: task.column_id,
              position: task.position,
            });
          }
        });

        // Sort tasks by position within each column
        Object.keys(columnData).forEach(columnId => {
          columnData[columnId].tasks.sort((a, b) => a.position - b.position);
        });

        setColumns(columnData);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    
    try {
      // Get highest position for the target column
      const highestPosition = Math.max(
        0,
        ...columns[targetColumn].tasks.map(task => task.position)
      );
      
      // Insert new task into Supabase
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          content: newTask,
          column_id: targetColumn,
          priority: targetColumn, // Same as column_id for simplicity
          position: highestPosition + 1,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Update local state
        setColumns(prev => ({
          ...prev,
          [targetColumn]: { 
            ...prev[targetColumn], 
            tasks: [
              ...prev[targetColumn].tasks, 
              {
                id: data.id,
                content: data.content,
                column_id: data.column_id,
                position: data.position,
              }
            ],
          },
        }));
      }
      
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDelete = async (colId: string, taskId: string) => {
    try {
      // Delete task from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setColumns(prev => ({
        ...prev,
        [colId]: { 
          ...prev[colId], 
          tasks: prev[colId].tasks.filter(t => t.id !== taskId),
        },
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleComplete = async (colId: string, task: Task) => {
    try {
      // Get highest position for the completed column
      const highestPosition = Math.max(
        0,
        ...columns.completed.tasks.map(task => task.position)
      );
      
      // Update task in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ 
          column_id: 'completed',
          priority: 'completed',
          position: highestPosition + 1,
        })
        .eq('id', task.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setColumns(prev => {
        // remove from original column
        const updatedSource = prev[colId].tasks.filter(t => t.id !== task.id);
        // append to completed with updated fields
        const updatedTask = { ...task, column_id: 'completed', position: highestPosition + 1 };
        
        return {
          ...prev,
          [colId]: { ...prev[colId], tasks: updatedSource },
          completed: { ...prev.completed, tasks: [...prev.completed.tasks, updatedTask] },
        };
      });
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    
    const fromKey = source.droppableId;
    const toKey = destination.droppableId;
    
    const fromTasks = [...columns[fromKey].tasks];
    const toTasks = fromKey === toKey ? fromTasks : [...columns[toKey].tasks];
    
    const [moved] = fromTasks.splice(source.index, 1);
    toTasks.splice(destination.index, 0, moved);
    
    // Update positions for each affected task
    const updatedToTasks = toTasks.map((task, index) => ({
      ...task,
      position: index,
      column_id: toKey,
    }));
    
    const updatedFromTasks = fromTasks.map((task, index) => ({
      ...task,
      position: index,
    }));
    
    // Update local state optimistically
    setColumns(prev => ({
      ...prev,
      [fromKey]: { ...prev[fromKey], tasks: updatedFromTasks },
      [toKey]: { ...prev[toKey], tasks: updatedToTasks },
    }));
    
    try {
      // Update the moved task first
      const movedTask = updatedToTasks[destination.index];
      await supabase
        .from('tasks')
        .update({ 
          column_id: toKey,
          priority: toKey,
          position: destination.index, 
        })
        .eq('id', movedTask.id);
      
      // Then batch update all other affected tasks in the destination column
      // This could be optimized to only update those that changed
      for (let i = 0; i < updatedToTasks.length; i++) {
        if (i !== destination.index) { // Skip the one we just updated
          const task = updatedToTasks[i];
          await supabase
            .from('tasks')
            .update({ position: i })
            .eq('id', task.id);
        }
      }
      
      // If we moved between columns, update positions in source column too
      if (fromKey !== toKey) {
        for (let i = 0; i < updatedFromTasks.length; i++) {
          const task = updatedFromTasks[i];
          await supabase
            .from('tasks')
            .update({ position: i })
            .eq('id', task.id);
        }
      }
    } catch (error) {
      console.error('Error updating task positions:', error);
      // On error, refresh tasks from database to ensure consistency
      fetchTasks();
    }
  };

  const openEditModal = (task: Task, columnId: string) => {
    setModalTask({ task, columnId });
    setModalName(task.content);
    setModalPriority(columnId as 'todo' | 'doing' | 'done');
  };
  
  const closeModal = () => setModalTask(null);

  const handleSave = async () => {
    if (!modalTask) return;
    const { task, columnId } = modalTask;
    
    try {
      // Determine if we're changing columns
      const isChangingColumn = modalPriority !== columnId;
      
      // Get highest position if changing columns
      let newPosition = task.position;
      if (isChangingColumn) {
        newPosition = Math.max(
          0,
          ...columns[modalPriority].tasks.map(t => t.position)
        ) + 1;
      }
      
      // Update task in Supabase
      const { data, error } = await supabase
        .from('tasks')
        .update({
          content: modalName,
          column_id: modalPriority,
          priority: modalPriority,
          position: newPosition,
        })
        .eq('id', task.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Update local state
        const updatedTask = {
          id: data.id,
          content: data.content,
          column_id: data.column_id,
          position: data.position,
        };
        
        setColumns(prev => {
          if (modalPriority === columnId) {
            // Same column, just update the task
            return {
              ...prev,
              [columnId]: {
                ...prev[columnId],
                tasks: prev[columnId].tasks.map(t => 
                  t.id === task.id ? updatedTask : t
                ),
              },
            };
          } else {
            // Moving to a different column
            return {
              ...prev,
              [columnId]: {
                ...prev[columnId],
                tasks: prev[columnId].tasks.filter(t => t.id !== task.id),
              },
              [modalPriority]: {
                ...prev[modalPriority],
                tasks: [...prev[modalPriority].tasks, updatedTask],
              },
            };
          }
        });
      }
      
      closeModal();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading tasks...</div>;
  }

  return (
    <div className="p-4 bg-[#f9f9f7] min-h-screen">
      {/* Add new */}
      <div className="flex gap-2 max-w-xl mx-auto mb-4">
        <input
          className="flex-1 border px-4 py-2 rounded"
          placeholder="New task..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
        />
        <select
          className="border px-3 py-2 rounded"
          value={targetColumn}
          onChange={e => setTargetColumn(e.target.value as any)}
        >
          <option value="todo">High 🔥</option>
          <option value="doing">Medium ⚠️</option>
          <option value="done">Low ✅</option>
        </select>
        <button onClick={handleAddTask} className="bg-[#1B3B29] text-white px-6 py-2 rounded">
          Add
        </button>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 px-4 overflow-x-auto pb-4">
          {Object.entries(columns).map(([colId, col]) => (
            <Droppable droppableId={colId} key={colId}>
              {provided => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-white border rounded p-4 w-64 flex-shrink-0"
                >
                  <h3 className="text-center font-bold mb-3">{col.title}</h3>
                  {col.tasks.map((t, i) => (
                    <Draggable key={t.id} draggableId={t.id} index={i}>
                      {prov => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className="p-3 mb-2 bg-gray-100 rounded flex justify-between items-center cursor-pointer"
                          onDoubleClick={() => openEditModal(t, colId)}
                        >
                          <span>{t.content}</span>
                          <div className="flex gap-2">
                            {colId !== 'completed' && (
                              <button
                                onClick={() => handleComplete(colId, t)}
                                className="text-green-500 font-bold"
                              >
                                ✔
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(colId, t.id)}
                              className="text-red-500"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Edit Modal with blur backdrop */}
      {modalTask && (
        <div className="fixed inset-0 backdrop-filter backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 shadow-lg">
            <h4 className="mb-3 font-semibold">Edit Task</h4>
            <input
              className="w-full border p-2 rounded mb-3"
              value={modalName}
              onChange={e => setModalName(e.target.value)}
            />
            <select
              className="w-full border p-2 rounded mb-4"
              value={modalPriority}
              onChange={e => setModalPriority(e.target.value as any)}
            >
              <option value="todo">High 🔥</option>
              <option value="doing">Medium ⚠️</option>
              <option value="done">Low ✅</option>
            </select>
            <button onClick={handleSave} className="w-full bg-[#1B3B29] text-white py-2 rounded mb-2">
              Save
            </button>
            <button onClick={closeModal} className="w-full border py-2 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveTodo;