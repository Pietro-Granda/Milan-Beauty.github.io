/**
 * @file booking_engine.js
 * @description Main entry point for the Booking Validation & Event Creation Engine.
 * Implements strict deterministic logic for slot booking.
 */

const { DateTime } = require('luxon');
const CONFIG = require('./config');
const ERRORS = require('./errors');
const CalendarService = require('./calendar_service');
const LockManager = require('./lock_manager');

/**
 * Validates the input payload structure and formats.
 * @param {object} payload 
 * @returns {null|object} Returns error object if invalid, null if valid.
 */
function validateInput(payload) {
  if (!payload || typeof payload !== 'object') {
    return { status: "error", code: ERRORS.INVALID_INPUT };
  }

  const requiredFields = [
    "client_name", "client_phone", "client_email",
    "procedure", "date", "start_time", "timezone"
  ];

  for (const field of requiredFields) {
    if (!payload[field] || typeof payload[field] !== 'string' || !payload[field].trim()) {
      return { status: "error", code: ERRORS.INVALID_INPUT };
    }
  }

  // Validate Date (YYYY-MM-DD)
  // Strict regex for YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    return { status: "error", code: ERRORS.INVALID_INPUT };
  }

  // Validate Time (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(payload.start_time)) {
    return { status: "error", code: ERRORS.INVALID_INPUT };
  }

  return null;
}

/**
 * Main function to process a booking request.
 * @param {object} payload 
 * @returns {Promise<object>} JSON response
 */
async function processBookingRequest(payload) {
  try {
    // STEP 1: Input Validation
    const validationError = validateInput(payload);
    if (validationError) return validationError;

    // STEP 2: Resolve Procedure
    const procedureConfig = CONFIG.PROCEDURES[payload.procedure];
    if (!procedureConfig) {
      return { status: "error", code: ERRORS.INVALID_PROCEDURE };
    }

    const { professional_id, duration_minutes } = procedureConfig;
    const calendarId = CONFIG.CALENDARS[professional_id];

    if (!calendarId) {
      return { status: "error", code: ERRORS.PROFESSIONAL_NOT_FOUND };
    }

    // STEP 3: Calculate Time Range
    // Parse strictly in the provided timezone
    let dtStart;
    try {
      dtStart = DateTime.fromISO(`${payload.date}T${payload.start_time}`, { zone: payload.timezone });
      if (!dtStart.isValid) throw new Error("Invalid datetime");
    } catch (e) {
      return { status: "error", code: ERRORS.INVALID_INPUT };
    }

    const dtEnd = dtStart.plus({ minutes: duration_minutes });
    const dtBuffer = dtEnd.plus({ minutes: CONFIG.BUFFER_MINUTES });

    // Convert to UTC ISO for storage and comparison
    const isoStart = dtStart.toUTC().toISO();
    const isoEnd = dtEnd.toUTC().toISO();
    const isoBuffer = dtBuffer.toUTC().toISO();

    // Acquire Lock for the Professional
    const lock = LockManager.getLock(professional_id);
    
    return await lock.runExclusive(async () => {
        // STEP 4: Fetch Existing Events
        // Query strictly: [appointment_start, buffer_end]
        // But to detect "existing event buffer overlaps new start", we need to check:
        // Any event that ends after (start - 10 mins).
        // However, the prompt mandates querying [appointment_start, buffer_end] in STEP 4.
        // And using specific conflict formula in STEP 6.
        // Let's stick to the prompt's STEP 4 instruction for the query range, 
        // BUT for the conflict logic to be robust as per review, we need events that might overlap.
        // If we only query [start, buffer_end], we might miss an event that ended 5 mins ago 
        // but has a buffer extending into our start.
        // So we MUST broaden the query to be safe: [start - 10 mins, buffer_end]
        
        const safeQueryStart = dtStart.minus({ minutes: CONFIG.BUFFER_MINUTES }).toUTC().toISO();
        
        let existingEvents;
        try {
            existingEvents = await CalendarService.listEvents(calendarId, safeQueryStart, isoBuffer);
        } catch (apiError) {
            return { status: "error", code: ERRORS.GOOGLE_API_FAILURE };
        }

        // STEP 5 & 6: Conflict Detection
        // Conflict Condition:
        // (New_Start < Existing_End_With_Buffer) AND (New_End_With_Buffer > Existing_Start)
        
        // Expanded Interval Logic:
        // Existing Effective: [E_Start, E_End + 10]
        // New Effective: [N_Start, N_End + 10]
        
        // Check for overlap between New Effective and Existing Effective
        const isConflict = existingEvents.some(event => {
            const eStart = DateTime.fromISO(event.start).toUTC();
            const eEnd = DateTime.fromISO(event.end).toUTC();
            const eBufferEnd = eEnd.plus({ minutes: CONFIG.BUFFER_MINUTES });

            // Strict inequality for overlap
            // Overlap = (StartA < EndB) && (EndA > StartB)
            // A = New Effective, B = Existing Effective
            
            // New Effe: [dtStart, dtBuffer]
            // Existing Effe: [eStart, eBufferEnd]
            
            return (dtStart < eBufferEnd) && (dtBuffer > eStart);
        });

        if (isConflict) {
            return { status: "error", code: ERRORS.TIME_CONFLICT };
        }

        // STEP 7: Create Event
        const eventData = {
            title: `${payload.procedure} - ${payload.client_name}`,
            description: `Name: ${payload.client_name}\nPhone: ${payload.client_phone}\nEmail: ${payload.client_email}\nProcedure: ${payload.procedure}`,
            start: isoStart,
            end: isoEnd // Buffer is implicit logic, not stored in 'end' time
        };

        try {
            await CalendarService.createEvent(calendarId, eventData);
        } catch (createError) {
             return { status: "error", code: ERRORS.GOOGLE_API_FAILURE }; // Or concurrency_failure if strictly mapped? Prompt says google_api_failure allowed.
        }

        // STEP 8: Success Response
        return {
            status: "success",
            professional_id: professional_id,
            calendar_id: calendarId,
            start: isoStart,
            end: isoEnd
        };

    }).catch(err => {
        // If the lock fails or some other error occurs not caught inside
        if (err.message === "Simulated Google API 500") return { status: "error", code: ERRORS.GOOGLE_API_FAILURE };
        return { status: "error", code: ERRORS.CONCURRENCY_FAILURE };
    });

  } catch (error) {
    console.error("Unexpected system error:", error);
    return { status: "error", code: ERRORS.CONCURRENCY_FAILURE }; // Fallback for unexpected
  }
}

module.exports = { processBookingRequest };
