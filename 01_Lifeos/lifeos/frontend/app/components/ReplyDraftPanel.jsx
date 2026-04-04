'use client';

import { useState } from 'react';

export default function ReplyDraftPanel({ emailData }) {
    const [copiedId, setCopiedId] = useState(null);

    const { emails = [], analyses = [], drafts = [] } = emailData || {};

    function getEmailSubject(emailId) {
        const email = emails.find((e) => e.id === emailId);
        return email?.subject || emailId;
    }

    function handleCopy(emailId, draft) {
        navigator.clipboard.writeText(draft).then(() => {
            setCopiedId(emailId);
            setTimeout(() => setCopiedId(null), 2000);
        });
    }

    if (drafts.length === 0) {
        return (
            <div className="panel">
                <div className="panel-header">
                    <span className="panel-title">Reply Drafts</span>
                </div>
                <div className="empty-state">
                    {analyses.length === 0
                        ? 'Run Email Intelligence first to generate reply drafts.'
                        : 'No urgent emails requiring replies were detected.'}
                </div>
            </div>
        );
    }

    return (
        <div className="panel">
            <div className="panel-header">
                <span className="panel-title">Reply Drafts</span>
                <span className="badge badge-urgent">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="draft-list">
                {drafts.map((d) => (
                    <div key={d.emailId} className="draft-item">
                        <div className="draft-header">
                            <div className="draft-subject" title={getEmailSubject(d.emailId)}>
                                ↩ Re: {getEmailSubject(d.emailId)}
                            </div>
                            <button
                                id={`btn-copy-${d.emailId}`}
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleCopy(d.emailId, d.draft)}
                            >
                                {copiedId === d.emailId ? '✓ Copied!' : '⎘ Copy'}
                            </button>
                        </div>
                        <div className="draft-text">{d.draft}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
