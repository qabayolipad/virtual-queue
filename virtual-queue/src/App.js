// Main React App Structure
// Pages: Home (/), Admin (/admin)
// Uses Supabase as the backend

// 1. Install necessary packages:
// npm install @supabase/supabase-js react-router-dom

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xqixmejllmvlswfydbiz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXhtZWpsbG12bHN3ZnlkYml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTk1NzgsImV4cCI6MjA2MzQ5NTU3OH0.9eE8_Cn_bUZX6VzR-SXMbqeq-bzLoJC9SIuyD7iB6o8'
);

function Home() {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [service, setService] = useState('guidance');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check limit
    const { count } = await supabase
      .from('queues')
      .select('*', { count: 'exact', head: true })
      .eq('service', service)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (count >= 15) {
      setStatus('Queue full for this hour. Please try later.');
      return;
    }

    const { error } = await supabase.from('queues').insert([
      { name, student_id: studentId, service, status: 'waiting' },
    ]);

    setStatus(error ? 'Error joining queue' : 'Successfully joined the queue');
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">UDM Virtual Queue</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full p-2 border rounded" required />
        <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student ID" className="w-full p-2 border rounded" required />
        <select value={service} onChange={e => setService(e.target.value)} className="w-full p-2 border rounded">
          <option value="guidance">Guidance</option>
          <option value="registrar">Registrar</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Join Queue</button>
      </form>
      <p className="mt-4 text-green-600">{status}</p>
    </div>
  );
}

function Admin() {
  const [queue, setQueue] = useState([]);

  const fetchQueue = async () => {
    const { data } = await supabase
      .from('queues')
      .select('*')
      .in('status', ['waiting', 'serving'])
      .order('created_at', { ascending: true });
    setQueue(data);
  };

  const updateStatus = async (id, newStatus) => {
    await supabase.from('queues').update({ status: newStatus }).eq('id', id);
    fetchQueue();
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Admin Panel</h1>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Name</th><th>ID</th><th>Service</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((q) => (
            <tr key={q.id} className="text-center border-t">
              <td>{q.name}</td>
              <td>{q.student_id}</td>
              <td>{q.service}</td>
              <td>{q.status}</td>
              <td className="space-x-2">
                <button onClick={() => updateStatus(q.id, 'serving')} className="bg-yellow-300 px-2 rounded">Serve</button>
                <button onClick={() => updateStatus(q.id, 'done')} className="bg-green-400 px-2 rounded">Done</button>
                <button onClick={() => updateStatus(q.id, 'absent')} className="bg-red-400 px-2 rounded">Absent</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <nav className="bg-gray-100 p-4 text-center space-x-4">
        <Link to="/">Home</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
