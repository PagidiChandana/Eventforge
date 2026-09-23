import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { askEventForgeGuide } from '../services/aiService';
import {
  Bot,
  X,
  Send,
  Sparkles,
  HelpCircle,
  UserCheck,
  Calendar,
  Ticket,
  Shield,
  Briefcase,
  Mic2,
  ChevronRight,
  BookOpen
} from 'lucide-react';

/**
 * ForgeBot — 3D Interactive AI Guide Assistant
 * Floating assistant widget providing interactive website guidance, role walkthroughs,
 * and automated platform Q&A.
 */
const QUICK_FAQS = [
  {
    q: 'How do staff check in attendees?',
    a: '1. Navigate to Staff Operations → Attendee Support.\n2. Select your assigned ongoing event.\n3. Search attendee by Name, Email, or Ticket Code (e.g., EF-LIVE-XXXX).\n4. Click [Check In] to verify ticket entry.'
  },
  {
    q: 'Why is Check-In disabled or locked?',
    a: 'Staff can only check in attendees when the event is currently ONGOING. If the event has not started yet (Upcoming) or has passed (Ended), check-in is automatically locked for security.'
  },
  {
    q: 'How do I create a new event as an Organizer?',
    a: '1. Go to Organizer → Create Event.\n2. Fill in the title, category, and capacity.\n3. Select Start Date & Time and End Date & Time using the dark datetime picker.\n4. Click "Generate with AI" for automatic description drafting!'
  },
  {
    q: 'Where do Attendees find their Ticket & QR Code?',
    a: '1. Go to Attendee Dashboard → My Tickets.\n2. Click "View Pass" on your registered event to open your digital ticket & QR token.'
  }
];

