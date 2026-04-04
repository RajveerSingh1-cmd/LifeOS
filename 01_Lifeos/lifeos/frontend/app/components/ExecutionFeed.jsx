'use client';

import { useEffect, useRef } from 'react';

export default function ExecutionFeed({ steps, isRunning }) {
    const feedRef = useRef(null);

    // Auto-scroll to latest step
    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
    }, [steps]);

    const isEmpty = !steps || steps.length === 0;

    return (
        <div className="exec-feed" ref={feedRef}>
            {isEmpty && !isRunning && (
                <span className="exec-empty">Execution feed will appear here when you run LifeOS...</span>
            )}
            {isRunning && isEmpty && (
                <div className="exec-step">
                    <span className="step-arrow">→</span>
                    <span>Connecting to pipeline...</span>
                    <span className="spinner" style={{ marginLeft: 8 }} />
                </div>
            )}
            {steps && steps.map((step, i) => {
                const isDone = step.includes('✓') || step.includes('complete');
                const isError = step.includes('✗') || step.includes('failed') || step.includes('Failed');
                return (
                    <div
                        key={i}
                        className={`exec-step ${isDone ? 'done' : ''} ${isError ? 'error' : ''}`}
                    >
                        <span className="step-arrow">→</span>
                        <span>{step}</span>
                    </div>
                );
            })}
            {isRunning && steps && steps.length > 0 && (
                <div className="exec-step">
                    <span className="step-arrow">→</span>
                    <span>Running...</span>
                    <span className="spinner" style={{ marginLeft: 8 }} />
                </div>
            )}
        </div>
    );
}
