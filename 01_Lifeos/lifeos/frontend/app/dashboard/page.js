'use client';

import { useState, useEffect } from 'react';
import '../globals.css';
import { checkAuthStatus, getGoogleAuthUrl, runAutonomous } from '../../lib/api';
import EmailIntelPanel from '../components/EmailIntelPanel';
import CalendarPanel from '../components/CalendarPanel';
import ReplyDraftPanel from '../components/ReplyDraftPanel';
import ExecutionFeed from '../components/ExecutionFeed';
import SettingsModal from '../components/SettingsModal';

export default function Dashboard() {
    const [authenticated, setAuthenticated] = useState(null); // null = loading
    const [showSettings, setShowSettings] = useState(false);

    // Shared state lifted from panels
    const [emailData, setEmailData] = useState({ emails: [], analyses: [], drafts: [] });

    // Autonomous mode state
    const [isRunning, setIsRunning] = useState(false);
    const [execSteps, setExecSteps] = useState([]);
    const [execSummary, setExecSummary] = useState(null);
    const [pipelineHandle, setPipelineHandle] = useState(null);

    // Check auth on mount
    useEffect(() => {
        checkAuthStatus().then((result) => {
            setAuthenticated(result?.data?.authenticated === true);
        }).catch(() => setAuthenticated(false));
    }, []);

    function handleAnalysesUpdate({ emails, analyses }) {
        setEmailData((prev) => ({ ...prev, emails, analyses }));
    }

    async function handleRunAutonomous(dryRun) {
        if (isRunning) return;
        setIsRunning(true);
        setExecSteps([]);
        setExecSummary(null);

        const handle = runAutonomous(
            dryRun,
            (msg) => {
                setExecSteps((prev) => [...prev, msg]);
            },
            (summary) => {
                setExecSummary(summary);
                setIsRunning(false);
                // Propagate results to panels
                if (summary) {
                    setEmailData({
                        emails: summary.emails || [],
                        analyses: summary.analyses || [],
                        drafts: summary.drafts || [],
                    });
                }
            },
            (errMsg) => {
                setExecSteps((prev) => [...prev, `✗ Error: ${errMsg}`]);
                setIsRunning(false);
            }
        );
        setPipelineHandle(handle);
    }

    // ── Loading state ─────────────────────────────────────────────────────────
    if (authenticated === null) {
        return (
            <div className="auth-screen">
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
            </div>
        );
    }

    // ── Unauthenticated ───────────────────────────────────────────────────────
    if (!authenticated) {
        return (
            <div className="auth-screen">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div className="logo-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }} />
                    <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1px', background: 'linear-gradient(135deg, #fff 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        LifeOS
                    </h1>
                </div>
                <p>Your autonomous productivity orchestration system. Connect Gmail and Google Calendar to get started.</p>
                <a href={getGoogleAuthUrl()} id="btn-google-signin">
                    <button className="btn btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
                        🔐 Sign in with Google
                    </button>
                </a>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 360 }}>
                    LifeOS requires read access to Gmail and read/write access to Google Calendar.
                    No data is stored — everything is fetched live on demand.
                </p>
            </div>
        );
    }

    // ── Authenticated Dashboard ───────────────────────────────────────────────
    return (
        <main className="dashboard">
            {/* Header */}
            <header className="header">
                <div className="header-logo">
                    <div className="logo-dot" />
                    <h1>LifeOS</h1>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
                        Control
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--accent)' }}>● Connected</span>
                    <button
                        id="btn-settings"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowSettings(true)}
                    >
                        ⚙ Settings
                    </button>
                </div>
            </header>

            {/* Main 2-column grid */}
            <div className="main-grid">
                <EmailIntelPanel onAnalysesUpdate={handleAnalysesUpdate} />
                <CalendarPanel emailData={emailData} />
            </div>

            {/* Reply Drafts — full width */}
            <ReplyDraftPanel emailData={emailData} />

            <div className="divider" />

            {/* Autonomous Mode Section */}
            <div className="autonomous-panel panel">
                <div className="panel-header" style={{ marginBottom: 16 }}>
                    <span className="panel-title">Autonomous Mode</span>
                    {execSummary && (
                        <span className="badge badge-success">
                            ✓ {execSummary.dryRun ? 'Dry run complete' : 'Pipeline complete'}
                        </span>
                    )}
                </div>

                <div className="autonomous-controls">
                    <button
                        id="btn-run-autonomous"
                        className="btn btn-primary"
                        onClick={() => handleRunAutonomous(false)}
                        disabled={isRunning}
                        style={{ fontSize: 14, padding: '9px 20px' }}
                    >
                        {isRunning ? (
                            <><span className="spinner" /> Running Pipeline...</>
                        ) : (
                            '🚀 Run LifeOS Autonomously'
                        )}
                    </button>
                    <button
                        id="btn-dry-run"
                        className="btn btn-ghost"
                        onClick={() => handleRunAutonomous(true)}
                        disabled={isRunning}
                    >
                        🧪 Dry Run
                    </button>
                </div>

                {execSummary && !isRunning && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span className="badge badge-normal">📧 {execSummary.emails?.length || 0} emails</span>
                        <span className="badge badge-urgent">🔴 {execSummary.urgentCount || 0} urgent</span>
                        <span className="badge badge-normal">📅 {execSummary.events?.length || 0} events</span>
                        <span className="badge badge-reply">↩ {execSummary.drafts?.length || 0} drafts</span>
                        {execSummary.eventCreated?.success && (
                            <span className="badge badge-success">✓ Calendar event created</span>
                        )}
                    </div>
                )}

                <ExecutionFeed steps={execSteps} isRunning={isRunning} />
            </div>

            {/* Settings Modal */}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </main>
    );
}
