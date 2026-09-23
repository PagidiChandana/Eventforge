import React, { useEffect, useState, useCallback } from 'react';
import {
  getSpeakerProfile,
  updateSpeakerProfile,
  getSpeakerSessions,
  getSpeakerFeedback,
  uploadPresentationMaterial,
  downloadPresentationMaterial,
  getMaterialsBySession
} from '../services/modulesService';
import { getAnnouncementsByEvent } from '../services/eventService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import Modal from '../components/Modal';
import {
  User, Calendar, FileText, Upload, Save, Clock, MapPin,
  CheckCircle, Mic2, Globe, Linkedin, Twitter, BookOpen, Star, AlertCircle
} from 'lucide-react';

// ─── Reusable styled input ────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box'
};

const labelStyle = { fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px', display: 'block' };

const MATERIAL_TYPES = ['PDF', 'PowerPoint', 'Keynote', 'Video', 'Link', 'Other'];

const SpeakerDashboard = ({ initialTab }) => {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'Sessions');
  const [feedback, setFeedback] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [availNote, setAvailNote] = useState('');
  const [unavailableDates, setUnavailableDates] = useState('');
  const [savingAvail, setSavingAvail] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '', designation: '', company: '', bio: '', expertise: '',
    contactEmail: '',
    socialLinks: { linkedin: '', twitter: '', website: '' }
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Material upload state
  const [selectedSession, setSelectedSession] = useState(null);
  const [materialForm, setMaterialForm] = useState({ fileName: '', fileUrl: '', fileType: 'PDF', file: null });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [sessionMaterials, setSessionMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, sRes] = await Promise.all([getSpeakerProfile(), getSpeakerSessions()]);
      const prof = pRes.data;
      setProfile(prof);
      if (prof) {
        setAvailNote(prof.availability?.note || '');
        setUnavailableDates((prof.availability?.unavailableDates || []).map((d) => new Date(d).toISOString().slice(0, 10)).join(', '));
        setProfileForm({
          name: prof.name || '',
          designation: prof.designation || '',
          company: prof.company || '',
          bio: prof.bio || '',
          expertise: prof.expertise ? prof.expertise.join(', ') : '',
          contactEmail: prof.contactEmail || '',
          socialLinks: {
            linkedin: prof.socialLinks?.linkedin || '',
            twitter: prof.socialLinks?.twitter || '',
            website: prof.socialLinks?.website || ''
          }
        });
      }
      const sessList = sRes.data || [];
      setSessions(sessList);

      // Secondary hub data (non-blocking): feedback, materials, announcements
      try {
        const [fbRes, annLists, matLists] = await Promise.all([
          getSpeakerFeedback().catch(() => null),
          Promise.all(
            [...new Set(sessList.map((s) => s.event?._id || s.event).filter(Boolean))].map((eid) =>
              getAnnouncementsByEvent(eid).catch(() => null)
            )
          ),
          Promise.all(sessList.map((s) => getMaterialsBySession(s._id).catch(() => null)))
        ]);
        if (fbRes) setFeedback(fbRes.data || []);
        const anns = [];
        (annLists || []).forEach((r) => (r?.data || []).forEach((a) => anns.push(a)));
        anns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAnnouncements(anns);
        const mats = [];
        (matLists || []).forEach((r) => (r?.data || []).forEach((m) => mats.push(m)));
        setAllMaterials(mats);
      } catch {
        // Non-blocking enrichment
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load Speaker Hub.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    try {
      const payload = {
        ...profileForm,
        expertise: profileForm.expertise
          ? profileForm.expertise.split(',').map(x => x.trim()).filter(Boolean)
          : []
      };
      await updateSpeakerProfile(profile._id, payload);
      setSuccess('Profile updated successfully!');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenUpload = async (session) => {
    setSelectedSession(session);
    setMaterialForm({ fileName: '', fileUrl: '', fileType: 'PDF', file: null });
    setUploadModalOpen(true);
    setSessionMaterials([]);
    setLoadingMaterials(true);
    try {
      const res = await getMaterialsBySession(session._id);
      setSessionMaterials(res.data || []);
    } catch {
      // Non-blocking
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadingMaterial(true);
    try {
      const response = await uploadPresentationMaterial({
        session: selectedSession._id,
        fileName: materialForm.fileName,
        fileUrl: materialForm.fileUrl,
        fileType: materialForm.fileType,
        file: materialForm.file
      });
      setAllMaterials((prev) => [...prev, { ...response.data, session: selectedSession }]);
      setSuccess('Presentation material submitted successfully!');
      setUploadModalOpen(false);
      setMaterialForm({ fileName: '', fileUrl: '', fileType: 'PDF', file: null });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed.');
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleMaterialDownload = async (material) => {
    try {
      const blob = await downloadPresentationMaterial(material.fileId);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = material.fileName || 'presentation-material';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      setError(err.message || 'Could not download this presentation material.');
    }
  };

  const tabs = ['Sessions', 'Speaker Profile', 'Social & Bio', 'Availability', 'Materials', 'Announcements', 'Feedback'];

  // Keep deep-linked tabs (sidebar) in sync when navigating between /speaker/* routes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    setSavingAvail(true);
    setError(null);
    try {
      const dates = unavailableDates.split(',').map((s) => s.trim()).filter(Boolean);
      await updateSpeakerProfile(profile._id, {
        availability: { note: availNote, unavailableDates: dates }
      });
      setSuccess('Availability updated — organizers can now see your conflicts.');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save availability.');
    } finally {
      setSavingAvail(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Speaker Hub..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Mic2 style={{ width: '26px', height: '26px', color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>Speaker Hub</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            {profile?.name ? `Welcome, ${profile.name}` : 'Manage your sessions, materials, and speaker profile'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && <AlertError message={error} onClose={() => setError(null)} />}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px', color: '#6ee7b7', fontSize: '14px'
        }}>
          <CheckCircle style={{ width: '18px', height: '18px' }} />
          {success}
        </div>
      )}

      {/* Stats row */}
      {sessions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Assigned Sessions', value: sessions.length, color: '#6366f1' },
            { label: 'Upcoming', value: sessions.filter(s => new Date(s.startTime) > new Date()).length, color: '#06b6d4' },
            { label: 'Expertise Areas', value: profile?.expertise?.length || 0, color: '#8b5cf6' }
          ].map(stat => (
            <div key={stat.label} className="glass-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === tab ? '#fff' : '#64748b',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══ TAB: SESSIONS ══════════════════════════════════════════════════════ */}
      {activeTab === 'Sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sessions.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
              <Calendar style={{ width: '48px', height: '48px', margin: '0 auto 16px auto', color: '#334155' }} />
              <h3 style={{ color: '#e2e8f0', fontWeight: 700 }}>No Assigned Sessions Yet</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
                The organizer hasn't assigned you to any sessions yet. Check back later.
              </p>
            </div>
          ) : (
            sessions.map(s => (
              <div key={s._id} className="glass-panel" style={{ padding: '22px 26px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {s.sessionType}
                      </span>
                      <span style={{ fontSize: '11px', color: '#818cf8' }}>• {s.event?.name}</span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>{s.title}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '13px', color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock style={{ width: '14px', height: '14px', color: '#6366f1' }} />
                        {new Date(s.startTime).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      {s.roomName && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
                          {s.roomName}
                        </span>
                      )}
                      {s.speakers?.length > 1 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <User style={{ width: '14px', height: '14px', color: '#8b5cf6' }} />
                          {s.speakers.length} Speakers
                        </span>
                      )}
                    </div>
                    {s.description && (
                      <p style={{ color: '#64748b', fontSize: '13px', marginTop: '10px', lineHeight: 1.5 }}>
                        {s.description.length > 160 ? s.description.slice(0, 160) + '…' : s.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenUpload(s)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      backgroundColor: '#6366f1', color: '#fff',
                      padding: '10px 18px', borderRadius: '8px', border: 'none',
                      fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                      whiteSpace: 'nowrap', flexShrink: 0
                    }}
                  >
                    <Upload style={{ width: '15px', height: '15px' }} />
                    Upload Deck
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ TAB: SPEAKER PROFILE ═══════════════════════════════════════════════ */}
      {activeTab === 'Speaker Profile' && (
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '680px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User style={{ width: '18px', height: '18px', color: '#6366f1' }} /> Edit Speaker Profile
          </h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text" required value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Job Title / Designation</label>
                <input
                  type="text" value={profileForm.designation}
                  onChange={e => setProfileForm({ ...profileForm, designation: e.target.value })}
                  style={inputStyle} placeholder="e.g. CTO, Senior Architect"
                />
              </div>
              <div>
                <label style={labelStyle}>Company / Organization</label>
                <input
                  type="text" value={profileForm.company}
                  onChange={e => setProfileForm({ ...profileForm, company: e.target.value })}
                  style={inputStyle} placeholder="e.g. Acme Corp"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Contact Email</label>
              <input
                type="email" value={profileForm.contactEmail}
                onChange={e => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                style={inputStyle} placeholder="speaker@company.com"
              />
            </div>
            <div>
              <label style={labelStyle}>Areas of Expertise <span style={{ color: '#64748b' }}>(comma-separated)</span></label>
              <input
                type="text" value={profileForm.expertise}
                onChange={e => setProfileForm({ ...profileForm, expertise: e.target.value })}
                style={inputStyle} placeholder="e.g. Cloud Architecture, DevOps, AI/ML"
              />
              {profileForm.expertise && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {profileForm.expertise.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8',
                      padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                    }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit" disabled={savingProfile}
              style={{
                padding: '12px', borderRadius: '8px',
                background: savingProfile ? 'rgba(99, 102, 241, 0.5)' : '#6366f1',
                color: '#fff', fontWeight: 700, border: 'none', cursor: savingProfile ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Save style={{ width: '16px', height: '16px' }} />
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* ═══ TAB: SOCIAL & BIO ══════════════════════════════════════════════════ */}
      {activeTab === 'Social & Bio' && (
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '680px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen style={{ width: '18px', height: '18px', color: '#8b5cf6' }} /> Biography & Social Links
          </h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={labelStyle}>Speaker Biography</label>
              <textarea
                rows={6}
                value={profileForm.bio}
                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="Share your professional background, notable achievements, and speaking experience..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                {profileForm.bio.length} characters
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Social Links</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Linkedin style={{ width: '18px', height: '18px', color: '#0077b5', flexShrink: 0 }} />
                <input
                  type="url" value={profileForm.socialLinks.linkedin} placeholder="https://linkedin.com/in/yourprofile"
                  onChange={e => setProfileForm({ ...profileForm, socialLinks: { ...profileForm.socialLinks, linkedin: e.target.value } })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Twitter style={{ width: '18px', height: '18px', color: '#1da1f2', flexShrink: 0 }} />
                <input
                  type="url" value={profileForm.socialLinks.twitter} placeholder="https://twitter.com/yourhandle"
                  onChange={e => setProfileForm({ ...profileForm, socialLinks: { ...profileForm.socialLinks, twitter: e.target.value } })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe style={{ width: '18px', height: '18px', color: '#06b6d4', flexShrink: 0 }} />
                <input
                  type="url" value={profileForm.socialLinks.website} placeholder="https://yourwebsite.com"
                  onChange={e => setProfileForm({ ...profileForm, socialLinks: { ...profileForm.socialLinks, website: e.target.value } })}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit" disabled={savingProfile}
              style={{
                padding: '12px', borderRadius: '8px',
                background: savingProfile ? 'rgba(139, 92, 246, 0.5)' : '#8b5cf6',
                color: '#fff', fontWeight: 700, border: 'none', cursor: savingProfile ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Save style={{ width: '16px', height: '16px' }} />
              {savingProfile ? 'Saving...' : 'Save Bio & Social Links'}
            </button>
          </form>
        </div>
      )}

      {/* ═══ UPLOAD MATERIAL MODAL ═══════════════════════════════════════════════ */}
      {/* ═══ TAB: AVAILABILITY ═════════════════════════════════════════════════ */}
      {activeTab === 'Availability' && (
        <div className="glass-panel" style={{ padding: '28px', maxWidth: '640px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock style={{ width: '18px', height: '18px', color: '#06b6d4' }} /> My Availability
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
            Tell organizers when you are unavailable so they avoid scheduling conflicts.
          </p>
          <form onSubmit={handleSaveAvailability} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Availability Note</label>
              <textarea value={availNote} onChange={(e) => setAvailNote(e.target.value)} rows={3} placeholder="e.g., Available weekday mornings; prefer virtual sessions on Fridays…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Unavailable Dates <span style={{ color: '#64748b' }}>(YYYY-MM-DD, comma-separated)</span></label>
              <input type="text" value={unavailableDates} onChange={(e) => setUnavailableDates(e.target.value)} placeholder="2026-11-02, 2026-11-03" style={inputStyle} />
            </div>
            <button type="submit" disabled={savingAvail} style={{ padding: '12px', borderRadius: '8px', background: '#06b6d4', color: '#fff', fontWeight: 700, border: 'none', cursor: savingAvail ? 'not-allowed' : 'pointer', opacity: savingAvail ? 0.7 : 1 }}>
              {savingAvail ? 'Saving…' : 'Save Availability'}
            </button>
          </form>
          {sessions.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>Assigned Sessions</h4>
              {sessions.map((s) => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#cbd5e1', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>{s.title}</span>
                  <span style={{ color: '#94a3b8' }}>{s.startTime ? new Date(s.startTime).toLocaleString() : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: MATERIALS ═══════════════════════════════════════════════════ */}
      {activeTab === 'Materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {allMaterials.length === 0 ? (
            <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>No presentation materials yet</p>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Open a session below to upload decks, PDFs, or links.</p>
            </div>
          ) : (
            allMaterials.map((m) => (
              <div key={m._id} className="glass-card" style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{m.fileName}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{m.fileType} · {m.session?.title || 'Session material'}</div>
                </div>
                {m.fileId ? (
                  <button type="button" onClick={() => handleMaterialDownload(m)} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Download</button>
                ) : m.fileUrl ? (
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600 }}>Open link</a>
                ) : null}
              </div>
            ))
          )}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>Upload to a session</h4>
            {sessions.map((s) => (
              <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '13px', color: '#cbd5e1' }}>
                <span>{s.title}</span>
                <button onClick={() => handleOpenUpload(s)} style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  Upload
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB: ANNOUNCEMENTS ═══════════════════════════════════════════════ */}
      {activeTab === 'Announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.length === 0 ? (
            <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>No announcements</p>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Event updates for your sessions will appear here.</p>
            </div>
          ) : (
            announcements.map((a) => (
              <div key={a._id} className="glass-card" style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{a.title}</div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px', lineHeight: 1.5 }}>{a.message}</p>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ TAB: FEEDBACK ════════════════════════════════════════════════════ */}
      {activeTab === 'Feedback' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {feedback.length === 0 ? (
            <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>No session feedback yet</p>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Attendee ratings and comments for your sessions will appear here.</p>
            </div>
          ) : (
            feedback.map((f) => (
              <div key={f._id} className="glass-card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{f.sessionTitle || 'Session'}</span>
                  <span style={{ color: '#fbbf24', fontSize: '14px' }}>{'★'.repeat(f.rating || 0)}{'☆'.repeat(5 - (f.rating || 0))}</span>
                </div>
                {f.comment && <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '8px', fontStyle: 'italic' }}>"{f.comment}"</p>}
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                  {f.attendee?.name || 'Attendee'}{f.event?.name ? ` · ${f.event.name}` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={uploadModalOpen}
        onClose={() => { setUploadModalOpen(false); setSelectedSession(null); setSessionMaterials([]); }}
        title={`Upload Presentation — ${selectedSession?.title || ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Existing materials for this session */}
          {loadingMaterials ? (
            <p style={{ color: '#64748b', fontSize: '13px' }}>Loading existing materials…</p>
          ) : sessionMaterials.length > 0 ? (
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', padding: '12px 16px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>
                EXISTING MATERIALS ({sessionMaterials.length})
              </p>
              {sessionMaterials.map(m => (
                <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{m.fileName}</span>
                  <span style={{
                    backgroundColor: m.status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: m.status === 'Approved' ? '#6ee7b7' : '#fcd34d',
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px'
                  }}>{m.status}</span>
                </div>
              ))}
            </div>
          ) : null}

          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Document Name *</label>
              <input
                type="text" required value={materialForm.fileName}
                placeholder="Q4_Keynote_Slides_v2.pdf"
                onChange={e => setMaterialForm({ ...materialForm, fileName: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>File Type</label>
              <select
                value={materialForm.fileType}
                onChange={e => setMaterialForm({ ...materialForm, fileType: e.target.value, file: null, fileUrl: '' })}
                style={{ ...inputStyle, backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
              >
                {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {materialForm.fileType === 'Link' ? (
              <div>
                <label style={labelStyle}>Material URL *</label>
                <input type="url" required value={materialForm.fileUrl} placeholder="https://example.com/material" onChange={e => setMaterialForm({ ...materialForm, fileUrl: e.target.value })} style={inputStyle} />
              </div>
            ) : (
              <div>
                <label style={labelStyle}>Choose file *</label>
                <input
                  type="file"
                  required
                  accept={materialForm.fileType === 'PDF' ? '.pdf,application/pdf' : materialForm.fileType === 'PowerPoint' ? '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation' : materialForm.fileType === 'Keynote' ? '.key' : materialForm.fileType === 'Video' ? 'video/*' : undefined}
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 25 * 1024 * 1024) {
                      setError('Files must be 25 MB or smaller.');
                      e.target.value = '';
                      return;
                    }
                    setMaterialForm(prev => ({ ...prev, file, fileName: file?.name || prev.fileName }));
                  }}
                  style={{ ...inputStyle, padding: '12px', cursor: 'pointer' }}
                />
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '5px' }}>
                  Upload directly to EventForge. Maximum file size: 25 MB.
                  {materialForm.file?.name ? ` Selected: ${materialForm.file.name}` : ''}
                </p>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => { setUploadModalOpen(false); setSelectedSession(null); }}
                style={{ padding: '9px 18px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={uploadingMaterial}
                style={{
                  padding: '9px 18px', borderRadius: '8px', backgroundColor: '#6366f1',
                  color: '#fff', fontWeight: 600, border: 'none',
                  cursor: uploadingMaterial ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Upload style={{ width: '15px', height: '15px' }} />
                {uploadingMaterial ? 'Submitting…' : 'Submit Material'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default SpeakerDashboard;
