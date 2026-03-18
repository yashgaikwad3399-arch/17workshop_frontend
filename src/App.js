import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: '#e53e3e', bg: '#fff5f5' },
  medium: { label: 'Medium', color: '#d69e2e', bg: '#fffff0' },
  low:    { label: 'Low',    color: '#38a169', bg: '#f0fff4' },
};

// ── Small reusable components ──────────────────────────────────────────────

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className="priority-badge" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
      {cfg.label}
    </span>
  );
}

function StatsBar({ tasks }) {
  const total     = tasks.length;
  const done      = tasks.filter(t => t.completed).length;
  const remaining = total - done;
  const pct       = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="stats-bar">
      <div className="stats-numbers">
        <span className="stat"><strong>{total}</strong> total</span>
        <span className="stat done-stat"><strong>{done}</strong> done</span>
        <span className="stat"><strong>{remaining}</strong> remaining</span>
        <span className="stat pct-stat"><strong>{pct}%</strong> have you  finished the work</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [tasks,    setTasks]    = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [filter,   setFilter]   = useState('all');   // all | active | completed
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [adding,   setAdding]   = useState(false);

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/tasks`);
      setTasks(res.data);
      setError('');
    } catch (err) {
      setError('Cannot reach backend. Is the server running on port 5000?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Add a new task
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await axios.post(`${API}/api/tasks`, { title: newTitle, priority });
      setTasks(prev => [...prev, res.data]);
      setNewTitle('');
      setPriority('medium');
    } catch {
      setError('Failed to add task.');
    } finally {
      setAdding(false);
    }
  };

  // Toggle complete / incomplete
  const handleToggle = async (id) => {
    try {
      const res = await axios.put(`${API}/api/tasks/${id}`);
      setTasks(prev => prev.map(t => t.id === id ? res.data : t));
    } catch {
      setError('Failed to update task.');
    }
  };

  // Delete one task
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/api/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      setError('Failed to delete task.');
    }
  };

  // Clear all completed tasks
  const handleClearCompleted = async () => {
    try {
      await axios.delete(`${API}/api/tasks`);
      setTasks(prev => prev.filter(t => !t.completed));
    } catch {
      setError('Failed to clear tasks.');
    }
  };

  // Filter display
  const visible = tasks.filter(t => {
    if (filter === 'active')    return !t.completed;
    if (filter === 'completed') return  t.completed;
    return true;
  });

  const hasCompleted = tasks.some(t => t.completed);

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner" />
        <p>Connecting to backend…</p>
      </div>
    );
  }

  return (
    <div className="page">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div>
            <h1 className="app-title">Task Manager</h1>
            <p className="app-subtitle">
              MERN Stack &nbsp;·&nbsp; Dockerized &nbsp;·&nbsp; No MongoDB
            </p>
          </div>
          <div className="docker-badge">🐳 Docker Ready</div>
        </div>
      </header>

      <main className="main">

        {/* ── Error banner ── */}
        {error && (
          <div className="error-banner" role="alert">
            ⚠ {error}
            <button onClick={() => setError('')} className="dismiss-btn">✕</button>
          </div>
        )}

        {/* ── Stats ── */}
        <StatsBar tasks={tasks} />

        {/* ── Add task form ── */}
        <section className="card add-card">
          <h2 className="card-title">Add New Task</h2>
          <form onSubmit={handleAdd} className="add-form">
            <input
              className="task-input"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              disabled={adding}
            />
            <select
              className="priority-select"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              disabled={adding}
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <button type="submit" className="btn btn-primary" disabled={adding || !newTitle.trim()}>
              {adding ? 'Adding…' : '+ Add Task'}
            </button>
          </form>
        </section>

        {/* ── Filter tabs ── */}
        <div className="filter-row">
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="filter-count">
                {f === 'all'       ? tasks.length                      :
                 f === 'active'    ? tasks.filter(t => !t.completed).length :
                                    tasks.filter(t =>  t.completed).length}
              </span>
            </button>
          ))}
          {hasCompleted && (
            <button className="filter-btn clear-btn" onClick={handleClearCompleted}>
              Clear completed
            </button>
          )}
        </div>

        {/* ── Task list ── */}
        <section className="card task-card">
          {visible.length === 0 ? (
            <div className="empty-state">
              {filter === 'completed' ? '🎉 No completed tasks yet!' :
               filter === 'active'    ? '✅ All tasks are done!'     :
                                        '📝 No tasks yet — add one above!'}
            </div>
          ) : (
            <ul className="task-list">
              {visible.map(task => (
                <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>

                  {/* Checkbox */}
                  <button
                    className={`checkbox ${task.completed ? 'checked' : ''}`}
                    onClick={() => handleToggle(task.id)}
                    aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.completed && <span className="checkmark">✓</span>}
                  </button>

                  {/* Task info */}
                  <div className="task-info">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta">
                      <PriorityBadge priority={task.priority} />
                      <span className="task-date">
                        {new Date(task.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(task.id)}
                    aria-label="Delete task"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── API info box (educational) ── */}
        <section className="card api-card">
          <h2 className="card-title">Live API Endpoints</h2>
          <p className="api-note">Your Express backend exposes these routes at <code>http://localhost:5000</code></p>
          <table className="api-table">
            <thead>
              <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><span className="method get">GET</span></td>   <td>/api/tasks</td>         <td>Fetch all tasks</td></tr>
              <tr><td><span className="method get">GET</span></td>   <td>/api/tasks/:id</td>     <td>Fetch one task by ID</td></tr>
              <tr><td><span className="method post">POST</span></td>  <td>/api/tasks</td>         <td>Create a new task</td></tr>
              <tr><td><span className="method put">PUT</span></td>   <td>/api/tasks/:id</td>     <td>Toggle complete / update</td></tr>
              <tr><td><span className="method del">DELETE</span></td><td>/api/tasks/:id</td>     <td>Delete one task</td></tr>
              <tr><td><span className="method del">DELETE</span></td><td>/api/tasks</td>         <td>Clear all completed tasks</td></tr>
              <tr><td><span className="method get">GET</span></td>   <td>/api/health</td>        <td>Backend health check</td></tr>
            </tbody>
          </table>
        </section>

      </main>

      <footer className="app-footer">
        Data stored in <code>backend/src/data/tasks.json</code> · No MongoDB required · Ready to Dockerize 🐳
      </footer>
    </div>
  );
}
