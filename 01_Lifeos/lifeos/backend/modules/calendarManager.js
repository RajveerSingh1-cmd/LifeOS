const { createEvent } = require('../api-wrappers/calendar');

/**
 * Bridge between a scheduling decision and the Google Calendar API.
 * If no block was suggested, returns early with failure object.
 *
 * @param {import('google-auth-library').OAuth2Client} auth
 * @param {SchedulingDecisionObject} schedulingDecision
 * @returns {Promise<CreatedEventConfirmationObject>}
 */
async function scheduleDeepWork(auth, schedulingDecision) {
    if (!schedulingDecision.suggestedBlock) {
        return {
            success: false,
            eventId: null,
            eventLink: null,
            error: schedulingDecision.reason || 'No available time block found.',
        };
    }

    return await createEvent(auth, schedulingDecision.suggestedBlock);
}

module.exports = { scheduleDeepWork };