function getOfflineAnswer(question, role) {
  const q = question.toLowerCase();
  if (/\b(help|what can you do|how do i use|getting started)\b/.test(q)) {
    return `I can guide you around EventForge. You are signed in as ${role || 'a user'}. Ask about your dashboard, events, tickets, sessions, check-in, profile, or another feature and I’ll walk you through it.`;
  }
  if (/\b(ticket|qr|register|registration|tier|payment|pass)\b/.test(q)) {
    return 'Attendees: open Events, choose an event, select an available ticket tier, and complete registration. Check My Registrations for status and My Tickets for issued passes and QR codes. If a tier is unavailable or registration fails, check the event dates and remaining capacity, then contact the organizer.';
  }
  if (/\b(check.?in|scan|camera|scanner|attendance)\b/.test(q)) {
    return 'Staff: open Check-in for event tickets or Session Attendance for a session roster. Choose an assigned event/session, allow camera access, and scan the QR code; if scanning is unavailable, use the manual ticket code/search option. Camera scanning requires browser permission and a secure page (HTTPS or localhost). Check-in is limited to authorized staff and active events.';
  }
  if (/\b(session|schedule|speaker|availability|slides|materials)\b/.test(q)) {
    if (/speaker|slides|materials|availability/.test(q)) return 'Speakers: open Speaker Hub or My Sessions to see sessions assigned to you. Use Availability to update your schedule and Presentation Materials to share files. If an assignment is missing, ask the event organizer to assign your speaker profile to the session.';
    return 'Organizers can open an event from My Events and manage its sessions from the event workspace. Attendees can find selected sessions in My Schedule, while speakers can see assigned talks under Speaker Hub or My Sessions.';
  }
  if (/\b(event|organizer|create|publish|staff|venue|coupon|sponsor)\b/.test(q)) {
    return 'Organizers: open Create Event to start an event, or My Events to manage one. Open the event workspace to add sessions, speakers, venues, ticket tiers, staff, sponsors, announcements, and registrations. If you cannot see an action, confirm you are using an organizer account and have opened the correct event.';
  }
  if (/\b(profile|password|account|email|name)\b/.test(q)) {
    return 'Open My Profile from the account menu to review your profile details. For sign-in or password problems, use the sign-in page’s recovery option. Account permissions and role changes may need an organizer or platform administrator.';
  }
  if (/\b(error|not working|cannot|can't|unable|failed|missing|problem)\b/.test(q)) {
    return 'I can help troubleshoot. Please include the page you are on, what you clicked, and the exact error message. For access issues, confirm you are signed into the right account and that your role is assigned to the event.';
  }
  return 'I can help with EventForge navigation and workflows, including events, ticket registration, QR check-in, sessions, speaker assignments, materials, and account access. Tell me your role and what you are trying to do, and I’ll give you steps. The live guide is temporarily unavailable, so this reply uses the built-in help guide.';
}

export default function ForgeBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'guide' | 'chat'
  const [userQuery, setUserQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! How can I help you?`
    }
  ]);
  const [showTooltip, setShowTooltip] = useState(true);

  const handleSendQuery = async (customText) => {
    const textToSend = customText || userQuery;
    if (!textToSend.trim() || isThinking) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setUserQuery('');
    setIsThinking(true);
    try {
      const history = chatMessages.slice(-8).map(({ sender, text }) => ({ sender, text }));
      const response = await askEventForgeGuide(textToSend.trim(), history);
      const answer = response?.data?.answer;
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('The guide returned an empty answer.');
      setChatMessages((prev) => [...prev, { sender: 'bot', text: answer.trim() }]);
    } catch {
      setChatMessages((prev) => [...prev, { sender: 'bot', text: getOfflineAnswer(textToSend.trim(), user?.role) }]);
    } finally {
      setIsThinking(false);
    }
  };
  return (
    <>
      {/* 3D FLOATING BOT WIDGET TRIGGER */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9990,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px'
        }}
      >
        {/* Speech Bubble Tooltip */}
        {showTooltip && !isOpen && (
          <div
            onClick={() => {
              setIsOpen(true);
              setShowTooltip(false);
            }}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(99, 102, 241, 0.5)',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              maxWidth: '240px',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <Sparkles style={{ width: '16px', height: '16px', color: '#818cf8' }} />
            <span>Need help using EventForge? Ask ForgeBot!</span>
            <X
              style={{ width: '14px', height: '14px', color: '#64748b', cursor: 'pointer', marginLeft: 'auto' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
            />
          </div>
        )}

        {/* 3D Glowing Bot Sphere Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open EventForge AI Assistant"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 50%, #a855f7 100%)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: isOpen
              ? '0 0 0 4px rgba(99, 102, 241, 0.4), 0 12px 30px rgba(0, 0, 0, 0.6)'
              : '0 0 20px rgba(99, 102, 241, 0.6), 0 10px 25px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
            transform: isOpen ? 'scale(0.95)' : 'scale(1)',
            outline: 'none'
          }}
        >
          {isOpen ? (
            <X style={{ width: '28px', height: '28px' }} />
          ) : (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot style={{ width: '30px', height: '30px' }} />
              {/* Glowing Bot Eyes / Visor Effect */}
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#34d399',
                  borderRadius: '50%',
                  border: '2px solid #0f172a'
                }}
              />
            </div>
          )}
        </button>
      </div>

      {/* 3D BOT ASSISTANT DRAWER / MODAL */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: '560px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.25)',
            zIndex: 9991,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8), rgba(15, 23, 42, 0.9))',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}
              >
                <Bot style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  ForgeBot Guide
                </h3>
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399' }} /> Online Platform Assistant
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(15, 23, 42, 0.6)'
            }}
          >
            <button
              onClick={() => setActiveTab('guide')}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'guide' ? '#38bdf8' : '#94a3b8',
                borderBottom: activeTab === 'guide' ? '2px solid #38bdf8' : 'none',
                fontWeight: activeTab === 'guide' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <BookOpen style={{ width: '14px', height: '14px' }} /> Role Guides
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'chat' ? '#38bdf8' : '#94a3b8',
                borderBottom: activeTab === 'chat' ? '2px solid #38bdf8' : 'none',
                fontWeight: activeTab === 'chat' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles style={{ width: '14px', height: '14px' }} /> Ask Assistant
            </button>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeTab === 'guide' && (
              <>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Frequently Asked Questions
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {QUICK_FAQS.map((faq, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveTab('chat');
                        handleSendQuery(faq.q);
                      }}
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>{faq.q}</span>
                      <ChevronRight style={{ width: '16px', height: '16px', color: '#6366f1' }} />
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Platform Role Quick Overview
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '10px', borderRadius: '8px', color: '#a5b4fc' }}>
                      <strong style={{ display: 'block', color: '#fff', marginBottom: '2px' }}>👮 Staff</strong>
                      Gate QR verification, Attendee support lookup during ongoing events.
                    </div>
                    <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '10px', borderRadius: '8px', color: '#6ee7b7' }}>
                      <strong style={{ display: 'block', color: '#fff', marginBottom: '2px' }}>🎟️ Attendee</strong>
                      Browse catalog, register passes, QR tickets & session schedules.
                    </div>
                    <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '10px', borderRadius: '8px', color: '#d8b4fe' }}>
                      <strong style={{ display: 'block', color: '#fff', marginBottom: '2px' }}>🏢 Organizer</strong>
                      Create events, set dates/times, AI descriptions & staff shifts.
                    </div>
                    <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '8px', color: '#fde047' }}>
                      <strong style={{ display: 'block', color: '#fff', marginBottom: '2px' }}>🎤 Speaker</strong>
                      View speaking sessions, venue rooms & attendee stats.
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '260px' }}>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.sender === 'user' ? '#6366f1' : 'rgba(30, 41, 59, 0.8)',
                        color: '#fff',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        maxWidth: '85%',
                        fontSize: '13px',
                        lineHeight: '1.45',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isThinking && (
                    <div role="status" style={{ alignSelf: 'flex-start', color: '#94a3b8', fontSize: '13px' }}>
                      ForgeBot is checking the EventForge guide...
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isThinking && handleSendQuery()}
                    disabled={isThinking}
                    placeholder="Ask a question about using EventForge…"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => handleSendQuery()}
                    disabled={isThinking}
                    style={{
                      backgroundColor: '#6366f1',
                      border: 'none',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      cursor: isThinking ? 'wait' : 'pointer',
                      opacity: isThinking ? 0.65 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Send style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
