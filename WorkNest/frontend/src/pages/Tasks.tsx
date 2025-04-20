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
  const [columns, setColumns] = useState<Record<AllColumnId, Column>>(() => ({ ...fullViewData }));
  const [newTask, setNewTask] = useState('');
  const [targetColumn, setTargetColumn] = useState<ColumnId>('todo');
  const [taskIdCounter, setTaskIdCounter] = useState(1);

  const [modalTask, setModalTask] = useState<{ task: Task; columnId: AllColumnId } | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalPriority, setModalPriority] = useState<ColumnId>('todo');

  const [decomposing, setDecomposing] = useState<string | null>(null);
  const [sortingCol, setSortingCol] = useState<AllColumnId | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  // ─── Handlers ───────────────────────────────────────────────────────────
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

  // ─── Edit Modal ────────────────────────────────────────────────────────
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
        // same column
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
      // move to new column
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
      else setModalPriority('done');
    } finally {
      setSuggesting(false);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#181414] min-h-screen p-4 flex justify-center items-start">
      <div className="w-full max-w-7xl">
        {/* Add new task */}
        <div className="flex gap-2 max-w-xl mx-auto mb-4">
          <input
            className="flex-1 border border-gray-700 bg-[#242424] text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1B3B29]"
            placeholder="New task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
          />
          <select
            className="border border-gray-700 bg-[#242424] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1B3B29]"
            value={targetColumn}
            onChange={e => setTargetColumn(e.target.value as ColumnId)}
          >
            <option value="todo">High 🔥</option>
            <option value="doing">Medium ⚠️</option>
            <option value="done">Low ✅</option>
          </select>
          <button
            onClick={handleAddTask}
            className="bg-[#1B3B29] hover:bg-[#152b1f] text-white px-6 py-2 rounded"
          >
            Add
          </button>
        </div>

        {/* Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 px-4 overflow-auto pb-4">
            {Object.entries(columns).map(([colId, col]) => (
              <Droppable droppableId={colId} key={colId}>
                {provided => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-[#242424] border border-gray-700 rounded p-4 w-64 flex-shrink-0"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-white">{col.title}</h3>
                      <button
                        onClick={() => handleAISuggestPriority()}
                        disabled={sortingCol === colId}
                        className="text-purple-400 hover:underline text-sm"
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
                                p-3 mb-2 bg-[#333333] rounded flex flex-col justify-between
                                ${isSub ? 'pl-4 border-l-2 border-gray-600' : ''}
                                cursor-pointer hover:bg-[#3a3a3a]
                              `}
                            >
                              <span className="text-white break-words mb-2">{t.content}</span>
                              <div className="flex flex-wrap gap-2 justify-end">
                                <button
                                  onClick={e => { e.stopPropagation(); handleDecompose(colId as AllColumnId, t); }}
                                  disabled={decomposing === t.id}
                                  className="text-blue-400 px-2 py-1 border border-gray-600 rounded hover:bg-[#2f2f2f]"
                                >
                                  {decomposing === t.id ? '…' : 'Decompose'}
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); handleComplete(colId as AllColumnId, t); }}
                                  className="text-green-400 font-bold px-2 py-1 border border-gray-600 rounded hover:bg-[#2f2f2f]"
                                >
                                  ✔
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); handleDelete(colId as AllColumnId, t.id); }}
                                  className="text-red-400 px-2 py-1 border border-gray-600 rounded hover:bg-[#2f2f2f]"
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
          <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-[#242424] p-6 rounded-lg w-80 shadow-lg border border-gray-700 text-white">
              <h4 className="mb-3 text-lg font-semibold">Edit Task</h4>
              <input
                className="w-full bg-[#333333] border border-gray-600 text-white p-2 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-[#1B3B29]"
                value={modalName}
                onChange={e => setModalName(e.target.value)}
              />
              <div className="flex items-center justify-between mb-4">
                <select
                  className="flex-1 bg-[#333333] border border-gray-600 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1B3B29]"
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
                  className="ml-2 text-purple-400 text-sm hover:underline"
                >
                  {suggesting ? 'Suggesting…' : 'AI Suggest'}
                </button>
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-[#1B3B29] hover:bg-[#152b1f] text-white py-2 rounded mb-2"
              >
                Save
              </button>
              <button
                onClick={closeModal}
                className="w-full border border-gray-700 text-gray-300 py-2 rounded hover:bg-[#2a2a2a]"
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
