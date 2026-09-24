import React, { useEffect, useState } from 'react';
import { getMyStaffShifts, getMyTasks, updateTaskStatus } from '../services/operationsService';
import { getMyAnalytics } from '../services/analyticsService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import EmptyState from '../components/EmptyState';
import { Link } from 'react-router-dom';
import { Shield, Calendar, MapPin, Camera, Clock, UserCheck, CheckCircle2, ListTodo } from 'lucide-react';

const StaffDashboard = () => {
  const [shifts, setShifts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [shiftRes, taskRes, analyticsRes] = await Promise.all([
          getMyStaffShifts(),
          getMyTasks(),
          getMyAnalytics()
        ]);
        setShifts(shiftRes.data || []);
        setTasks(taskRes || []);
        setAnalytics(analyticsRes.data || null);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await updateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: res.status } : t));
    } catch (err) {
      setError(err.message || 'Error updating task');
    }
  };

  if (loading) return <LoadingSpinner message="Loading your assigned staff shifts..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>Staff Operations Control</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Event shifts, gate check-in tools, and session attendance coordination
          </p>
        </div>

        <Link
          to="/staff/check-in"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#06b6d4',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none'
          }}
        >
          <Camera style={{ width: '18px', height: '18px' }} />
          Open Gate QR Scanner
        </Link>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        {[
          ['Assigned events', analytics?.totalEvents],
          ['Active assignments', analytics?.activeAssignments],
          ['Attendee check-ins', analytics?.checkIns],
          ['Session check-ins', analytics?.sessionCheckIns],
          ['Tasks completed', analytics?.tasks?.Completed]
        ].map(([label, value]) => <div key={label} className="glass-card" style={{ padding: '17px' }}><div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div><div style={{ color: '#fff', fontSize: '25px', fontWeight: 800, marginTop: '5px' }}>{value || 0}</div></div>)}
      </div>

      {shifts.length === 0 ? (
        <EmptyState
          title="No Active Staff Shifts"
          message="You currently have no active event staff assignments."
          icon={Shield}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {shifts.map(shift => (
            <div key={shift._id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    {shift.role}
                  </span>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    {shift.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  {shift.event?.name}
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '16px' }}>
                  Responsibility: {shift.responsibilities || 'Gate Verification & Attendance'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                <div><MapPin style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px', color: '#06b6d4' }} /> Venue: {shift.assignedVenue?.name || 'Main Hall'}</div>
                <div><Clock style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px', color: '#6366f1' }} /> Shift: {new Date(shift.shiftStart).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TASKS SECTION */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListTodo style={{ width: '20px', height: '20px', color: '#10b981' }} />
          My Assigned Tasks
        </h2>
        {tasks.length === 0 ? (
          <EmptyState title="No Tasks" message="You have no tasks assigned at the moment." icon={ListTodo} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.map(task => (
              <div key={task._id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', opacity: task.status === 'Completed' ? 0.6 : 1 }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: task.status === 'Completed' ? '#94a3b8' : '#fff', textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>
                    {task.title}
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 8px 0' }}>{task.description}</p>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>Event: {task.event?.name}</span>
                    <span style={{ backgroundColor: task.priority === 'High' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', color: task.priority === 'High' ? '#ef4444' : '#94a3b8', padding: '2px 8px', borderRadius: '4px' }}>Priority: {task.priority}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: task.status === 'Completed' ? '#10b981' : task.status === 'In Progress' ? '#f59e0b' : '#94a3b8' }}>
                    {task.status}
                  </span>
                  {task.status !== 'Completed' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {task.status === 'Pending' && (
                        <button onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          Start
                        </button>
                      )}
                      <button onClick={() => handleUpdateTaskStatus(task._id, 'Completed')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 style={{ width: '14px', height: '14px' }} /> Mark Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
