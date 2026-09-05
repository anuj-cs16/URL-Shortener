import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

export const aiApi = {
  getSmartSuggestions: async (longUrl) => {
    const res = await axios.post(`${API_BASE_URL}/api/ai/suggestions`, { longUrl }, getAuthHeaders());
    return res.data;
  },

  checkUrlSafety: async (longUrl) => {
    const res = await axios.post(`${API_BASE_URL}/api/ai/safety-check`, { longUrl }, getAuthHeaders());
    return res.data;
  },

  getUrlPredictions: async (shortCode) => {
    const res = await axios.get(`${API_BASE_URL}/api/ai/predictions/${shortCode}`, getAuthHeaders());
    return res.data;
  },

  buildSmartUtm: async (longUrl, goal, channel) => {
    const res = await axios.post(`${API_BASE_URL}/api/ai/utm-builder`, { longUrl, goal, channel }, getAuthHeaders());
    return res.data;
  },

  sendCopilotMessage: async (message, conversationId = null) => {
    const res = await axios.post(`${API_BASE_URL}/api/ai/copilot`, { message, conversationId }, getAuthHeaders());
    return res.data;
  },

  getCopilotHistory: async () => {
    const res = await axios.get(`${API_BASE_URL}/api/ai/copilot/history`, getAuthHeaders());
    return res.data;
  },
};
