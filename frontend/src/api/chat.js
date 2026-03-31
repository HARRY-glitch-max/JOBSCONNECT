import apiClient from "./client";

/**
 * All paths below are relative to the baseURL defined in client.js ('/api').
 * These functions handle communication with the Backend Chat Controller.
 * All routes are now protected and require a Bearer Token in the header.
 */

/**
 * ✅ Fetch all unique conversations for the sidebar (Inbox style)
 * Returns formatted inbox items with last message and contact details.
 */
export const getUserChats = async (userId) => {
  try {
    // Matches: GET /api/chats/user/:userId
    const { data } = await apiClient.get(`/chats/user/${userId}`);
    return data;
  } catch (error) {
    console.error("Error fetching inbox:", error?.response?.data || error.message);
    throw error;
  }
};

/**
 * ✅ Fetch full message history between two specific users
 * Used by ChatPage.jsx to populate the message bubbles.
 */
export const getChatHistory = async (senderId, receiverId) => {
  try {
    // Matches: GET /api/chats/history/:senderId/:receiverId
    const { data } = await apiClient.get(`/chats/history/${senderId}/${receiverId}`);
    return data;
  } catch (error) {
    console.error("Error fetching chat history:", error?.response?.data || error.message);
    throw error;
  }
};

/**
 * ✅ Alias for getChatHistory 
 * Ensures compatibility with the 'import { getMessages }' statement in ChatPage.jsx.
 */
export const getMessages = getChatHistory;

/**
 * ✅ Send a new message
 * @param {Object} payload - { senderId, receiverId, message, senderType }
 */
export const sendMessage = async (payload) => {
  try {
    /** * 🚀 CRITICAL FIX: 
     * Changed from "/chats" to "/chats/send" to match chatRoutes.js 
     */
    const { data } = await apiClient.post("/chats/send", payload);
    return data;
  } catch (error) {
    // Log the specific error from the backend (e.g., 403 Access Denied)
    console.error("Error sending message:", error?.response?.data || error.message);
    throw error;
  }
};

/**
 * ✅ Mark messages as read
 * Call this when a user clicks on a conversation to clear notifications.
 */
export const markAsRead = async (userId, senderId) => {
  try {
    // Matches: PUT /api/chats/read/:userId/:senderId
    const { data } = await apiClient.put(`/chats/read/${userId}/${senderId}`);
    return data;
  } catch (error) {
    console.warn("Could not mark messages as read:", error?.response?.data || error.message);
    return null;
  }
};