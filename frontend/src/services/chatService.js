import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Send a query to the Krishi Mitra chat API
 * @param {string} query - User's message
 * @param {Array} history - Previous messages
 * @returns {Promise<string>} AI response
 */
export const sendChatMessage = async (query, history = [], language = 'en') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/chat`,
      { query, history, language },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data.response;
  } catch (error) {
    console.error('Chat error:', error);
    throw error.response?.data?.message || 'Failed to connect to Krishi Mitra';
  }
};
