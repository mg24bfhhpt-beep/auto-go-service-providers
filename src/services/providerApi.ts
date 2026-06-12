import api from './api';

export const providerApi = {
  // Auth
  login: (phone: string, password?: string) => 
    api.post('/providers/auth/login', { phone, password }),
  
  register: (data: any) => 
    api.post('/providers/auth/register', data),

  // Orders
  getPendingRequests: () => 
    api.get('/providers/requests'),
    
  getMyOrders: () => 
    api.get('/providers/my-orders'),

  acceptOrder: (orderId: string) => 
    api.post('/providers/accept', { orderId }),

  rejectOrder: (orderId: string) => 
    api.post('/providers/reject', { orderId }),

  updateStatus: (orderId: string, status: string, notes?: string) => 
    api.post('/providers/update-status', { orderId, status, notes }),

  updateLocation: (orderId: string, lat: number, lng: number) => 
    api.post('/providers/update-location', { orderId, lat, lng }),

  setOnlineStatus: (isOnline: boolean) => 
    api.post('/providers/set-status', { isOnline }),

  saveDiagnosis: (data: any) => 
    api.post('/providers/save-diagnosis', data),

  getProfile: () => 
    api.get('/providers/profile'),

  // Invoices
  generateInvoice: (data: any) => 
    api.post('/invoice/generate', data),
    
  getInvoice: (orderId: string) => 
    api.get(`/invoice/${orderId}`),
};
