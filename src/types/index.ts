export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Group {
  id: string;
  name: string;
  members: User[];
  createdAt: string;
  latestEventSummary?: string;
}

export interface Event {
  id: string;
  title: string;
  groupId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  createdAt: string;
}

export interface ShareStatus {
  userId: string;
  userName: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CONFIRMED';
}

export interface SubEvent {
  id: string;
  eventId: string;
  title: string;
  payerId: string;
  payerName: string;
  totalAmount: number;
  sharers: ShareStatus[];
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
