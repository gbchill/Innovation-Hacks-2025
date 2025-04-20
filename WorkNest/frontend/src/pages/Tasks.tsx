// WorkNest/frontend/src/components/InteractiveTodo.tsx

import React, { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from 'react-beautiful-dnd';
import { TaskService, TaskRecord } from '../services/taskService';

type ColumnKey = 'todo' | 'doing' | 'done' | 'completed';

const columnTitles: Record<ColumnKey, string> = {
  todo: 'High Priority 🔥',
  doing: 'Medium Priority ⚠️',
  done: 'Low Priority ✅',
  completed: 'Completed 🎉'
};

export const InteractiveTodo: React.FC = () => {
  const [columns, setColumns] = useState<
    Record<ColumnKey, { id: ColumnKey; title: string; tasks: TaskRecord[] }>
  >({
    todo: { id: 'todo', title: columnTitles.todo, tasks: [] },
    doing: { id: 'doing', title: columnTitles.doing, tasks: [] },
    done: { id: 'done', title: columnTitles.done, tasks: [] },
    completed: { id: 'completed', title: columnTitles.completed, tasks: [] }
  });
  const [newTask, setNewTask] = useState('');
  const [targetColumn, setTargetColumn] =
    useState<Exclude<ColumnKey, 'completed'>>('todo');

  // 🔄 load once
  useEffect(() => {
    TaskService.getAll().then(all => {
      const bucket: Record<ColumnKey, TaskRecord[]> = {
        todo: [],
        doing: [],
        done: [],
        completed: []
      };
      all.forEach(t => bucket[t.column].push(t));
      setColumns(cols =>
        (Object.keys(cols) as ColumnKey[]).reduce((acc, key) => {
          acc[key] = { ...cols[key], tasks: bucket[key] };
          return acc;
        }, {} as typeof cols)
      );
    });
  }, []);

  // ➕ add
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    const created = await TaskService.create(newTask, targetColumn);
    setColumns(prev => ({
      ...prev,
      [targetColumn]: {
        ...prev[targetColumn],
        tasks: [...prev[targetColumn].tasks, created]
      }
    }));
    setNewTask('');
  };

  // ❌ delete
  const handleDelete = async (col: ColumnKey, id: number) => {
    await TaskService.remove(id);
    setColumns(prev => ({
      ...prev,
      [col]: {
        ...prev[col],
        tasks: prev[col].tasks.filter(t => t.id !== id)
      }
    }));
  };

  // ✔ complete
  const handleComplete = async (col: ColumnKey, task: TaskRecord) => {
    const updated = await TaskService.update(task.id, { column: 'completed' });
    setColumns(prev => ({
      ...prev,
      [col]: {
        ...prev[col],
        tasks: prev[col].tasks.filter(t => t.id !== task.id)
      },
      completed: {
        ...prev.completed,
        tasks: [...prev.completed.tasks, updated]
      }
    }));
  };

  // 🔀 drag/drop
  const onDragEnd = async (res: DropResult) => {
    const { source, destination } = res;
    if (!destination) return;
    const from = source.droppableId as ColumnKey;
    const to = destination.droppableId as ColumnKey;

    // same column re‑order
    if (from === to) {
      const items = Array.from(columns[from].tasks);
      const [m] = items.splice(source.index, 1);
      items.splice(destination.index, 0, m);
      return setColumns(prev => ({
        ...prev,
        [from]: { ...prev[from], tasks: items }
      }));
    }

    // move between columns
    const fromItems = Array.from(columns[from].tasks);
    const [moved] = fromItems.splice(source.index, 1);
    const toItems = Array.from(columns[to].tasks);
    moved.column = to;
    toItems.splice(destination.index, 0, moved);

    await TaskService.update(moved.id, { column: to });

    setColumns(prev => ({
      ...prev,
      [from]: { ...prev[from], tasks: fromItems },
      [to]: { ...prev[to], tasks: toItems }
    }));
  };

  return (
    <div className="p-4 bg-[#f9f9f7] min-h-screen">
      {/* add */}
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
        <button
          onClick={handleAddTask}
          className="bg-[#1B3B29] text-white px-6 py-2 rounded"
        >
          Add
        </button>
      </div>

      {/* board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 px-4">
          {Object.entries(columns).map(([colId, col]) => (
            <Droppable droppableId={colId} key={colId}>
              {provided => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-white border rounded p-4 w-64"
                >
                  <h3 className="text-center font-bold mb-3">
                    {col.title}
                  </h3>
                  {col.tasks.map((t, i) => (
                    <Draggable
                      key={t.id.toString()}
                      draggableId={t.id.toString()}
                      index={i}
                    >
                      {prov => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className="p-3 mb-2 bg-gray-100 rounded flex justify-between items-center"
                        >
                          <span>{t.content}</span>
                          <div className="flex gap-2">
                            {colId !== 'completed' && (
                              <button
                                onClick={() => handleComplete(colId as ColumnKey, t)}
                                className="text-green-500 font-bold"
                              >
                                ✔
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleDelete(colId as ColumnKey, t.id)
                              }
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
    </div>
  );
};

export default InteractiveTodo;
