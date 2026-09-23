import React, { useEffect, useRef, useState } from 'react';
import { getMyStaffShifts, processQRCheckIn } from '../services/operationsService';
import { BrowserQRCodeReader } from '@zxing/browser';
import AlertError from '../components/AlertError';
import { QrCode, CheckCircle2, ArrowLeft, Camera, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QRScanner = () => {
  const [shifts, setShifts] = useState([]);
  const [eventId, setEventId] = useState('');
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [tokenInput, setTokenInput] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const submittingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    getMyStaffShifts()
      .then((res) => {
        if (!active) return;
        const assignedShifts = (res.data || []).filter((shift) => shift.event?._id || shift.event);
        setShifts(assignedShifts);
        const currentShift = assignedShifts.find((shift) => shift.event?.status === 'Ongoing') || assignedShifts[0];
        const firstEvent = currentShift?.event?._id || currentShift?.event;
        if (firstEvent) setEventId(firstEvent.toString());
      })
      .catch((err) => active && setError(err.message || 'Could not load your assigned events.'))
      .finally(() => active && setLoadingShifts(false));
    return () => { active = false; };
  }, []);

  const verifyToken = async (rawToken) => {
    const value = rawToken?.trim();
    if (!value || submittingRef.current) return;
    if (!eventId) {
      setError('Select one of your assigned events before scanning a ticket.');
      return;
    }

    const payload = { qrToken: value };
    try {
      const parsed = JSON.parse(value);
      const tokenOrCode = parsed.qrToken || parsed.token || parsed.ticketCode || parsed.ticketNumber;
      if (tokenOrCode) payload.qrToken = tokenOrCode;
      payload.ticketId = parsed.ticketId || parsed._id;
    } catch {
      try {
        const url = new URL(value);
        const tokenOrCode = url.searchParams.get('qrToken') || url.searchParams.get('token') || url.searchParams.get('ticketCode') || url.searchParams.get('ticketNumber');
        if (tokenOrCode) payload.qrToken = tokenOrCode;
        payload.ticketId = url.searchParams.get('ticketId') || (/\/tickets\/([a-f\d]{24})/i.exec(url.pathname)?.[1] ?? undefined);
      } catch { /* The QR payload is a plain token or ticket number. */ }
    }
    submittingRef.current = true;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await processQRCheckIn(payload.qrToken, eventId, payload.ticketId, payload.ticketCode);
      setResult(res.data);
      setTokenInput('');
    } catch (err) {
      setError(err.message || 'QR Verification failed.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    verifyToken(tokenInput);
  };

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
      setCameraError('');
      if (!eventId) {
        setCameraError('Select one of your assigned events before starting the scanner.');
        return;
      }
    if (!window.isSecureContext) {
      setCameraError('Camera access requires HTTPS or localhost. Open EventForge using a secure address, then try again.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not provide camera access. Update your browser or enter the ticket code below.');
      return;
    }
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (cameraError) {
        if (cameraError.name !== 'OverconstrainedError' && cameraError.name !== 'NotFoundError') throw cameraError;
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      }
      streamRef.current = stream;
      const reader = readerRef.current || new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 80,
        delayBetweenScanSuccess: 500,
        tryPlayVideoTimeout: 10000
      });
      readerRef.current = reader;
      setCameraActive(true);
      if (!videoRef.current) throw new Error('Scanner video is unavailable.');
      controlsRef.current = await reader.decodeFromStream(
        stream,
        videoRef.current,
        async (result) => {
          if (!result || submittingRef.current) return;
          const value = result.getText().trim();
          if (!value) return;
          stopCamera();
          setTokenInput(value);
          await verifyToken(value);
        }
      );
    } catch (err) {
      stopCamera();
      const messages = {
        NotAllowedError: 'Camera permission was denied. Allow camera access for this site in your browser settings, then try again.',
        NotFoundError: 'No camera was found on this device. Connect a camera or enter the ticket code below.',
        NotReadableError: 'The camera is busy in another app. Close other apps using it and try again.',
        SecurityError: 'Camera access is blocked by browser security. Open EventForge over HTTPS or localhost.',
        AbortError: 'The camera stopped before it could start. Try again.'
      };
      setCameraError(messages[err.name] || `Could not start the camera${err.message ? `: ${err.message}` : '.'} Check browser camera permissions and try again.`);
    }
  };

  useEffect(() => () => {
    controlsRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const eventChoices = [...new Map(shifts.map((shift) => {
    const event = shift.event;
    const id = (event?._id || event)?.toString?.();
    return [id, event];
  }).filter(([id]) => id)).values()];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}
      >
        <ArrowLeft style={{ width: '16px', height: '16px' }} />
        Back to Dashboard
      </button>

      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          color: '#06b6d4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <Camera style={{ width: '32px', height: '32px' }} />
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
          Event Gate QR Scanner
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
          Scan attendee digital pass or enter ticket QR token for check-in verification
        </p>

        <div style={{ marginBottom: '18px', textAlign: 'left' }}>
          <label htmlFor="check-in-event" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>Event to check in</label>
          <select
            id="check-in-event"
            value={eventId}
            disabled={cameraActive || loadingShifts}
            onChange={(e) => { setEventId(e.target.value); setError(null); setResult(null); }}
            style={{ width: '100%', padding: '11px 12px', background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,.14)', borderRadius: '9px' }}
          >
            <option value="">{loadingShifts ? 'Loading assigned events…' : 'Select an assigned event'}</option>
            {eventChoices.map((event) => {
              const assignedEventId = event?._id || event;
              return <option key={assignedEventId.toString()} value={assignedEventId}>{event?.name || 'Assigned event'}{event?.status === 'Ongoing' ? ' (Live)' : ''}</option>;
            })}
          </select>
          {!loadingShifts && shifts.length === 0 && <p style={{ color: '#fbbf24', fontSize: '12px', marginTop: '7px' }}>No event shifts are assigned to your staff account.</p>}
        </div>

        <div style={{ marginBottom: '18px' }}>
          <video ref={videoRef} muted playsInline autoPlay style={{ display: cameraActive ? 'block' : 'none', width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '12px', background: '#020617', transform: 'scaleX(-1)' }} />
          {cameraActive ? (
            <>
              <button type="button" onClick={stopCamera} style={{ marginTop: '10px', padding: '10px 16px', borderRadius: '9px', border: '1px solid rgba(255,255,255,.2)', background: '#1e293b', color: '#fff', cursor: 'pointer' }}>Stop camera</button>
            </>
          ) : (
            <button type="button" onClick={startCamera} disabled={!eventId || loadingShifts} style={{ padding: '11px 16px', borderRadius: '9px', border: 'none', background: '#0e7490', color: '#fff', fontWeight: 700, cursor: !eventId || loadingShifts ? 'not-allowed' : 'pointer', opacity: !eventId || loadingShifts ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} /> Scan with camera
            </button>
          )}
          {cameraError && <p role="status" style={{ color: '#fbbf24', fontSize: '13px', marginTop: '10px' }}>{cameraError}</p>}
        </div>

        {error && <AlertError message={error} onClose={() => setError(null)} />}

        {result && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'left',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6ee7b7', fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>
              <CheckCircle2 style={{ width: '24px', height: '24px' }} />
              CHECK-IN APPROVED
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', color: '#cbd5e1' }}>
              <div>Attendee Name: <strong style={{ color: '#fff' }}>{result.attendee?.name}</strong></div>
              <div>Ticket Number: <strong style={{ color: '#06b6d4' }}>{result.ticketNumber}</strong></div>
              <div>Event: <strong style={{ color: '#fff' }}>{result.event?.name}</strong></div>
              <div>Tier: <strong style={{ color: '#818cf8' }}>{result.ticketCategory?.name}</strong></div>
              <div>Checked In At: <strong style={{ color: '#fff' }}>{new Date(result.checkedInAt).toLocaleTimeString()}</strong></div>
            </div>
          </div>
        )}

        <form onSubmit={handleScanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <QrCode style={{ position: 'absolute', left: '14px', color: '#64748b', width: '20px', height: '20px' }} />
            <input
              type="text"
              required
              placeholder="Paste or scan a ticket QR token or ticket number..."
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              disabled={!eventId || loading}
              style={{
                width: '100%',
                padding: '14px 14px 14px 44px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !eventId}
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: '#06b6d4',
              border: 'none',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading || !eventId ? 'not-allowed' : 'pointer',
              opacity: loading || !eventId ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <UserCheck style={{ width: '18px', height: '18px' }} />
            {loading ? 'Verifying Token...' : 'Execute Check-in Verification'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QRScanner;
