'use client';

import { useState } from 'react';
import {
    fetchCalendarEvents as apiFetchEvents,
    runScheduler as apiRunScheduler,
    createCalendarEvent as apiCreateEvent,
} from '../../lib/api';

export default function CalendarPanel({ emailData, onSchedulingDecision }) {
    const [events, setEvents] = useState([]);
    const [schedulingDecision, setSchedulingDecision] = useState(null);
    const [eventConfirm, setEventConfirm] = useState(null);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [error, setError] = useState(null);

    async function handleFetchEvents() {
        setLoadingEvents(true);
        setError(null);
        setSchedulingDecision(null);
        setEventConfirm(null);
        try {
            const result = await apiFetchEvents();
            if (!result.success) throw new Error(result.error || 'Failed to fetch events');
            setEvents(result.data.events);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingEvents(false);
        }
    }

    async function handleRunScheduler() {
        setLoadingSchedule(true);
        setError(null);
        setEventConfirm(null);
        try {
            // Get nearest deadline from email analyses if available
            const analyses = emailData?.analyses || [];
            const deadlines = analyses.map((a) => a.deadline).filter(Boolean).sort();
            const nearestDeadline = deadlines[0] || null;

            const result = await apiRunScheduler(events, nearestDeadline);
            if (!result.success) throw new Error(result.error || 'Scheduling failed');
            const decision = result.data.schedulingDecision;
            setSchedulingDecision(decision);
            if (onSchedulingDecision) onSchedulingDecision(decision);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingSchedule(false);
        }
    }

    async function handleCreateEvent() {
        if (!schedulingDecision?.suggestedBlock) return;
        setLoadingCreate(true);
        setError(null);
        setEventConfirm(null);
        try {
            const result = await apiCreateEvent(schedulingDecision.suggestedBlock);
            setEventConfirm(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingCreate(false);
        }
    }

    function formatDateTime(iso) {
        if (!iso) return '';
        return new Date(iso).toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
            hour12: true,
        });
    }

    function formatTimeRange(start, end) {
        const s = new Date(start);
        const e = new Date(end);
        const date = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const startTime = s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const endTime = e.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${date} · ${startTime} – ${endTime}`;
    }

    return (
        <div className="panel">
            <div className="panel-header">
                <span className="panel-title">Calendar Optimization</span>
                <div className="panel-actions">
                    <button
                        id="btn-fetch-events"
                        className="btn btn-ghost"
                        onClick={handleFetchEvents}
                        disabled={loadingEvents}
                    >
                        {loadingEvents ? <><span className="spinner" /> Loading...</> : '📅 Fetch Events'}
                    </button>
                    <button
                        id="btn-run-scheduler"
                        className="btn btn-primary"
                        onClick={handleRunScheduler}
                        disabled={loadingSchedule || events.length === 0}
                    >
                        {loadingSchedule ? <><span className="spinner" /> Scheduling...</> : '🧠 Run Scheduler'}
                    </button>
                </div>
            </div>

            {error && <div className="error-msg">⚠ {error}</div>}

            {events.length === 0 && !loadingEvents && (
                <div className="empty-state">Click "Fetch Events" to load your upcoming calendar.</div>
            )}

            {events.length > 0 && (
                <div className="event-list">
                    {events.map((event) => (
                        <div key={event.id} className="event-item">
                            <div className="event-time">{formatDateTime(event.start)}</div>
                            <div className="event-title">{event.title}</div>
                        </div>
                    ))}
                </div>
            )}

            {schedulingDecision && (
                <>
                    <div className="divider" />
                    {schedulingDecision.suggestedBlock ? (
                        <div className="scheduling-block">
                            <h4>⚡ Recommended Deep Work Block</h4>
                            <div className="scheduling-time">
                                {formatTimeRange(schedulingDecision.suggestedBlock.start, schedulingDecision.suggestedBlock.end)}
                            </div>
                            <div className="scheduling-reason">{schedulingDecision.reason}</div>
                        </div>
                    ) : (
                        <div className="error-msg">📭 {schedulingDecision.reason}</div>
                    )}

                    {schedulingDecision.suggestedBlock && !eventConfirm && (
                        <button
                            id="btn-create-event"
                            className="btn btn-primary"
                            onClick={handleCreateEvent}
                            disabled={loadingCreate}
                        >
                            {loadingCreate ? <><span className="spinner" /> Creating...</> : '✅ Create Event on Calendar'}
                        </button>
                    )}

                    {eventConfirm && eventConfirm.success && (
                        <div className="success-msg">
                            ✓ Event created!{' '}
                            <a href={eventConfirm.eventLink} target="_blank" rel="noopener noreferrer"
                                style={{ color: 'var(--accent)' }}>
                                View on Google Calendar ↗
                            </a>
                        </div>
                    )}
                    {eventConfirm && !eventConfirm.success && (
                        <div className="error-msg">⚠ Creation failed: {eventConfirm.error}</div>
                    )}
                </>
            )}
        </div>
    );
}
