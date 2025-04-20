import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

type Task = { id: string; content: string };
type Column = { id: string; title: string; tasks: Task[] };

const fullViewData: Record<string, Column> = {
  todo: { id: 'todo', title: 'High Priority 🔥', tasks: [] },
  doing: { id: 'doing', title: 'Medium Priority ⚠️', tasks: [] },
  done: { id: 'done', title: 'Low Priority ✅', tasks: [] },
  completed: { id: 'completed', title: 'Completed 🎉', tasks: [] },
};

const InteractiveTodo: React.FC = () => {
  const [columns, setColumns] = useState(fullViewData);
  const [newTask, setNewTask] = useState('');
  const [targetColumn, setTargetColumn] = useState<'todo' | 'doing' | 'done'>('todo');
  const [taskIdCounter, setTaskIdCounter] = useState(1);

  // Edit modal state
  const [modalTask, setModalTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalPriority, setModalPriority] = useState<'todo' | 'doing' | 'done'>('todo');

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const newObj: Task = { id: `task-${taskIdCounter}`, content: newTask };
    setColumns(prev => ({
      ...prev,
      [targetColumn]: { ...prev[targetColumn], tasks: [...prev[targetColumn].tasks, newObj] },
    }));
    setTaskIdCounter(prev => prev + 1);
    setNewTask('');
  };

  const handleDelete = (colId: string, taskId: string) => {
    setColumns(prev => ({
      ...prev,
      [colId]: { ...prev[colId], tasks: prev[colId].tasks.filter(t => t.id !== taskId) },
    }));
  };

  const handleComplete = (colId: string, task: Task) => {
    setColumns(prev => {
      // remove from original column
      const updatedSource = prev[colId].tasks.filter(t => t.id !== task.id);
      // append to completed
      return {
        ...prev,
        [colId]: { ...prev[colId], tasks: updatedSource },
        completed: { ...prev.completed, tasks: [...prev.completed.tasks, task] },
      };
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    const fromKey = source.droppableId;
    const toKey = destination.droppableId;
    const fromTasks = [...columns[fromKey].tasks];
    const toTasks = fromKey === toKey ? fromTasks : [...columns[toKey].tasks];
    const [moved] = fromTasks.splice(source.index, 1);
    toTasks.splice(destination.index, 0, moved);

    setColumns(prev => ({
      ...prev,
      [fromKey]: { ...prev[fromKey], tasks: fromTasks },
      [toKey]: { ...prev[toKey], tasks: toTasks },
    }));
  };

  const openEditModal = (task: Task, columnId: string) => {
    setModalTask({ task, columnId });
    setModalName(task.content);
    setModalPriority(columnId as 'todo' | 'doing' | 'done');
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
            tasks: prev[columnId].tasks.map(t => (t.id === task.id ? updatedTask : t)),
          },
        };
      }
      return {
        ...prev,
        [columnId]: { ...prev[columnId], tasks: prev[columnId].tasks.filter(t => t.id !== task.id) },
        [modalPriority]: { ...prev[modalPriority], tasks: [...prev[modalPriority].tasks, updatedTask] },
      };
    });
    closeModal();
  };

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
        <div className="flex gap-4 px-4">
          {Object.entries(columns).map(([colId, col]) => (
            <Droppable droppableId={colId} key={colId}>
              {provided => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-white border rounded p-4 w-64"
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
                            <button
                              onClick={() => handleComplete(colId, t)}
                              className="text-green-500 font-bold"
                            >
                              ✔
                            </button>
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
        <div className="fixed inset-0 backdrop-filter backdrop-blur-lg flex items-center justify-center">
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