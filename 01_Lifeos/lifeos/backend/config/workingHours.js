// Working hours configuration
// This object is mutated at runtime by the config routes.
// To persist across restarts, swap this module for one that reads/writes a file or DB.

const workingHours = {
  start: '09:00',       // HH:MM in 24h format
  end: '18:00',         // HH:MM in 24h format
  timezone: 'UTC',      // IANA timezone string
  minBlockDuration: 60  // minimum deep work block in minutes
};

module.exports = workingHours;
