// Local Database Implementation
// Using localStorage for persistence

const STORAGE_KEYS = {
  USERS: 'nexus_users',
  PENDING_USERS: 'nexus_pending_users',
  LOGS: 'nexus_logs',
  HOLIDAY_REQUESTS: 'nexus_holiday_requests',
  CURRENT_USER: 'nexus_current_user'
};

// Helper functions
const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return [];
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
};

// Mock Firebase Auth
export const auth = {
  currentUser: null
};

export const onAuthStateChanged = (authInstance, callback) => {
  // Simulate auth state change
  const user = getFromStorage(STORAGE_KEYS.CURRENT_USER);
  auth.currentUser = user;
  callback(user);
  // Return unsubscribe function
  return () => {};
};

export const signInAnonymously = async () => {
  // Create anonymous user
  const anonymousUser = {
    uid: 'anonymous-' + Date.now(),
    email: 'anonymous@example.com',
    isAnonymous: true
  };
  auth.currentUser = anonymousUser;
  saveToStorage(STORAGE_KEYS.CURRENT_USER, anonymousUser);
  return { user: anonymousUser };
};

export const signInWithCustomToken = async (token) => {
  // Mock custom token sign in
  const user = {
    uid: 'custom-' + Date.now(),
    email: 'custom@example.com'
  };
  auth.currentUser = user;
  saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  return { user };
};

// Mock Firestore
export const db = {};

export const doc = (db, path) => ({
  path,
  id: path.split('/').pop()
});

export const setDoc = async (docRef, data) => {
  // Mock setDoc - for initialization
  console.log('Mock setDoc:', docRef.path, data);
};

export const onSnapshot = (docRef, callback) => {
  // Mock real-time listener - just return current data
  const getData = () => ({
    users: getFromStorage(STORAGE_KEYS.USERS),
    pendingUsers: getFromStorage(STORAGE_KEYS.PENDING_USERS),
    logs: getFromStorage(STORAGE_KEYS.LOGS),
    holidayRequests: getFromStorage(STORAGE_KEYS.HOLIDAY_REQUESTS)
  });

  callback({
    exists: () => true,
    data: getData
  });

  // Return unsubscribe function
  return () => {};
};

export const updateDoc = async (docRef, updates) => {
  // Handle different update operations
  Object.keys(updates).forEach(key => {
    const value = updates[key];
    let storageKey;

    switch (key) {
      case 'users':
        storageKey = STORAGE_KEYS.USERS;
        break;
      case 'pendingUsers':
        storageKey = STORAGE_KEYS.PENDING_USERS;
        break;
      case 'logs':
        storageKey = STORAGE_KEYS.LOGS;
        break;
      case 'holidayRequests':
        storageKey = STORAGE_KEYS.HOLIDAY_REQUESTS;
        break;
      default:
        return;
    }

    const currentData = getFromStorage(storageKey);

    if (value && typeof value === 'object' && value.__type) {
      if (value.__type === 'union') {
        // Array union operation
        const newData = [...currentData, ...value.items];
        saveToStorage(storageKey, newData);
      } else if (value.__type === 'remove') {
        // Array remove operation
        const filteredData = currentData.filter(item => 
          !value.items.some(removeItem => removeItem.id === item.id)
        );
        saveToStorage(storageKey, filteredData);
      }
    } else if (Array.isArray(value)) {
      // Direct array replacement
      saveToStorage(storageKey, value);
    } else {
      // Single item addition
      const newData = [...currentData, value];
      saveToStorage(storageKey, newData);
    }
  });
};

export const arrayUnion = (...items) => {
  // Mock arrayUnion - return special object
  return { __type: 'union', items };
};

export const arrayRemove = (...items) => {
  // Mock arrayRemove - return special object
  return { __type: 'remove', items };
};

// App configuration
export const appId = 'nexus-portal-local-v1';