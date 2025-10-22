import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const isMockMode = () => localStorage.getItem('token') === 'mock-jwt-token-for-testing';

const mockGroups = [
  {
    id: 'group-1',
    name: 'Work',
    members: [
      { id: 'mock-user-1', name: 'Admin User', email: 'admin@gmail.com' },
      { id: 'user-2', name: 'John Doe', email: 'john@example.com' },
      { id: 'user-4', name: 'Bob Wilson', email: 'bob@example.com' },
    ],
    latestEventSummary: 'Office Lunch - $85.00',
    createdAt: '2025-10-15T10:00:00Z',
  },
  {
    id: 'group-2',
    name: 'Home',
    members: [
      { id: 'mock-user-1', name: 'Admin User', email: 'admin@gmail.com' },
      { id: 'user-3', name: 'Jane Smith', email: 'jane@example.com' },
      { id: 'user-5', name: 'Alice Brown', email: 'alice@example.com' },
    ],
    latestEventSummary: 'Monthly Groceries - $320.00',
    createdAt: '2025-10-10T14:30:00Z',
  },
  {
    id: 'group-3',
    name: 'Hostel',
    members: [
      { id: 'mock-user-1', name: 'Admin User', email: 'admin@gmail.com' },
      { id: 'user-2', name: 'John Doe', email: 'john@example.com' },
      { id: 'user-3', name: 'Jane Smith', email: 'jane@example.com' },
      { id: 'user-4', name: 'Bob Wilson', email: 'bob@example.com' },
    ],
    latestEventSummary: 'Weekend Trip - $850.00',
    createdAt: '2025-10-12T09:00:00Z',
  },
];

const mockEvents = [
  {
    id: 'event-1',
    groupId: 'group-1',
    title: 'Office Lunch',
    startDate: '2025-10-20T00:00:00Z',
    endDate: '2025-10-20T00:00:00Z',
    totalAmount: 85.00,
    createdAt: '2025-10-20T09:00:00Z',
  },
  {
    id: 'event-2',
    groupId: 'group-1',
    title: 'Team Building Activity',
    startDate: '2025-10-18T00:00:00Z',
    endDate: '2025-10-18T00:00:00Z',
    totalAmount: 150.00,
    createdAt: '2025-10-18T10:00:00Z',
  },
  {
    id: 'event-3',
    groupId: 'group-2',
    title: 'Monthly Groceries',
    startDate: '2025-10-15T00:00:00Z',
    endDate: '2025-10-15T00:00:00Z',
    totalAmount: 320.00,
    createdAt: '2025-10-15T08:00:00Z',
  },
  {
    id: 'event-4',
    groupId: 'group-2',
    title: 'Utility Bills',
    startDate: '2025-10-22T00:00:00Z',
    endDate: '2025-10-22T00:00:00Z',
    totalAmount: 180.00,
    createdAt: '2025-10-22T07:00:00Z',
  },
  {
    id: 'event-5',
    groupId: 'group-3',
    title: 'Weekend Trip',
    startDate: '2025-10-19T00:00:00Z',
    endDate: '2025-10-21T00:00:00Z',
    totalAmount: 850.00,
    createdAt: '2025-10-19T06:00:00Z',
  },
];

