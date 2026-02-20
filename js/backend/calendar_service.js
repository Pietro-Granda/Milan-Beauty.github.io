/**
 * @file calendar_service.js
 * @description Mockable abstraction for Google Calendar API interactions.
 */

const ERRORS = require('./errors');

// In-memory store for mock events to simulate persistence during testing
const MOCK_DB = new Map();

class CalendarService {
  /**
   * Fetch events from a specific calendar within a time range.
   * @param {string} calendarId 
   * @param {string} timeMin ISO string
   * @param {string} timeMax ISO string
   * @returns {Promise<Array<{start: string, end: string}>>}
   */
  async listEvents(calendarId, timeMin, timeMax) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // In a real implementation, this would call the Google Calendar API.
    // For this engine, we use the MOCK_DB or return empty if not set.
    const events = MOCK_DB.get(calendarId) || [];
    
    // Filter by range (simple overlap check for mock retrieval)
    return events.filter(e => {
      return (e.start < timeMax) && (e.end > timeMin);
    });
  }

  /**
   * Create an event in the specified calendar.
   * @param {string} calendarId 
   * @param {object} eventData { title, description, start, end }
   * @returns {Promise<object>} Created event object
   */
  async createEvent(calendarId, eventData) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate random API failure (rarely)
    if (Math.random() < 0.05) {
      throw new Error("Simulated Google API 500");
    }

    const newEvent = {
        id: "evt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        ...eventData
    };

    const currentEvents = MOCK_DB.get(calendarId) || [];
    currentEvents.push(newEvent);
    MOCK_DB.set(calendarId, currentEvents);

    return newEvent;
  }

  // Helper for tests to seed data
  _seed(calendarId, events) {
    MOCK_DB.set(calendarId, events);
  }

  _clear() {
    MOCK_DB.clear();
  }
}

module.exports = new CalendarService();
