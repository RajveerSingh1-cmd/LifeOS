'use client';

import { useState } from 'react';
import { getWorkingHours, updateWorkingHours } from '../../lib/api';

export default function SettingsModal({ onClose }) {
    const [config, setConfig] = useState({ start: '09:00', end: '18:00', timezone: 'UTC', minBlockDuration: 60 });
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [msg, setMsg] = useState(null);
    const [isError, setIsError] = useState(false);

    // Load current config when modal opens
    if (!fetched) {
        setFetched(true);
        getWorkingHours().then((result) => {
            if (result.success) setConfig(result.data.workingHours);
        });
    }

    async function handleSave() {
        setLoading(true);
        setMsg(null);
        try {
            const result = await updateWorkingHours({
                ...config,
                minBlockDuration: Number(config.minBlockDuration),
            });
            if (!result.success) throw new Error(result.error || 'Update failed');
            setIsError(false);
            setMsg('Working hours updated successfully.');
        } catch (err) {
            setIsError(true);
            setMsg(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <h2>⚙ Settings — Working Hours</h2>

                <div className="form-group">
                    <label>Start Time (HH:MM)</label>
                    <input
                        id="settings-start"
                        type="text"
                        className="form-input"
                        value={config.start}
                        onChange={(e) => setConfig((c) => ({ ...c, start: e.target.value }))}
                        placeholder="09:00"
                    />
                </div>

                <div className="form-group">
                    <label>End Time (HH:MM)</label>
                    <input
                        id="settings-end"
                        type="text"
                        className="form-input"
                        value={config.end}
                        onChange={(e) => setConfig((c) => ({ ...c, end: e.target.value }))}
                        placeholder="18:00"
                    />
                </div>

                <div className="form-group">
                    <label>Timezone (IANA string)</label>
                    <input
                        id="settings-timezone"
                        type="text"
                        className="form-input"
                        value={config.timezone}
                        onChange={(e) => setConfig((c) => ({ ...c, timezone: e.target.value }))}
                        placeholder="America/New_York"
                    />
                </div>

                <div className="form-group">
                    <label>Min Block Duration (minutes)</label>
                    <input
                        id="settings-duration"
                        type="number"
                        className="form-input"
                        value={config.minBlockDuration}
                        onChange={(e) => setConfig((c) => ({ ...c, minBlockDuration: e.target.value }))}
                        min={30}
                        max={240}
                    />
                </div>

                {msg && <div className={isError ? 'error-msg' : 'success-msg'}>{msg}</div>}

                <div className="modal-actions">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button
                        id="btn-save-settings"
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
