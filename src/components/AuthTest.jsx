import { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import api from '../api/axios';

export default function AuthTest() {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test 1: Check if backend is reachable (no auth required)
      console.log("🧪 Test 1: Backend connectivity");
      const pingRes = await api.get('/test/ping');
      results.backendReachable = pingRes.status === 200;
      console.log("✅ Backend reachable:", pingRes.status === 200);

      // Test 2: Check if user is authenticated
      console.log("🧪 Test 2: User authentication");
      const user = auth.currentUser;
      results.userAuthenticated = !!user;
      results.userId = user?.uid || 'No user';
      console.log("✅ User authenticated:", !!user, "User ID:", user?.uid);

      // Test 3: Check if token can be generated
      if (user) {
        console.log("🧪 Test 3: Token generation");
        try {
          const token = await user.getIdToken();
          results.tokenGenerated = !!token;
          results.tokenLength = token?.length || 0;
          console.log("✅ Token generated:", !!token, "Length:", token?.length);
        } catch (error) {
          results.tokenGenerated = false;
          results.tokenError = error.message;
          console.error("❌ Token generation failed:", error);
        }
      }

      // Test 4: Test authenticated endpoint
      if (user) {
        console.log("🧪 Test 4: Authenticated endpoint");
        try {
          const authRes = await api.get('/faculty/test-auth');
          results.authenticatedEndpoint = authRes.status === 200;
          console.log("✅ Authenticated endpoint:", authRes.status === 200);
        } catch (error) {
          results.authenticatedEndpoint = false;
          results.authError = error.response?.status || error.message;
          console.error("❌ Authenticated endpoint failed:", error.response?.status, error.message);
        }
      }

    } catch (error) {
      console.error("❌ Test failed:", error);
      results.error = error.message;
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Authentication Test</h2>
      <button 
        onClick={runTests} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Running Tests...' : 'Run Tests'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Test Results:</h3>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 