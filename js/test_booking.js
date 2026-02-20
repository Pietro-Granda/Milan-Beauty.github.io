/**
 * @file test_booking.js
 * @description Automated test runner for the Booking Engine.
 */

const { processBookingRequest } = require('./backend/booking_engine');
const CalendarService = require('./backend/calendar_service');
const ERRORS = require('./backend/errors');

async function runTests() {
  console.log("Starting Booking Engine Tests...\n");
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`[TEST] ${name} ... `);
      await fn();
      console.log("PASS");
      passed++;
    } catch (e) {
      console.log("FAIL");
      console.error("   Reason:", e.message);
      failed++;
    }
  }

  function assert(condition, msg) {
    if (!condition) throw new Error(msg || "Assertion failed");
  }

  function assertEq(actual, expected, msg) {
    if (actual !== expected) throw new Error(`${msg || "Value mismatch"}: Expected ${expected}, got ${actual}`);
  }

  // Helper to generate valid payload
  const basePayload = {
    client_name: "Test Client",
    client_phone: "1234567890",
    client_email: "test@example.com",
    procedure: "Manicure", // Invalid name initially? No, let's use valid
    date: "2025-01-01",
    start_time: "10:00",
    timezone: "Europe/Rome"
  };

  const validProcedure = "Trucco semipermanente - Sopracciglia"; // 120 mins

  // TEST 1: Invalid Input
  await test("Invalid Input - Missing Fields", async () => {
    const res = await processBookingRequest({});
    assertEq(res.status, "error");
    assertEq(res.code, ERRORS.INVALID_INPUT);
  });

  // TEST 2: Invalid Procedure
  await test("Invalid Procedure", async () => {
    const res = await processBookingRequest({ ...basePayload, procedure: "Unknown Service" });
    assertEq(res.status, "error");
    assertEq(res.code, ERRORS.INVALID_PROCEDURE);
  });

  // TEST 3: Successful Booking (Golden Path)
  await test("Successful Booking", async () => {
    CalendarService._clear();
    const payload = { ...basePayload, procedure: validProcedure }; // 120 mins -> 10:00 to 12:00
    const res = await processBookingRequest(payload);
    
    assertEq(res.status, "success");
    assert(res.start.includes("T09:00:00.000Z"), "Should be 09:00 UTC (10:00 Rome)"); // 09:00 UTC
    assert(res.end.includes("T11:00:00.000Z"), "Should be 11:00 UTC (12:00 Rome)"); // 11:00 UTC
  });

  // TEST 4: Time Conflict (Direct Overlap)
  await test("Time Conflict - Direct Overlap", async () => {
    CalendarService._clear();
    // Setup existing event: 10:00 - 12:00 Rome (09:00-11:00 UTC)
    CalendarService._seed("calendar_id_1", [{
      start: "2025-01-01T09:00:00.000Z",
      end: "2025-01-01T11:00:00.000Z"
    }]);

    const payload = { ...basePayload, procedure: validProcedure }; // Tries 10:00 Rome
    const res = await processBookingRequest(payload);
    
    assertEq(res.status, "error");
    assertEq(res.code, ERRORS.TIME_CONFLICT);
  });

  // TEST 5: Time Conflict (Buffer Overlap)
  await test("Time Conflict - Buffer Overlap", async () => {
    CalendarService._clear();
    // Existing: 10:00 - 12:00 Rome. Buffer until 12:10.
    CalendarService._seed("calendar_id_1", [{
      start: "2025-01-01T09:00:00.000Z",
      end: "2025-01-01T11:00:00.000Z" // Ends 12:00 Rome
    }]);

    // New booking starts at 12:05 Rome.
    // Should fail because 12:05 < 12:10 (buffer end).
    const payload = { 
        ...basePayload, 
        procedure: validProcedure, 
        start_time: "12:05" 
    };
    
    const res = await processBookingRequest(payload);
    assertEq(res.status, "error");
    assertEq(res.code, ERRORS.TIME_CONFLICT, "Should detect conflict with existing buffer");
  });

  // TEST 6: Google API Failure
  await test("Google API Failure", async () => {
    CalendarService._clear();
    // We can't easily force the random failure in the mock without modifying it,
    // but the mock implementation has a 5% random fail chance.
    // Let's rely on manual injection or just skip this for deterministic runner unless we mock properly.
    // For this test, we can trust the logic handles exceptions from service.
    
    // Let's create a scenario that is valid but assume CalendarService throws.
    // We can temporarily override listEvents
    const originalList = CalendarService.listEvents;
    CalendarService.listEvents = async () => { throw new Error("API Down"); };

    const payload = { ...basePayload, procedure: validProcedure };
    const res = await processBookingRequest(payload);

    assertEq(res.status, "error");
    assertEq(res.code, ERRORS.GOOGLE_API_FAILURE);

    // Restore
    CalendarService.listEvents = originalList;
  });

  console.log(`\nResults: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
