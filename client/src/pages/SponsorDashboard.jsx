import React, { useEffect, useState, useCallback } from 'react';
import {
  getSponsorProfile,
  updateSponsorProfile,
  getDeliverablesBySponsor,
  updateDeliverableStatus,
  uploadBrandAsset,
  getBrandAssetsBySponsor
} from '../services/modulesService';
import { getAnnouncementsByEvent } from '../services/eventService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import Modal from '../components/Modal';
import {
  Briefcase, CheckSquare, Upload, Save, Globe, CheckCircle,
  Clock, AlertCircle, Building2, Mail, Link, Image, FileText, Award, Megaphone
} from 'lucide-react';

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

const ASSET_TYPES = ['Logo', 'Banner', 'Promotional Document', 'Brand Guidelines', 'Social Media Kit', 'Other'];

const deliverableStatusColor = (status) => {
  if (status === 'Approved' || status === 'Completed') return { bg: 'rgba(16, 185, 129, 0.12)', text: '#6ee7b7' };
  if (status === 'Submitted') return { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' };
  if (status === 'Rejected') return { bg: 'rgba(239, 68, 68, 0.12)', text: '#fca5a5' };
  if (status === 'In Progress') return { bg: 'rgba(245, 158, 11, 0.12)', text: '#fcd34d' };
  return { bg: 'rgba(100, 116, 139, 0.12)', text: '#94a3b8' };
};

const SponsorDashboard = ({ initialTab }) => {
  const [profile, setProfile] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [assets, setAssets] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'Deliverables');
  const [announcements, setAnnouncements] = useState([]);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    companyName: '', contactName: '', contactEmail: '', description: '', logoUrl: '', website: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Asset modal
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({ title: '', fileUrl: '', assetType: 'Logo' });
  const [uploadingAsset, setUploadingAsset] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pRes = await getSponsorProfile();
      const prof = pRes.data;
      setProfile(prof);

      if (prof) {
        setProfileForm({
          companyName: prof.companyName || '',
          contactName: prof.contactName || '',
          contactEmail: prof.contactEmail || '',
          description: prof.description || '',
          logoUrl: prof.logoUrl || '',
          website: prof.website || ''
        });
        const [dRes, aRes] = await Promise.all([
          getDeliverablesBySponsor(prof._id),
          getBrandAssetsBySponsor(prof._id)
        ]);
        setDeliverables(dRes.data || []);
        setAssets(aRes.data || []);

        // Fetch announcements from all events this sponsor is involved in
        const eventIds = [...new Set((dRes.data || []).map(d => d.event?._id || d.event).filter(Boolean).map(e => e.toString()))];
        if (eventIds.length > 0) {
          const annLists = await Promise.all(eventIds.map(eid => getAnnouncementsByEvent(eid).catch(() => null)));
          const allAnns = [];
          annLists.forEach(r => (r?.data || []).forEach(a => allAnns.push(a)));
          allAnns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setAnnouncements(allAnns);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load Sponsor Portal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Keep deep-linked tabs (sidebar) in sync when navigating between /sponsor/* routes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeliverableStatus = async (id, status) => {
    try {
      await updateDeliverableStatus(id, { status });
      const res = await getDeliverablesBySponsor(profile._id);
      setDeliverables(res.data || []);
      showSuccess(`Deliverable marked as "${status}".`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update deliverable.');
    }
  };

  const handleUploadAsset = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setUploadingAsset(true);
    try {
      await uploadBrandAsset({ sponsor: profile._id, ...assetForm });
      setAssetModalOpen(false);
      setAssetForm({ title: '', fileUrl: '', assetType: 'Logo' });
      const res = await getBrandAssetsBySponsor(profile._id);
      setAssets(res.data || []);
      showSuccess('Brand asset uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Asset upload failed.');
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    try {
      await updateSponsorProfile(profile._id, profileForm);
      await fetchData();
      showSuccess('Sponsor profile updated!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Sponsor Portal..." />;

  const completedCount = deliverables.filter(d => d.status === 'Approved' || d.status === 'Completed').length;
  const pendingCount = deliverables.filter(d => d.status === 'Pending' || d.status === 'In Progress').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Award style={{ width: '26px', height: '26px', color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>Sponsor Portal</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            {profile?.companyName
              ? `${profile.companyName} — Sponsorship Management`
              : 'Manage your deliverables, brand assets, and company profile'}
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

      {/* No profile notice */}
      {!profile && (
        <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
          <AlertCircle style={{ width: '40px', height: '40px', margin: '0 auto 12px', color: '#f59e0b' }} />
          <h3 style={{ color: '#e2e8f0', fontWeight: 700 }}>Sponsor Profile Not Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', maxWidth: '400px', margin: '8px auto 0' }}>
            Your account hasn't been linked to a Sponsor profile yet. Please contact the Event Organizer.
          </p>
        </div>
      )}

      {/* Stats row (only if profile exists) */}
      {profile && deliverables.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Total Deliverables', value: deliverables.length, color: '#06b6d4' },
            { label: 'Completed', value: completedCount, color: '#10b981' },
            { label: 'Pending', value: pendingCount, color: '#f59e0b' },
            { label: 'Brand Assets', value: assets.length, color: '#8b5cf6' }
          ].map(stat => (
            <div key={stat.label} className="glass-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Bar */}
      {profile && (
        <>
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {['Deliverables', 'Packages', 'Brand Assets', 'Announcements', 'Sponsor Profile'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: activeTab === tab ? '#fff' : '#64748b',
                  borderBottom: activeTab === tab ? '2px solid #06b6d4' : '2px solid transparent',
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

          {/* ═══ TAB: DELIVERABLES ══════════════════════════════════════════════ */}
          {activeTab === 'Deliverables' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {deliverables.length === 0 ? (
                <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
                  <CheckSquare style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#334155' }} />
                  <h3 style={{ color: '#e2e8f0', fontWeight: 700 }}>No Deliverables Assigned</h3>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
                    The organizer hasn't assigned any package deliverables yet.
                  </p>
                </div>
              ) : (
                deliverables.map(d => {
                  const colors = deliverableStatusColor(d.status);
                  return (
                    <div key={d._id} className="glass-panel" style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              backgroundColor: colors.bg, color: colors.text,
                              padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 700
                            }}>{d.status}</span>
                            {d.event?.name && (
                              <span style={{ fontSize: '12px', color: '#818cf8' }}>• {d.event.name}</span>
                            )}
                            {d.package?.name && (
                              <span style={{ fontSize: '12px', color: '#06b6d4' }}>• {d.package.name}</span>
                            )}
                          </div>
                          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{d.name}</h3>
                          {d.description && (
                            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>{d.description}</p>
                          )}
                          {d.dueDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                              <Clock style={{ width: '13px', height: '13px' }} />
                              Due: {new Date(d.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          {d.status === 'Pending' && (
                            <button
                              onClick={() => handleDeliverableStatus(d._id, 'In Progress')}
                              style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'rgba(245,158,11,0.15)', color: '#fcd34d', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer' }}
                            >
                              Mark In Progress
                            </button>
                          )}
                          {(d.status === 'Pending' || d.status === 'In Progress') && (
                            <button
                              onClick={() => handleDeliverableStatus(d._id, 'Submitted')}
                              style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#06b6d4', color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                            >
                              Submit Deliverable
                            </button>
                          )}
                          {d.status === 'Rejected' && (
                            <button
                              onClick={() => handleDeliverableStatus(d._id, 'Submitted')}
                              style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}
                            >
                              Resubmit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ═══ TAB: BRAND ASSETS ══════════════════════════════════════════════ */}
          {/* ═══ TAB: PACKAGES ═══════════════════════════════════════════════ */}
          {activeTab === 'Packages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                const seen = new Map();
                (deliverables || []).forEach((d) => {
                  const p = d.package;
                  if (p && p._id && !seen.has(p._id.toString())) seen.set(p._id.toString(), p);
                });
                const pkgs = [...seen.values()];
                if (pkgs.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>No package assigned yet</p>
                      <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Your organizer will assign a sponsorship package (Platinum, Gold, Silver). Compare benefits with your organizer directly.</p>
                    </div>
                  );
                }
                return pkgs.map((p) => (
                  <div key={p._id} className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{p.name}</h4>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>${p.price}</span>
                    </div>
                    {(p.benefits || []).length > 0 && (
                      <ul style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '10px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {p.benefits.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ));
              })()}
            </div>
          )}

          {activeTab === 'Brand Assets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setAssetModalOpen(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    backgroundColor: '#06b6d4', color: '#fff',
                    padding: '10px 18px', borderRadius: '8px', border: 'none',
                    fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  <Upload style={{ width: '16px', height: '16px' }} /> Upload Brand Asset
                </button>
              </div>
              {assets.length === 0 ? (
                <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
                  <Image style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#334155' }} />
                  <h3 style={{ color: '#e2e8f0', fontWeight: 700 }}>No Brand Assets Uploaded</h3>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
                    Upload your company logo, banners, and brand guidelines here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {assets.map(a => (
                    <div key={a._id} className="glass-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          backgroundColor: 'rgba(6, 182, 212, 0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <FileText style={{ width: '18px', height: '18px', color: '#67e8f9' }} />
                        </div>
                        <div>
                          <span style={{
                            backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9',
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600
                          }}>{a.assetType}</span>
                        </div>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{a.title}</h4>
                      <a
                        href={a.fileUrl} target="_blank" rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '12px', color: '#818cf8', textDecoration: 'none', fontWeight: 500
                        }}
                      >
                        <Link style={{ width: '12px', height: '12px' }} /> View Asset ↗
                      </a>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
                        Uploaded {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: ANNOUNCEMENTS ══════════════════════════════════════════════ */}
          {activeTab === 'Announcements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <Megaphone style={{ width: '20px', height: '20px', color: '#06b6d4' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>Event Announcements</h3>
              </div>
              {announcements.length === 0 ? (
                <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
                  <Megaphone style={{ width: '44px', height: '44px', margin: '0 auto 14px', color: '#334155' }} />
                  <h3 style={{ color: '#e2e8f0', fontWeight: 700 }}>No Announcements Yet</h3>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>Event updates from organizers will appear here.</p>
                </div>
              ) : (
                announcements.map(a => (
                  <div key={a._id} className="glass-card" style={{ padding: '18px 20px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{a.title}</div>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>{a.message}</p>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '10px', display: 'flex', gap: '12px' }}>
                      <span>{a.event?.name}</span>
                      <span>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ TAB: SPONSOR PROFILE ═══════════════════════════════════════════ */}
          {activeTab === 'Sponsor Profile' && (
            <div className="glass-panel" style={{ padding: '32px', maxWidth: '680px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 style={{ width: '18px', height: '18px', color: '#06b6d4' }} /> Company Profile
              </h3>
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={labelStyle}>Company Name *</label>
                  <input
                    type="text" required value={profileForm.companyName}
                    onChange={e => setProfileForm({ ...profileForm, companyName: e.target.value })}
                    style={inputStyle} placeholder="Acme Corporation"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Contact Person</label>
                    <input
                      type="text" value={profileForm.contactName}
                      onChange={e => setProfileForm({ ...profileForm, contactName: e.target.value })}
                      style={inputStyle} placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Email</label>
                    <input
                      type="email" value={profileForm.contactEmail}
                      onChange={e => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                      style={inputStyle} placeholder="sponsor@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Company Website</label>
                  <input
                    type="url" value={profileForm.website}
                    onChange={e => setProfileForm({ ...profileForm, website: e.target.value })}
                    style={inputStyle} placeholder="https://www.company.com"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Logo URL</label>
                  <input
                    type="url" value={profileForm.logoUrl}
                    onChange={e => setProfileForm({ ...profileForm, logoUrl: e.target.value })}
                    style={inputStyle} placeholder="https://cdn.company.com/logo.png"
                  />
                  {profileForm.logoUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <img
                        src={profileForm.logoUrl} alt="Company logo preview"
                        onError={e => { e.target.style.display = 'none'; }}
                        style={{ height: '48px', objectFit: 'contain', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px' }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Company Description</label>
                  <textarea
                    rows={4} value={profileForm.description}
                    onChange={e => setProfileForm({ ...profileForm, description: e.target.value })}
                    placeholder="Brief description of your company and what you do…"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>
                <button
                  type="submit" disabled={savingProfile}
                  style={{
                    padding: '12px', borderRadius: '8px',
                    background: savingProfile ? 'rgba(6, 182, 212, 0.5)' : '#06b6d4',
                    color: '#fff', fontWeight: 700, border: 'none',
                    cursor: savingProfile ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Save style={{ width: '16px', height: '16px' }} />
                  {savingProfile ? 'Saving...' : 'Save Company Profile'}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* ═══ UPLOAD ASSET MODAL ══════════════════════════════════════════════════ */}
      <Modal isOpen={assetModalOpen} onClose={() => setAssetModalOpen(false)} title="Upload Brand Asset">
        <form onSubmit={handleUploadAsset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Asset Title *</label>
            <input
              type="text" required value={assetForm.title}
              placeholder="High-Res Company Logo (PNG)"
              onChange={e => setAssetForm({ ...assetForm, title: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Asset Category</label>
            <select
              value={assetForm.assetType}
              onChange={e => setAssetForm({ ...assetForm, assetType: e.target.value })}
              style={{ ...inputStyle, backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
            >
              {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>File URL *</label>
            <input
              type="url" required value={assetForm.fileUrl}
              placeholder="https://cdn.company.com/assets/logo.png"
              onChange={e => setAssetForm({ ...assetForm, fileUrl: e.target.value })}
              style={inputStyle}
            />
            <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
              Upload to a CDN, Google Drive, or Dropbox and paste the public link here.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button" onClick={() => setAssetModalOpen(false)}
              style={{ padding: '9px 18px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={uploadingAsset}
              style={{
                padding: '9px 18px', borderRadius: '8px', backgroundColor: '#06b6d4',
                color: '#fff', fontWeight: 600, border: 'none',
                cursor: uploadingAsset ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Upload style={{ width: '15px', height: '15px' }} />
              {uploadingAsset ? 'Uploading…' : 'Upload Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SponsorDashboard;
