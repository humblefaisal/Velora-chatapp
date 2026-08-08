import { io } from 'socket.io-client';

const rawApi = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

export const API_URL = rawApi.trim().replace(/\/$/, '');

export const createSocket = () => {
  return io(API_URL, {
    autoConnect: false,
    timeout: 5000,
    transports: ['websocket', 'polling'],
  });
};
