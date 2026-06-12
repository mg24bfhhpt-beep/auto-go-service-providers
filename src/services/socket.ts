import { io, Socket } from 'socket.io-client';
import { CONFIG } from './config';

class SocketService {
  public socket: Socket | null = null;
  private currentDriverId: string | null = null;

  connect(driverId: string) {
    if (this.socket?.connected) {
      if (this.currentDriverId !== driverId) {
        this.socket.emit('join:provider', driverId);
        this.currentDriverId = driverId;
      }
      return this.socket;
    }

    this.socket = io(CONFIG.SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server:', this.socket?.id);
      this.socket?.emit('join:provider', driverId);
      this.socket?.emit('provider:online', driverId);
      this.currentDriverId = driverId;
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (this.currentDriverId) {
        this.socket.emit('provider:offline', this.currentDriverId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.currentDriverId = null;
    }
  }

  emitLocation(orderId: string, lat: number, lng: number) {
    if (!this.socket || !this.currentDriverId) return;
    this.socket.emit('driver:location', {
      orderId,
      driverId: this.currentDriverId,
      lat,
      lng,
    });
  }

  joinOrder(orderId: string) {
    this.socket?.emit('join:order', orderId);
  }
}

export default new SocketService();
