'use client';

import { useState } from 'react';
import { fetchEmails as apiFetchEmails, analyzeEmails as apiAnalyzeEmails } from '../../lib/api';

export default function EmailIntelPanel({ onAnalysesUpdate }) {
    const [emails, setEmails] = useState([]);
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(null); // 'fetching' | 'analyzing' | 'done'

    async function handleFetchAndAnalyze() {
        setLoading(true);
        setError(null);
        setAnalyses([]);

        try {
            // Step 1: Fetch emails
            setStep('fetching');
            const fetchResult = await apiFetchEmails();
            if (!fetchResult.success) throw new Error(fetchResult.error || 'Failed to fetch emails');
            const rawEmails = fetchResult.data.emails;
            setEmails(rawEmails);

            // Step 2: Analyze
            setStep('analyzing');
            const analyzeResult = await apiAnalyzeEmails(rawEmails);
            if (!analyzeResult.success) throw new Error(analyzeResult.error || 'Failed to analyze emails');
            const emailAnalyses = analyzeResult.data.analyses;
            setAnalyses(emailAnalyses);

            // Lift state up for use by other panels
            if (onAnalysesUpdate) onAnalysesUpdate({ emails: rawEmails, analyses: emailAnalyses });
            setStep('done');
        } catch (err) {
            setError(err.message);
            setStep(null);
        } finally {
            setLoading(false);
        }
    }

    function formatDeadline(deadline) {
        if (!deadline) return null;
        return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Merge email data with analyses
    const enriched = analyses.map((a) => {
        const raw = emails.find((e) => e.id === a.id) || {};
        return { ...raw, ...a };
    });

    return (
        <div className="panel">
            <div className="panel-header">
                <span className="panel-title">Email Intelligence</span>
                <div className="panel-actions">
                    <button
                        id="btn-fetch-analyze"
                        className="btn btn-primary"
                        onClick={handleFetchAndAnalyze}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" />
                                {step === 'fetching' ? 'Fetching...' : 'Analyzing...'}
                            </>
                        ) : (
                            '⚡ Fetch + Analyze'
                        )}
                    </button>
                </div>
            </div>

            {error && <div className="error-msg">⚠ {error}</div>}

            {enriched.length === 0 && !loading && (
                <div className="empty-state">
                    {step === null ? 'Click "Fetch + Analyze" to load and analyze your emails.' : ''}
                </div>
            )}

            {enriched.length > 0 && (
                <div className="email-list">
                    {enriched.map((email) => (
                        <div key={email.id} className={`email-item ${email.urgency ? 'urgent' : ''}`}>
                            <div className="email-subject" title={email.subject}>{email.subject}</div>
                            <div className="email-sender">{email.sender}</div>
                            <div className="email-meta">
                                <span className={`badge ${email.urgency ? 'badge-urgent' : 'badge-normal'}`}>
                                    {email.urgency ? '🔴 Urgent' : '⚪ Normal'}
                                </span>
                                {email.replyRequired && (
                                    <span className="badge badge-reply">↩ Reply needed</span>
                                )}
                                {email.deadline && (
                                    <span className="badge badge-deadline">📅 {formatDeadline(email.deadline)}</span>
                                )}
                            </div>
                            {email.summary && (
                                <div className="email-summary">{email.summary}</div>
                            )}
                            {email.actionItem && (
                                <div className="email-action">→ {email.actionItem}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
