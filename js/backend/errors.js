/**
 * @file errors.js
 * @description Exclusive list of allowed error codes.
 */

const ERRORS = {
  INVALID_INPUT: "invalid_input",
  INVALID_PROCEDURE: "invalid_procedure",
  PROFESSIONAL_NOT_FOUND: "professional_not_found",
  TIME_CONFLICT: "time_conflict",
  GOOGLE_API_FAILURE: "google_api_failure",
  CONCURRENCY_FAILURE: "concurrency_failure"
};

module.exports = ERRORS;
