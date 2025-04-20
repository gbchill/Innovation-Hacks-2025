// frontend/src/InteractiveTodo.tsx
import React, { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from 'react-beautiful-dnd';

type ColumnId = 'todo' | 'doing' | 'done';
type AllColumnId = ColumnId | 'completed';

type Task = { id: string; content: string };
type Column = { id: AllColumnId; title: string; tasks: Task[] };

const fullViewData: Record<AllColumnId, Column> = {
  todo:      { id: 'todo',      title: 'High Priority 🔥',   tasks: [] },
  doing:     { id: 'doing',     title: 'Medium Priority ⚠️', tasks: [] },
  done:      { id: 'done',      title: 'Low Priority ✅',     tasks: [] },
  completed: { id: 'completed', title: 'Completed 🎉',        tasks: [] },
};

const InteractiveTodo: React.FC = () => {
  const [columns, setColumns] = useState(fullViewData);
  const [newTask, setNewTask] = useState('');
  const [targetColumn, setTargetColumn] = useState<ColumnId>('todo');
  const [taskIdCounter, setTaskIdCounter] = useState(1);

  // Modal state
  const [modalTask, setModalTask] = useState<{ task: Task; columnId: AllColumnId } | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalPriority, setModalPriority] = useState<ColumnId>('todo');

  // Decompose button loading
  const [decomposing, setDecomposing] = useState<string | null>(null);
  // AI‑sort loading
  const [sortingCol, setSortingCol] = useState<AllColumnId | null>(null);
  // AI‑suggest priority loading
  const [suggesting, setSuggesting] = useState(false);

  // ─── Basic handlers ────────────────────────────────────────────────────
  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const newObj: Task = { id: `task-${taskIdCounter}`, content: newTask };
    setColumns(prev => ({
      ...prev,
      [targetColumn]: {
        ...prev[targetColumn],
        tasks: [...prev[targetColumn].tasks, newObj],
      },
    }));
    setTaskIdCounter(prev => prev + 1);
    setNewTask('');
  };

  const handleDelete = (colId: AllColumnId, taskId: string) => {
    setColumns(prev => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        tasks: prev[colId].tasks.filter(t => t.id !== taskId),
      },
    }));
  };

  const handleComplete = (colId: AllColumnId, task: Task) => {
    setColumns(prev => {
      const remaining = prev[colId].tasks.filter(t => t.id !== task.id);
      return {
        ...prev,
        [colId]: { ...prev[colId], tasks: remaining },
        completed: { ...prev.completed, tasks: [...prev.completed.tasks, task] },
      };
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    const fromKey = source.droppableId as AllColumnId;
    const toKey   = destination.droppableId as AllColumnId;

    const fromTasks = Array.from(columns[fromKey].tasks);
    const toTasks   = fromKey === toKey
      ? fromTasks
      : Array.from(columns[toKey].tasks);

    const [moved] = fromTasks.splice(source.index, 1);
    toTasks.splice(destination.index, 0, moved);

    setColumns(prev => ({
      ...prev,
      [fromKey]: { ...prev[fromKey], tasks: fromTasks },
      [toKey]:   { ...prev[toKey],   tasks: toTasks },
    }));
  };
  // ────────────────────────────────────────────────────────────────────────

  // ─── Task Edit Modal ───────────────────────────────────────────────────
  const openEditModal = (task: Task, columnId: AllColumnId) => {
    setModalTask({ task, columnId });
    setModalName(task.content);
    if (columnId !== 'completed') setModalPriority(columnId as ColumnId);
  };
  const closeModal = () => setModalTask(null);

  const handleSave = () => {
    if (!modalTask) return;
    const { task, columnId } = modalTask;
    const updatedTask = { ...task, content: modalName };

    setColumns(prev => {
      if (modalPriority === columnId) {
        return {
          ...prev,
          [columnId]: {
            ...prev[columnId],
            tasks: prev[columnId].tasks.map(t =>
              t.id === task.id ? updatedTask : t
            ),
          },
        };
      }
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
    });
    closeModal();
  };

  // AI‑Suggest Priority in Modal
  const handleAISuggestPriority = async () => {
    if (!modalTask) return;
    const api: any = window.electronAPI;
    if (!api?.generateAI) return;

    setSuggesting(true);
    try {
      const prompt = [
        `Given the task below, classify its priority as High, Medium, or Low.`,
        `Return just one of: High, Medium, or Low.`,
        `Task: "${modalName}"`
      ].join('\n');

      const { text } = await api.generateAI(prompt);
      const choice = text.trim().toLowerCase();
      if (choice.startsWith('high')) setModalPriority('todo');
      else if (choice.startsWith('medium')) setModalPriority('doing');
      else if (choice.startsWith('low')) setModalPriority('done');
    } finally {
      setSuggesting(false);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  // AI‑Sort Column
  const handleAISort = async (colId: AllColumnId) => {
    const api: any = window.electronAPI;
    if (!api?.generateAI) return;

    setSortingCol(colId);
    try {
      const tasks = columns[colId].tasks.map(t => t.content).join(', ');
      const prompt = [
        `Reorder these tasks by priority (highest first).`,
        `Return a comma-separated list in the new order.`,
        `Tasks: ${tasks}`
      ].join('\n');

      const { text } = await api.generateAI(prompt);
      const ordered = text.split(',').map(s => s.trim()).filter(s => s);

      // build new tasks array by matching content
      const newTasks = ordered
        .map(content => columns[colId].tasks.find(t => t.content === content))
        .filter((t): t is Task => Boolean(t));
      // append any that AI missed
      columns[colId].tasks.forEach(t => {
        if (!newTasks.find(nt => nt.id === t.id)) newTasks.push(t);
      });

      setColumns(prev => ({
        ...prev,
        [colId]: { ...prev[colId], tasks: newTasks }
      }));
    } finally {
      setSortingCol(null);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  // AI Decompose Handler
  const handleDecompose = async (colId: AllColumnId, task: Task) => {
    const api: any = window.electronAPI;
    if (!api?.generateAI) return;

    setDecomposing(task.id);
    try {
      const prompt = [
        `Split this task into exactly three concise micro‑tasks.`,
        `Do NOT include the original task text.`,
        `Respond with the three subtasks separated by commas, with no numbering or JSON.`,
        `Task: "${task.content}"`
      ].join('\n');

      const { text } = await api.generateAI(prompt);
      let cleaned = text.replace(/```.*?```/g, '').trim();
      const subs = cleaned.includes(',')
        ? cleaned.split(',').map(s => s.trim()).filter(s => s)
        : cleaned.split(/\r?\n/).map(l => l.trim()).filter(l => l);

      const filtered = subs.filter(s => s !== task.content.trim());
      const newTasks: Task[] = filtered.slice(0, 3).map((content, i) => ({
        id: `${task.id}-sub-${Date.now()}-${i}`,
        content,
      }));

      setColumns(prev => {
        const col   = prev[colId];
        const index = col.tasks.findIndex(t => t.id === task.id);
        if (index < 0) return prev;
        const updated = [
          ...col.tasks.slice(0, index + 1),
          ...newTasks,
          ...col.tasks.slice(index + 1),
        ];
        return { ...prev, [colId]: { ...col, tasks: updated } };
      });
    } finally {
      setDecomposing(null);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#f9f9f7] min-h-screen p-4 flex justify-center items-start">
      <div className="w-full max-w-7xl">
        {/* Add new task */}
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
            onChange={e => setTargetColumn(e.target.value as ColumnId)}
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

        {/* Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 px-4 overflow-auto">
            {Object.entries(columns).map(([colId, col]) => (
              <Droppable droppableId={colId} key={colId}>
                {provided => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-white border rounded p-4 w-64 flex-shrink-0"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold">{col.title}</h3>
                      <button
                        onClick={() => handleAISort(colId as AllColumnId)}
                        disabled={sortingCol === colId}
                        className="text-sm text-purple-600 hover:underline"
                      >
                        {sortingCol === colId ? 'Sorting…' : 'AI Sort'}
                      </button>
                    </div>

                    {col.tasks.map((t, i) => {
                      const isSub = t.id.includes('-sub-');
                      return (
                        <Draggable key={t.id} draggableId={t.id} index={i}>
                          {prov => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              onClick={() => openEditModal(t, colId as AllColumnId)}
                              className={`
                                p-3 mb-2 bg-gray-100 rounded flex flex-col justify-between
                                ${isSub ? 'pl-4 border-l-2 border-gray-300' : ''}
                                cursor-pointer
                              `}
                            >
                              <span className="break-words mb-2">{t.content}</span>
                              <div className="flex flex-wrap gap-1 justify-end">
                                <button
                                  onClick={e => { e.stopPropagation(); handleDecompose(colId as AllColumnId, t); }}
                                  disabled={decomposing === t.id}
                                  className="text-blue-500 px-2 py-1 border rounded"
                                >
                                  {decomposing === t.id ? '…' : 'Decompose'}
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); handleComplete(colId as AllColumnId, t); }}
                                  className="text-green-500 font-bold px-2 py-1 border rounded"
                                >
                                  ✔
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); handleDelete(colId as AllColumnId, t.id); }}
                                  className="text-red-500 px-2 py-1 border rounded"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>

        {/* Edit Modal */}
        {modalTask && (
          <div className="fixed inset-0 backdrop-filter backdrop-blur-lg flex items-center justify-center z-10">
            <div className="bg-white p-6 rounded-lg w-80 shadow-lg">
              <h4 className="mb-3 font-semibold">Edit Task</h4>
              <input
                className="w-full border p-2 rounded mb-3"
                value={modalName}
                onChange={e => setModalName(e.target.value)}
              />
              <div className="flex items-center justify-between mb-3">
                <select
                  className="border p-2 rounded flex-1"
                  value={modalPriority}
                  onChange={e => setModalPriority(e.target.value as ColumnId)}
                >
                  <option value="todo">High 🔥</option>
                  <option value="doing">Medium ⚠️</option>
                  <option value="done">Low ✅</option>
                </select>
                <button
                  onClick={handleAISuggestPriority}
                  disabled={suggesting}
                  className="ml-2 text-sm text-purple-600 hover:underline"
                >
                  {suggesting ? 'Suggesting…' : 'AI Suggest'}
                </button>
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-[#1B3B29] text-white py-2 rounded mb-2"
              >
                Save
              </button>
              <button
                onClick={closeModal}
                className="w-full border py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveTodo;
