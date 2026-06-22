// Shared Socket.IO instance holder so route handlers can emit events without
// threading `io` through the app factory.
let _io = null;
export function setIo(io) {
  _io = io;
}
export function getIo() {
  return _io;
}
