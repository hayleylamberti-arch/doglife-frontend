// Force token refresh utility
export function forceTokenRefresh() {
  // Clear old token
  localStorage.removeItem('authToken');
  
  // Clear all cached queries
  if (window.queryClient) {
    window.queryClient.clear();
  }
  
  // Force page reload to reset authentication state
  window.location.reload();
}

// Check if token has correct structure
export function validateTokenStructure() {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  
  try {
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check if token has both id and userId fields
    return decodedPayload.id && decodedPayload.userId;
  } catch (error) {
    return false;
  }
}