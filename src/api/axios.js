import axios from "axios";
import { auth } from "../firebase/firebase";

const api = axios.create({
  baseURL: "/api"  // Use Vite proxy instead of direct localhost
});

api.interceptors.request.use(
  async (config) => {
    console.log("🔍 Auth interceptor triggered for:", config.url);
    console.log("🔍 Request method:", config.method?.toUpperCase());
    console.log("🔍 Request timestamp:", new Date().toISOString());
    
    const user = auth.currentUser;
    console.log("👤 Current user:", user ? `User ID: ${user.uid}` : "No user logged in");
    
    if (user) {
      try {
        const token = await user.getIdToken();
        console.log("🎫 Token obtained:", token ? "✅ Success" : "❌ Failed");
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("🔐 Authorization header set:", config.headers.Authorization ? "✅ Yes" : "❌ No");
          console.log("🔐 Full request config:", {
            url: config.url,
            method: config.method,
            headers: config.headers
          });
        }
      } catch (error) {
        console.error("❌ Error getting token:", error);
      }
    } else {
      console.log("⚠️ No current user found - authentication will fail");
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response received:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Response error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message
    });
    
    if (error.response?.status === 403) {
      console.error("🚫 403 Forbidden - Authentication/Authorization issue");
      console.error("🔍 Check if user is logged in and token is valid");
    }
    
    return Promise.reject(error);
  }
);

export default api; 