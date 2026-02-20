/**
 * @file config.js
 * @description Configuration mappings for the Booking Engine.
 * MUST be authoritative.
 */

const CONFIG = {
  // Procedure -> Professional Mapping
  PROCEDURES: {
    "Trucco semipermanente - Sopracciglia": {
      professional_id: "professional_1",
      duration_minutes: 120,
    },
    "Trucco semipermanente - Eyeliner": {
      professional_id: "professional_1",
      duration_minutes: 90,
    },
    "Trucco semipermanente - Labbra": {
      professional_id: "professional_1",
      duration_minutes: 150,
    },
    Microblading: {
      professional_id: "professional_1",
      duration_minutes: 120,
    },
    "Laminazione ciglia": {
      professional_id: "professional_2",
      duration_minutes: 60,
    },
    "Tinta ciglia e sopracciglia": {
      professional_id: "professional_2",
      duration_minutes: 30,
    },
    "Clean-up viso": {
      professional_id: "professional_3",
      duration_minutes: 60,
    },
    "Face-lift (antiage)": {
      professional_id: "professional_3",
      duration_minutes: 90,
    },
    Microneedling: {
      professional_id: "professional_3",
      duration_minutes: 60,
    },
    "Presso-slim": {
      professional_id: "professional_3",
      duration_minutes: 45,
    },
    "Body-shape": {
      professional_id: "professional_3",
      duration_minutes: 60,
    },
    "Massaggio rilassante": {
      professional_id: "professional_3",
      duration_minutes: 60,
    },
    "Massaggio drenante": {
      professional_id: "professional_3",
      duration_minutes: 60,
    },
    "Epilazione laser - Viso": {
      professional_id: "professional_4",
      duration_minutes: 15,
    },
    "Epilazione laser - Gambe": {
      professional_id: "professional_4",
      duration_minutes: 45,
    },
    "Epilazione laser - Inguine": {
      professional_id: "professional_4",
      duration_minutes: 30,
    },
    "Epilazione laser - Ascelle": {
      professional_id: "professional_4",
      duration_minutes: 15,
    },
    "Brazilian manicure SPA": {
      professional_id: "professional_2",
      duration_minutes: 60,
    },
    "Semipermanente unghie": {
      professional_id: "professional_2",
      duration_minutes: 60,
    },
    "Ricostruzione gel": {
      professional_id: "professional_2",
      duration_minutes: 90,
    },
    "Brazilian pedicure SPA": {
      professional_id: "professional_2",
      duration_minutes: 60,
    },
    "Consulenza personalizzata": {
      professional_id: "professional_1",
      duration_minutes: 30,
    },
  },

  // Professional -> Calendar Mapping
  CALENDARS: {
    professional_1: "calendar_id_1", // Camila
    professional_2: "calendar_id_2", // Vanessa
    professional_3: "calendar_id_3", // Carla
    professional_4: "calendar_id_4", // Magali
  },

  // Global settings
  BUFFER_MINUTES: 10,
};

module.exports = CONFIG;
