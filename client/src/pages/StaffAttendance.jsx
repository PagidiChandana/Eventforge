import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { getMyStaffShifts, getSessionAttendanceStats, markSessionAttendance, markSessionAttendanceByQR, searchAttendeeForSupport } from '../services/operationsService';
import { getSessionsByEvent } from '../services/eventService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { UserCheck, Search, QrCode, Camera } from 'lucide-react';

// Staff → Session Attendance: pick assigned event → session → find attendee → mark present.
export default function StaffAttendance() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [eventId, setEventId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [marking, setMarking] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const scanBusyRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyStaffShifts();
        const list = res.data || [];
        setShifts(list);
        const firstEvent = list[0]?.event?._id || list[0]?.event;
        if (firstEvent) setEventId(firstEvent.toString());
      } catch (err) {
        setError(err.message || 'Failed to load shifts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!eventId) return;
    getSessionsByEvent(eventId)
      .then((res) => {
        setSessions(res.data || []);
        setSessionId('');
        setStats(null);
      })
      .catch((err) => setError(err.message || 'Failed to load sessions'));
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !sessionId) { setStats(null); return; }
    getSessionAttendanceStats(eventId, sessionId)
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, [eventId, sessionId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || !eventId) return;
    setSearching(true);
    setError(null);
    try {
      const res = await searchAttendeeForSupport(eventId, query.trim());
      setResults(res.data || []);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleMark = async (attendeeId) => {
    if (!sessionId) {
      setError('Select a session first.');
      return;
    }
    setMarking(true);
    setError(null);
    try {
      await markSessionAttendance(eventId, sessionId, attendeeId);
      setSuccess('Attendance recorded.');
      const res = await getSessionAttendanceStats(eventId, sessionId).catch(() => null);
      if (res) setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const handleQRValue = async (rawValue) => {
    if (!eventId || !sessionId) {
      setError('Select an event and session before scanning QR.');
      return;
    }
    const value = rawValue?.trim();
    if (!value || scanBusyRef.current) return;
    scanBusyRef.current = true;
    setMarking(true);
    setError(null);
    setSuccess(null);
    try {
      let qrToken = value;
      let legacyAttendeeId = null;
      try {
        const parsed = JSON.parse(value);
        qrToken = parsed.qrToken || parsed.token || parsed.ticketNumber || parsed.ticketCode || value;
        legacyAttendeeId = parsed.attendeeId || parsed.userId || null;
      } catch { /* Ticket QR passes contain a plain token. */ }

      if (legacyAttendeeId) {
        await markSessionAttendance(eventId, sessionId, legacyAttendeeId);
      } else {
        await markSessionAttendanceByQR(eventId, sessionId, qrToken);
      }
      setSuccess('Session attendance recorded from ticket QR.');
      setQrInput('');
      const res = await getSessionAttendanceStats(eventId, sessionId).catch(() => null);
      if (res) setStats(res.data);
    } catch (err) {
      setError(err.message || 'Could not record attendance from this QR code.');
    } finally {
      setMarking(false);
      scanBusyRef.current = false;
    }
  };

  const startCamera = async () => {
    setCameraError('');
    if (!window.isSecureContext) {
      setCameraError('Camera access requires HTTPS or localhost. Open EventForge securely, then try again.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not provide camera access. Enter the ticket QR token below.');
      return;
    }
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' } } });
      } catch (err) {
        if (err.name !== 'OverconstrainedError' && err.name !== 'NotFoundError') throw err;
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      }
      streamRef.current = stream;
      const reader = readerRef.current || new BrowserMultiFormatReader();
      readerRef.current = reader;
      setCameraActive(true);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (!videoRef.current) throw new Error('Scanner video is unavailable.');
      controlsRef.current = await reader.decodeFromStream(stream, videoRef.current, async (result) => {
        if (!result || scanBusyRef.current) return;
        const value = result.getText().trim();
        if (!value) return;
        stopCamera();
        await handleQRValue(value);
      });
    } catch (err) {
      stopCamera();
      const messages = {
        NotAllowedError: 'Camera permission was denied. Allow camera access for this site in your browser settings.',
        NotFoundError: 'No camera was found on this device. Enter the ticket QR token below.',
        NotReadableError: 'The camera is busy in another app. Close other apps using it and try again.',
        SecurityError: 'Camera access is blocked. Open EventForge over HTTPS or localhost.'
      };
      setCameraError(messages[err.name] || `Could not start the camera${err.message ? `: ${err.message}` : '.'}`);
    }
  };

  useEffect(() => () => {
    controlsRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const handleQRSubmit = async (e) => {
    e.preventDefault();
    if (!sessionId) {
      setError('Select a session first before scanning QR.');
      return;
    }
    if (!qrInput.trim()) return;
    
    await handleQRValue(qrInput);
  };

  if (loading) return <LoadingSpinner message="Loading attendance tools..." />;

  const eventIds = [...new Map(shifts.map((s) => [(s.event?._id || s.event)?.toString?.(), s.event])).values()];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCheck style={{ width: '24px', height: '24px', color: '#34d399' }} /> Session Attendance
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Record attendance for your assigned sessions.</p>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}
      {success && (
        <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <select value={eventId} disabled={cameraActive} onChange={(e) => setEventId(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid rgba(99,102,241,0.35)', color: '#fff', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flex: 1, minWidth: '200px' }}>
          <option value="">Select event…</option>
          {eventIds.map((ev) => <option key={ev?._id || ev} value={ev?._id || ev}>{ev?.name || 'Event'}</option>)}
        </select>
        <select value={sessionId} disabled={cameraActive} onChange={(e) => setSessionId(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', cursor: 'pointer', flex: 1, minWidth: '200px' }}>
          <option value="">Select session…</option>
          {sessions.map((s) => <option key={s._id} value={s._id}>{s.title} · {s.roomName}</option>)}
        </select>
      </div>

      {stats && (
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Present</div><div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399' }}>{stats.totalAttended ?? stats.attendedCount ?? stats.total ?? 0}</div></div>
          <div><div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Capacity</div><div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{stats.capacity ?? '—'}</div></div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* QR SCANNER */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode style={{ width: '16px', height: '16px', color: '#06b6d4' }} /> Scan Attendee QR
            </h2>
            {cameraActive ? (
              <div style={{ marginBottom: '12px' }}>
                <video ref={videoRef} muted playsInline style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '10px', background: '#020617' }} />
                <button type="button" onClick={stopCamera} style={{ marginTop: '8px', padding: '9px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.2)', background: '#1e293b', color: '#fff', cursor: 'pointer' }}>Stop camera</button>
              </div>
            ) : (
              <button type="button" onClick={startCamera} disabled={!sessionId || marking} style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '9px', border: 'none', background: '#0e7490', color: '#fff', fontWeight: 700, cursor: !sessionId || marking ? 'not-allowed' : 'pointer', opacity: !sessionId ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={17} /> Scan with camera
              </button>
            )}
            {cameraError && <p role="status" style={{ color: '#fbbf24', fontSize: '13px', marginBottom: '10px' }}>{cameraError}</p>}
            <form onSubmit={handleQRSubmit} style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <QrCode style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                <input 
                  value={qrInput} 
                  onChange={(e) => setQrInput(e.target.value)} 
                  placeholder="Enter or scan ticket QR token..." 
                  style={{ width: '100%', padding: '10px 12px 10px 38px', backgroundColor: 'rgba(15,23,42,0.7)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} 
                  disabled={!sessionId}
                  autoFocus
                />
              </div>
              <button type="submit" disabled={marking || !sessionId} style={{ backgroundColor: '#06b6d4', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: marking || !sessionId ? 'not-allowed' : 'pointer' }}>
                {marking ? 'Checking...' : 'Submit'}
              </button>
            </form>
          </div>

          {/* MANUAL SEARCH */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search style={{ width: '16px', height: '16px', color: '#6366f1' }} /> Manual Search
            </h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…" style={{ width: '100%', padding: '10px 12px 10px 38px', backgroundColor: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={searching} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: searching ? 'not-allowed' : 'pointer' }}>
            {searching ? '…' : 'Search'}
          </button>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
          {results.map((r) => (
            <div key={r._id || r.attendee?._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}>
              <span style={{ color: '#fff', fontWeight: 600 }}>{r.attendee?.name || r.name} <span style={{ color: '#64748b', fontWeight: 400 }}>· {r.attendee?.email || r.email}</span></span>
              <button onClick={() => handleMark(r.attendee?._id || r.attendee)} disabled={marking || !sessionId} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: marking || !sessionId ? 'not-allowed' : 'pointer', opacity: !sessionId ? 0.5 : 1 }}>
                Mark Present
              </button>
            </div>
          ))}
          {results.length === 0 && query && !searching && <p style={{ fontSize: '13px', color: '#64748b' }}>No attendees found.</p>}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
