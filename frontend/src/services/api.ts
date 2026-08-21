import { Campaign, EmailsResponse, QueueStatus, CreateCampaignPayload, UserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request<T>(endpoint: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || (data.errors && data.errors.map((e: any) => e.message).join(', ')) || 'Request failed';
    throw new Error(errorMsg);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Campaign APIs
  getCampaigns: (token?: string | null): Promise<Campaign[]> => {
    return request<Campaign[]>('/api/campaigns', { method: 'GET' }, token);
  },

  getCampaignById: (id: string, token?: string | null): Promise<Campaign> => {
    return request<Campaign>(`/api/campaigns/${id}`, { method: 'GET' }, token);
  },

  createCampaign: (payload: CreateCampaignPayload, token?: string | null): Promise<Campaign> => {
    return request<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  // Email APIs
  getEmails: (
    params: {
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
      campaignId?: string;
      sender?: string;
    } = {},
    token?: string | null
  ): Promise<EmailsResponse> => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'ALL') searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.campaignId) searchParams.append('campaignId', params.campaignId);
    if (params.sender) searchParams.append('sender', params.sender);

    const qs = searchParams.toString();
    return request<EmailsResponse>(`/api/emails${qs ? `?${qs}` : ''}`, { method: 'GET' }, token);
  },

  // Queue Status API
  getQueueStatus: (token?: string | null): Promise<QueueStatus> => {
    return request<QueueStatus>('/api/queue/status', { method: 'GET' }, token);
  },

  // Auth profile API
  getAuthMe: (token: string): Promise<UserProfile> => {
    return request<UserProfile>('/api/auth/me', { method: 'GET' }, token);
  },
};
