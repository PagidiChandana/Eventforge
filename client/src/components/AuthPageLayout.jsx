import React from 'react';
import { Zap, CalendarDays, Ticket, Users } from 'lucide-react';
import '../styles/auth.css';

export default function AuthPageLayout({ eyebrow, title, description, children, footer }) {
  return (
    <div className="auth-page animate-fade-in">
      <aside className="auth-intro">
        <div className="auth-brand">
          <span className="auth-brand-mark"><Zap aria-hidden="true" /></span>
          <span>Event<span>Forge</span></span>
        </div>
        <div className="auth-intro-copy">
          <div className="auth-eyebrow"><span /> {eyebrow}</div>
          <h2>Make every event<br /><span>feel effortless.</span></h2>
          <p>One place to discover events, manage programs, and bring people together.</p>
        </div>
        <div className="auth-feature-list">
          <div><CalendarDays /><span><strong>Plan with clarity</strong><small>Sessions, speakers, and teams in sync.</small></span></div>
          <div><Ticket /><span><strong>Make entry seamless</strong><small>Registration and digital tickets, together.</small></span></div>
          <div><Users /><span><strong>Keep everyone connected</strong><small>One workspace for every event role.</small></span></div>
        </div>
        <div className="auth-intro-foot">A simpler way to run events from start to finish.</div>
      </aside>

      <main className="auth-main">
        <section className="auth-card">
          <div className="auth-card-heading">
            <div className="auth-eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {children}
        </section>
        {footer && <div className="auth-footer">{footer}</div>}
      </main>
    </div>
  );
}
