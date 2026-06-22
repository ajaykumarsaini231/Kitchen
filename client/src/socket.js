import { io } from 'socket.io-client';
import { API_URL } from './api.js';

// Single shared socket. Auto-reconnects by default.
export const socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
});