const mockSubEvents = [
  {
    id: 'subevent-1',
    eventId: 'event-1',
    title: 'Restaurant Bill',
    payerId: 'mock-user-1',
    payerName: 'Admin User',
    totalAmount: 85.00,
    sharers: [
      { userId: 'mock-user-1', userName: 'Admin User', amount: 28.33, status: 'CONFIRMED' },
      { userId: 'user-2', userName: 'John Doe', amount: 28.33, status: 'PAID' },
      { userId: 'user-4', userName: 'Bob Wilson', amount: 28.34, status: 'PENDING' },
    ],
    createdAt: '2025-10-20T13:00:00Z',
  },
  {
    id: 'subevent-2',
    eventId: 'event-2',
    title: 'Activity Tickets',
    payerId: 'user-2',
    payerName: 'John Doe',
    totalAmount: 150.00,
    sharers: [
      { userId: 'mock-user-1', userName: 'Admin User', amount: 50.00, status: 'PAID' },
      { userId: 'user-2', userName: 'John Doe', amount: 50.00, status: 'CONFIRMED' },
      { userId: 'user-4', userName: 'Bob Wilson', amount: 50.00, status: 'PAID' },
    ],
    createdAt: '2025-10-18T11:00:00Z',
  },
  {
    id: 'subevent-3',
    eventId: 'event-3',
    title: 'Supermarket Shopping',
    payerId: 'user-3',
    payerName: 'Jane Smith',
    totalAmount: 320.00,
    sharers: [
      { userId: 'mock-user-1', userName: 'Admin User', amount: 106.67, status: 'PENDING' },
      { userId: 'user-3', userName: 'Jane Smith', amount: 106.67, status: 'CONFIRMED' },
      { userId: 'user-5', userName: 'Alice Brown', amount: 106.66, status: 'PENDING' },
    ],
    createdAt: '2025-10-15T15:00:00Z',
  },
  {
    id: 'subevent-4',
    eventId: 'event-4',
    title: 'Electricity Bill',
    payerId: 'mock-user-1',
    payerName: 'Admin User',
    totalAmount: 120.00,
    sharers: [
      { userId: 'mock-user-1', userName: 'Admin User', amount: 40.00, status: 'CONFIRMED' },
      { userId: 'user-3', userName: 'Jane Smith', amount: 40.00, status: 'PAID' },
      { userId: 'user-5', userName: 'Alice Brown', amount: 40.00, status: 'PAID' },
    ],
    createdAt: '2025-10-22T08:00:00Z',
  },
  {
    id: 'subevent-5',
    eventId: 'event-4',
    title: 'Internet Bill',
    payerId: 'user-5',
    payerName: 'Alice Brown',
    totalAmount: 60.00,
    sharers: [
      { userId: 'mock-user-1', userName: 'Admin User', amount: 20.00, status: 'PENDING' },
      { userId: 'user-3', userName: 'Jane Smith', amount: 20.00, status: 'PENDING' },
      { userId: 'user-5', userName: 'Alice Brown', amount: 20.00, status: 'CONFIRMED' },
    ],
    createdAt: '2025-10-22T08:30:00Z',
  },
  {
    id: 'subevent-6',
    eventId: 'event-5',
    title: 'Hotel Booking',
    payerId: 'mock-user-1',
    payerName: 'Admin User',
    totalAmount: 480.00,
    sharers: [
      { userId: 'mock-user-1', userName: 'Admin User', amount: 120.00, status: 'CONFIRMED' },
      { userId: 'user-2', userName: 'John Doe', amount: 120.00, status: 'PAID' },
      { userId: 'user-3', userName: 'Jane Smith', amount: 120.00, status: 'PAID' },
      { userId: 'user-4', userName: 'Bob Wilson', amount: 120.00, status: 'PENDING' },
    ],
    createdAt: '2025-10-19T07:00:00Z',
  },
  {
    id: 'subevent-7',
    eventId: 'event-5',
    title: 'Transport (Cab)',
    payerId: 'user-2',
    payerName: 'John Doe',
    totalAmount: 200.00,
    sharers: [
      { userId: 'mock-user-1', userName: 'Admin User', amount: 50.00, status: 'PENDING' },
      { userId: 'user-2', userName: 'John Doe', amount: 50.00, status: 'CONFIRMED' },
      { userId: 'user-3', userName: 'Jane Smith', amount: 50.00, status: 'PENDING' },
      { userId: 'user-4', userName: 'Bob Wilson', amount: 50.00, status: 'PENDING' },
    ],
    createdAt: '2025-10-19T09:00:00Z',
  },
  {
    id: 'subevent-8',
    eventId: 'event-5',
    title: 'Meals & Snacks',
    payerId: 'user-3',
    payerName: 'Jane Smith',
    totalAmount: 170.00,
    sharers: [
      { userId: 'mock-user-1', userName: 'Admin User', amount: 42.50, status: 'PENDING' },
      { userId: 'user-2', userName: 'John Doe', amount: 42.50, status: 'PENDING' },
      { userId: 'user-3', userName: 'Jane Smith', amount: 42.50, status: 'CONFIRMED' },
      { userId: 'user-4', userName: 'Bob Wilson', amount: 42.50, status: 'PENDING' },
    ],
    createdAt: '2025-10-20T12:00:00Z',
  },
];

const mockUsers = [
  { id: 'mock-user-1', name: 'Admin User', email: 'admin@gmail.com' },
  { id: 'user-2', name: 'John Doe', email: 'john@example.com' },
  { id: 'user-3', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 'user-4', name: 'Bob Wilson', email: 'bob@example.com' },
  { id: 'user-5', name: 'Alice Brown', email: 'alice@example.com' },
];

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string) => {
    if (email === 'admin@gmail.com' && password === '1234') {
      return {
        data: {
          token: 'mock-jwt-token-for-testing',
          user: {
            id: 'mock-user-1',
            name: 'Admin User',
            email: 'admin@gmail.com',
          },
        },
      };
    }
    return api.post('/auth/login', { email, password });
  },
  signup: (name: string, email: string, password: string) =>
    api.post('/auth/signup', { name, email, password }),
};

