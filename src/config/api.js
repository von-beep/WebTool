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
  // Set up polling for real-time updates (every 2 seconds)
  const interval = setInterval(fetchData, 2000);

  return () => clearInterval(interval);
};

export const updateDoc = async (docRef, updates) => {
  // Handle different update operations
  try {
    // Check for user approval: users has union and pendingUsers has remove
    if (updates.users && updates.users.__type === 'union' &&
        updates.pendingUsers && updates.pendingUsers.__type === 'remove') {
      // Approve user operation
      const userToApprove = updates.pendingUsers.items[0];
      if (userToApprove) {
        await approveUser(userToApprove.id);
      }
    } else if (updates.pendingUsers && updates.pendingUsers.__type === 'remove') {
      // Deny user operation
      const userToDeny = updates.pendingUsers.items[0];
      if (userToDeny) {
        await denyUser(userToDeny.id);
      }
    } else if (updates.logs) {
      // Add log
      console.log('Processing logs update:', updates.logs);
      if (Array.isArray(updates.logs)) {
        for (const log of updates.logs) {
          await addLog(log);
        }
      } else {
        await addLog(updates.logs);
      }
    } else if (updates.holidayRequests && updates.holidayRequests.__type === 'update') {
      // Update holiday request status
      const requestId = updates.holidayRequests.id;
      const status = updates.holidayRequests.status;
      console.log('Updating holiday request:', requestId, 'to status:', status);
      await updateHolidayRequest(requestId, status);
    } else if (updates.holidayRequests) {
      // Add holiday request
      if (Array.isArray(updates.holidayRequests)) {
        for (const request of updates.holidayRequests) {
          await addHolidayRequest(request);
        }
      } else if (updates.holidayRequests && typeof updates.holidayRequests === 'object' && !updates.holidayRequests.__type) {
        await addHolidayRequest(updates.holidayRequests);
      }
    } else if (updates.leaveApplications && updates.leaveApplications.__type === 'update') {
      // Update leave application status
      const applicationId = updates.leaveApplications.id;
      const status = updates.leaveApplications.status;
      console.log('Updating leave application:', applicationId, 'to status:', status);
      await updateLeaveApplication(applicationId, status);
    } else if (updates.leaveApplications) {
      // Add leave application
      if (Array.isArray(updates.leaveApplications)) {
        for (const application of updates.leaveApplications) {
          await addLeaveApplication(application);
        }
      } else if (updates.leaveApplications && typeof updates.leaveApplications === 'object' && !updates.leaveApplications.__type) {
        await addLeaveApplication(updates.leaveApplications);
      }
    }
  } catch (error) {
    console.error('Update operation failed:', error);
  }
};

export const arrayUnion = (...items) => ({ __type: 'union', items });
export const arrayRemove = (...items) => ({ __type: 'remove', items });

export const appId = 'nexus-portal-mysql-v1';