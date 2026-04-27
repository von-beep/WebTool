// API functions for MySQL backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API call failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Auth functions
export const loginUser = async (email, password) => {
  return await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

// Data functions
export const getAllData = async () => {
  return await apiCall('/data');
};

export const addUser = async (user) => {
  return await apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(user)
  });
};

export const addPendingUser = async (user) => {
  return await apiCall('/pending-users', {
    method: 'POST',
    body: JSON.stringify(user)
  });
};

export const approveUser = async (userId) => {
  return await apiCall('/approve-user', {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
};

export const denyUser = async (userId) => {
  return await apiCall(`/pending-users/${userId}`, {
    method: 'DELETE'
  });
};

export const addLog = async (log) => {
  console.log('Adding log via API:', log);
  return await apiCall('/logs', {
    method: 'POST',
    body: JSON.stringify(log)
  });
};

export const addHolidayRequest = async (request) => {
  return await apiCall('/holiday-requests', {
    method: 'POST',
    body: JSON.stringify(request)
  });
};

export const updateHolidayRequest = async (id, status) => {
  console.log('Making API call to update holiday request:', id, status);
  return await apiCall(`/holiday-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};

export const addLeaveApplication = async (application) => {
  return await apiCall('/leave-applications', {
    method: 'POST',
    body: JSON.stringify(application)
  });
};

export const updateLeaveApplication = async (id, status) => {
  console.log('Making API call to update leave application:', id, status);
  return await apiCall(`/leave-applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};

export const updateUserStatus = async (userId, status) => {
  return await apiCall(`/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const resetUserPassword = async (userId, password) => {
  return await apiCall(`/users/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
};

export const updateUserLeaveCredits = async (userId, credits) => {
  return await apiCall(`/users/${userId}/leave-credits`, {
    method: 'PUT',
    body: JSON.stringify({ credits }),
  });
};

// Mock Firebase compatibility (for minimal changes to frontend)
export const auth = {
  currentUser: { uid: 'anonymous', email: 'anonymous@example.com', isAnonymous: true }
};

export const onAuthStateChanged = (authInstance, callback) => {
  // Simulate auth state change with anonymous user
  callback(auth.currentUser);
  return () => {};
};

export const signInAnonymously = async () => {
  return { user: auth.currentUser };
};

export const signInWithCustomToken = async () => {
  return { user: auth.currentUser };
};

// Mock Firestore functions
export const db = {};
export const doc = () => ({});
export const setDoc = async () => {};
export const onSnapshot = (docRef, callback) => {
  // Get data from API and call callback
  const fetchData = async () => {
    try {
      const data = await getAllData();
      callback({
        exists: () => true,
        data: () => data
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  fetchData();
  // Set up polling to automatically refresh data every 5 seconds
  const intervalId = setInterval(fetchData, 5000);

  // Return an unsubscribe function to clean up the interval when the component unmounts
  return () => {
    clearInterval(intervalId);
  };
};

export const updateDoc = async (docRef, updates) => {
  // Handle different update operations
  const operation = Object.keys(updates)[0];
  const data = updates[operation];

  try {
    if (operation === 'users' && data.__type === 'union' && updates.pendingUsers?.__type === 'remove') {
      // This block seems to handle user approval, but it's complex.
      // A dedicated `approveUser` call from the component is cleaner.
      // Assuming `approveUser` is called directly now based on frontend logic.
      const userToApproveId = updates.pendingUsers.items[0]?.id;
      if (userToApproveId) {
        await approveUser(userToApproveId);
      }
    } else if (operation === 'pendingUsers' && data.__type === 'remove') {
      const userToDenyId = data.items[0]?.id;
      if (userToDenyId) await denyUser(userToDenyId);
    } else if (operation === 'logs') {
      await addLog(data);
    } else if (operation === 'holidayRequests' && data.__type === 'update') {
      await updateHolidayRequest(data.id, data.status);
    } else if (operation === 'holidayRequests' && data.__type === 'union') {
      await addHolidayRequest(data.items[0]);
    } else if (operation === 'leaveApplications' && data.__type === 'update') {
      await updateLeaveApplication(data.id, data.status);
    } else if (operation === 'leaveApplications' && data.__type === 'union') {
      await addLeaveApplication(data.items[0]);
    }
  } catch (error) {
    console.error('Update operation failed:', error);
  }
};

export const arrayUnion = (...items) => ({ __type: 'union', items });
export const arrayRemove = (...items) => ({ __type: 'remove', items });

export const appId = 'nexus-portal-mysql-v1';