export const groupAPI = {
  getAll: () => {
    if (isMockMode()) {
      return Promise.resolve({ data: mockGroups });
    }
    return api.get('/groups');
  },
  getById: (id: string) => {
    if (isMockMode()) {
      const group = mockGroups.find(g => g.id === id);
      return Promise.resolve({ data: group || mockGroups[0] });
    }
    return api.get(`/groups/${id}`);
  },
  create: (name: string, memberIds: string[]) => {
    if (isMockMode()) {
      const newGroup = {
        id: `group-${Date.now()}`,
        name,
        members: mockUsers.filter(u => memberIds.includes(u.id) || u.id === 'mock-user-1'),
        latestEventSummary: 'No events yet',
        createdAt: new Date().toISOString(),
      };
      mockGroups.push(newGroup);
      return Promise.resolve({ data: newGroup });
    }
    return api.post('/groups', { name, memberIds });
  },
  join: (groupId: string) => api.post(`/groups/${groupId}/join`),
};

export const eventAPI = {
  getByGroup: (groupId: string, startDate: string, endDate: string) => {
    if (isMockMode()) {
      const filtered = mockEvents.filter(e => e.groupId === groupId);
      return Promise.resolve({ data: filtered });
    }
    return api.get(`/groups/${groupId}/events`, { params: { startDate, endDate } });
  },
  getById: (id: string) => {
    if (isMockMode()) {
      const event = mockEvents.find(e => e.id === id);
      return Promise.resolve({ data: event || mockEvents[0] });
    }
    return api.get(`/events/${id}`);
  },
  create: (groupId: string, title: string, startDate: string, endDate: string) => {
    if (isMockMode()) {
      const newEvent = {
        id: `event-${Date.now()}`,
        groupId,
        title,
        startDate,
        endDate,
        totalAmount: 0,
        createdAt: new Date().toISOString(),
      };
      mockEvents.push(newEvent);
      return Promise.resolve({ data: newEvent });
    }
    return api.post('/events', { groupId, title, startDate, endDate });
  },
};

export const subEventAPI = {
  getByEvent: (eventId: string) => {
    if (isMockMode()) {
      const filtered = mockSubEvents.filter(s => s.eventId === eventId);
      return Promise.resolve({ data: filtered });
    }
    return api.get(`/events/${eventId}/subevents`);
  },
  create: (data: {
    eventId: string;
    title: string;
    totalAmount: number;
    sharerIds: string[];
    splitType: 'EQUAL' | 'CUSTOM';
    customAmounts?: Record<string, number>;
  }) => {
    if (isMockMode()) {
      const perPerson = data.splitType === 'EQUAL'
        ? data.totalAmount / data.sharerIds.length
        : 0;

      const newSubEvent = {
        id: `subevent-${Date.now()}`,
        eventId: data.eventId,
        title: data.title,
        payerId: 'mock-user-1',
        payerName: 'Admin User',
        totalAmount: data.totalAmount,
        sharers: data.sharerIds.map(id => {
          const user = mockUsers.find(u => u.id === id);
          return {
            userId: id,
            userName: user?.name || 'Unknown',
            amount: data.splitType === 'EQUAL'
              ? perPerson
              : (data.customAmounts?.[id] || 0),
            status: 'PENDING' as const,
          };
        }),
        createdAt: new Date().toISOString(),
      };
      mockSubEvents.push(newSubEvent);
      return Promise.resolve({ data: newSubEvent });
    }
    return api.post('/subevents', data);
  },
  updateShareStatus: (subEventId: string, status: 'PAID' | 'CONFIRMED') => {
    if (isMockMode()) {
      const subEvent = mockSubEvents.find(s => s.id === subEventId);
      if (subEvent) {
        const userShare = subEvent.sharers.find(s => s.userId === 'mock-user-1');
        if (userShare) {
          userShare.status = status;
        }
      }
      return Promise.resolve({ data: { success: true } });
    }
    return api.patch(`/subevents/${subEventId}/status`, { status });
  },
};

export const userAPI = {
  search: (query: string) => {
    if (isMockMode()) {
      const filtered = mockUsers.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      );
      return Promise.resolve({ data: filtered });
    }
    return api.get('/users/search', { params: { q: query } });
  },
  getAll: () => {
    if (isMockMode()) {
      return Promise.resolve({ data: mockUsers });
    }
    return api.get('/users');
  },
};

export default api;
