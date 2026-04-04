require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const replyRoutes = require('./routes/replyRoutes');
const orchestratorRoute = require('./routes/orchestratorRoute');
const configRoutes = require('./routes/configRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'lifeos-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set to true in production with HTTPS
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/reply', replyRoutes);
app.use('/api', orchestratorRoute);
app.use('/api/config', configRoutes);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[server] Unhandled error:', err.message);
    res.status(500).json({ success: false, data: null, error: err.message });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, data: { status: 'LifeOS backend running' }, error: null });
});

// ─── Startup Env Validation ───────────────────────────────────────────────────
function checkEnv() {
    const required = {
        GOOGLE_CLIENT_ID: { value: process.env.GOOGLE_CLIENT_ID, needed: 'OAuth login' },
        GOOGLE_CLIENT_SECRET: { value: process.env.GOOGLE_CLIENT_SECRET, needed: 'OAuth login' },
        GOOGLE_REDIRECT_URI: { value: process.env.GOOGLE_REDIRECT_URI, needed: 'OAuth login' },
        GEMINI_API_KEY: { value: process.env.GEMINI_API_KEY, needed: 'LLM analysis & reply drafts' },
        SESSION_SECRET: { value: process.env.SESSION_SECRET, needed: 'Session management' },
    };

    const isPlaceholder = (v) => !v || v.includes('your_') || v.trim() === '';

    console.log('\n── ENV STATUS ─────────────────────────────────────────────');
    let hasWarning = false;
    for (const [key, { value, needed }] of Object.entries(required)) {
        if (isPlaceholder(value)) {
            console.log(`  ✗ ${key.padEnd(22)} ← missing  [needed for: ${needed}]`);
            hasWarning = true;
        } else {
            console.log(`  ✓ ${key.padEnd(22)} ← set`);
        }
    }
    if (hasWarning) {
        console.log('\n  ⚠  Add missing values to /lifeos/backend/.env and restart.');
        console.log('  ⚠  Server will run but missing-key features will return errors.');
    } else {
        console.log('\n  ✓ All environment variables set — fully operational.');
    }
    console.log('───────────────────────────────────────────────────────────\n');
}

app.listen(PORT, () => {
    console.log(`\n🚀 LifeOS backend running at http://localhost:${PORT}`);
    console.log(`   Auth flow : http://localhost:${PORT}/api/auth/google`);
    console.log(`   Health    : http://localhost:${PORT}/api/health`);
    checkEnv();
});

module.exports = app;

