/**
 * Pub/sub event bus. Decouples module communication.
 * No external dependencies.
 */
const EventBus = {
  _listeners: {},

  on(event, callback) {
    (this._listeners[event] ??= []).push(callback);
  },

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  },

  emit(event, payload) {
    (this._listeners[event] ?? []).forEach(cb => cb(payload));
  },

  /** Remove all listeners for an event (or all events if no arg) */
  clear(event) {
    if (event) {
      delete this._listeners[event];
    } else {
      this._listeners = {};
    }
  }
};

export default EventBus;
