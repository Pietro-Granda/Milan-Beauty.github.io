/**
 * @file lock_manager.js
 * @description Manages atomic locks per professional.
 */

const { Mutex } = require('async-mutex');

class LockManager {
  constructor() {
    this.locks = new Map();
  }

  /**
   * Get the mutex for a specific professional.
   * @param {string} professionalId 
   * @returns {Mutex}
   */
  getLock(professionalId) {
    if (!this.locks.has(professionalId)) {
      this.locks.set(professionalId, new Mutex());
    }
    return this.locks.get(professionalId);
  }
}

module.exports = new LockManager();
