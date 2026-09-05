import { Spot, User, StayRequest, MessageThread, CommunityPost, Review, ReportItem } from "../types";

const API_BASE = "/api";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || `HTTP error ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Health
  checkHealth: async () => {
    return request<any>("/health");
  },

  // Spots
  getSpots: async (filters?: Record<string, string>): Promise<Spot[]> => {
    const params = new URLSearchParams(filters || {}).toString();
    const query = params ? `?${params}` : "";
    return request<Spot[]>(`/spots${query}`);
  },
  getSpotById: async (id: string): Promise<Spot> => {
    return request<Spot>(`/spots/${id}`);
  },
  createSpot: async (spotData: Partial<Spot>): Promise<Spot> => {
    return request<Spot>("/spots", {
      method: "POST",
      body: JSON.stringify(spotData),
    });
  },
  submitSpot: async (payload: {
    spot: Partial<Spot>;
    submitterName?: string;
    submitterEmail?: string;
    submitterPhone?: string;
    visibility?: 'public' | 'personal';
    notes?: string;
  }): Promise<{ success: boolean; data: Spot; emailSent: boolean; message: string }> => {
    return request<{ success: boolean; data: Spot; emailSent: boolean; message: string }>("/spots/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateSpot: async (id: string, updates: Partial<Spot>): Promise<Spot> => {
    return request<Spot>(`/spots/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },
  deleteSpot: async (id: string): Promise<void> => {
    await request(`/spots/${id}`, { method: "DELETE" });
  },

  // Users & Auth
  getUsers: async (): Promise<User[]> => {
    return request<User[]>("/auth/users");
  },
  registerUser: async (userData: Partial<User>): Promise<User> => {
    return request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    return request<User>(`/auth/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  // Requests
  getRequests: async (query?: { travelerId?: string; hostId?: string }): Promise<StayRequest[]> => {
    const params = new URLSearchParams(query as any || {}).toString();
    const q = params ? `?${params}` : "";
    return request<StayRequest[]>(`/requests${q}`);
  },
  createRequest: async (reqData: Partial<StayRequest>): Promise<StayRequest> => {
    return request<StayRequest>("/requests", {
      method: "POST",
      body: JSON.stringify(reqData),
    });
  },
  updateRequest: async (id: string, updates: Partial<StayRequest>): Promise<StayRequest> => {
    return request<StayRequest>(`/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  // Message Threads
  getThreads: async (userId?: string): Promise<MessageThread[]> => {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return request<MessageThread[]>(`/threads${q}`);
  },
  createThread: async (threadData: Partial<MessageThread>): Promise<MessageThread> => {
    return request<MessageThread>("/threads", {
      method: "POST",
      body: JSON.stringify(threadData),
    });
  },
  sendMessage: async (threadId: string, msgData: any): Promise<any> => {
    return request(`/threads/${threadId}/messages`, {
      method: "POST",
      body: JSON.stringify(msgData),
    });
  },
  markThreadRead: async (threadId: string, userId: string): Promise<void> => {
    await request(`/threads/${threadId}/read`, {
      method: "PATCH",
      body: JSON.stringify({ userId }),
    });
  },

  // Community Posts
  getPosts: async (category?: string): Promise<CommunityPost[]> => {
    const q = category && category !== "all" ? `?category=${encodeURIComponent(category)}` : "";
    return request<CommunityPost[]>(`/posts${q}`);
  },
  createPost: async (postData: Partial<CommunityPost>): Promise<CommunityPost> => {
    return request<CommunityPost>("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  },
  upvotePost: async (id: string, userId: string): Promise<CommunityPost> => {
    return request<CommunityPost>(`/posts/${id}/upvote`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },
  addComment: async (postId: string, commentData: any): Promise<any> => {
    return request(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  },

  // Reviews
  getReviews: async (spotId?: string): Promise<Review[]> => {
    const q = spotId ? `?spotId=${encodeURIComponent(spotId)}` : "";
    return request<Review[]>(`/reviews${q}`);
  },
  createReview: async (reviewData: Partial<Review>): Promise<Review> => {
    return request<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  },

  // Safety Reports
  getReports: async (): Promise<ReportItem[]> => {
    return request<ReportItem[]>("/reports");
  },
  createReport: async (reportData: Partial<ReportItem>): Promise<ReportItem> => {
    return request<ReportItem>("/reports", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  },
  updateReport: async (id: string, updates: Partial<ReportItem>): Promise<ReportItem> => {
    return request<ReportItem>(`/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },
};