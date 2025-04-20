export interface TaskRecord {
    id: number;
    content: string;
    column: 'todo'|'doing'|'done'|'completed';
  }
  
  const API = 'http://localhost:3001/tasks';
  
  export const TaskService = {
    getAll:    () => fetch(API).then(r => r.json() as Promise<TaskRecord[]>),
    create:   (content: string, column: TaskRecord['column']) =>
                  fetch(API, {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({content, column})
                  }).then(r => r.json()),
    update:   (id: number, data: Partial<Omit<TaskRecord,'id'>>) =>
                  fetch(`${API}/${id}`, {
                    method: 'PATCH',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify(data)
                  }).then(r => r.json()),
    remove:   (id: number) =>
                  fetch(`${API}/${id}`, { method: 'DELETE' })
  };
  