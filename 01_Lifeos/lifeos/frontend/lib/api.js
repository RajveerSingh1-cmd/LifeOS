/**
 * lib/api.js
 * The ONLY place in the frontend that makes fetch() calls to the backend.
 * All HTTP logic, base URL config, and error handling lives here.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

/**
 * Generic fetch wrapper that returns { success, data, error }.
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${BACKEND_URL}${endpoint}`;
    const response = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const json = await response.json();
    return json;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function checkAuthStatus() {
    return apiFetch('/api/auth/status');
}

export function getGoogleAuthUrl() {
    return `${BACKEND_URL}/api/auth/google`;
}

// ─── Emails ──────────────────────────────────────────────────────────────────

export async function fetchEmails() {
    return apiFetch('/api/emails/fetch');
}

export async function analyzeEmails(emails) {
    return apiFetch('/api/emails/analyze', {
        method: 'POST',
        body: JSON.stringify({ emails }),
    });
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export async function fetchCalendarEvents() {
    return apiFetch('/api/calendar/events');
}

export async function runScheduler(events, nearestDeadline) {
    return apiFetch('/api/calendar/schedule', {
        method: 'POST',
        body: JSON.stringify({ events, nearestDeadline: nearestDeadline || null }),
    });
}

export async function createCalendarEvent(block) {
    return apiFetch('/api/calendar/create', {
        method: 'POST',
        body: JSON.stringify({ start: block.start, end: block.end }),
    });
}

// ─── Replies ─────────────────────────────────────────────────────────────────

export async function draftReply(email, analysis) {
    return apiFetch('/api/reply/draft', {
        method: 'POST',
        body: JSON.stringify({ email, analysis }),
    });
}

// ─── Config ──────────────────────────────────────────────────────────────────

export async function getWorkingHours() {
    return apiFetch('/api/config/hours');
}

export async function updateWorkingHours(config) {
    return apiFetch('/api/config/hours', {
        method: 'POST',
        body: JSON.stringify(config),
    });
}

// ─── Autonomous Mode (SSE) ────────────────────────────────────────────────────

/**
 * Streams the autonomous pipeline via Server-Sent Events.
 * @param {boolean} dryRun
 * @param {(msg: string) => void} onStep - called for each step log
 * @param {(summary: object) => void} onComplete - called with final Execution Summary
 * @param {(err: string) => void} onError - called on pipeline error
 * @returns {EventSource} - caller can close() to abort
 */
export function runAutonomous(dryRun, onStep, onComplete, onError) {
    const url = `${BACKEND_URL}/api/run?dryRun=${dryRun}`;

    // POST via fetch first to trigger the SSE-emitting route, 
    // then read the stream manually (EventSource only does GET).
    // We use fetch with streaming body read.
    const controller = new AbortController();

    fetch(url, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
    }).then(async (response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const payload = JSON.parse(line.slice(6));
                        if (payload.type === 'step' && onStep) {
                            onStep(payload.message);
                        } else if (payload.type === 'complete' && onComplete) {
                            onComplete(payload.summary);
                        } else if (payload.type === 'error' && onError) {
                            onError(payload.message);
                        }
                    } catch (e) {
                        // ignore malformed JSON lines
                    }
                }
            }
        }
    }).catch((err) => {
        if (err.name !== 'AbortError' && onError) {
            onError(`Connection error: ${err.message}`);
        }
    });

    return { close: () => controller.abort() };
}
