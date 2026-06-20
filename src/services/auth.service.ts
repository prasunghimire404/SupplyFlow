import AsyncStorage from "@react-native-async-storage/async-storage";
import { get as dbGet, ref as dbRef, set as dbSet } from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { rtdb, storage } from "./firebase";

export interface SignUpData {
  ownerName: string;
  businessName: string;
  email: string;
  address: string;
  phone: string;
  password: string;
  photoUri?: string | null;
}

export interface SignInData {
  email: string;
  password: string;
}

type AuthStateCallback = (user: any | null) => void;
const listeners = new Set<AuthStateCallback>();
let cachedUser: any | null = null;
let initialized = false;

// Load persisted user on startup
const initAuth = async () => {
  try {
    const stored = await AsyncStorage.getItem("currentUser");
    if (stored) {
      cachedUser = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load initial auth state", e);
  } finally {
    initialized = true;
    listeners.forEach((cb) => cb(cachedUser));
  }
};

initAuth();

const setAuthState = async (user: any | null) => {
  cachedUser = user;
  if (user) {
    await AsyncStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem("currentUser");
  }
  listeners.forEach((cb) => cb(user));
};

export const authService = {
  async signUp(data: SignUpData): Promise<any> {
    const {
      ownerName,
      businessName,
      email,
      address,
      phone,
      password,
      photoUri,
    } = data;

    // Check if email already registered in RTDB
    const safeEmail = email.toLowerCase().replace(/\./g, "_");
    const existingUidSnap = await dbGet(dbRef(rtdb, `emails/${safeEmail}`));
    if (existingUidSnap.exists()) {
      throw new Error("Email already registered");
    }

    const uid = `user_${Date.now()}`;

    let photoURL: string | null = null;
    if (photoUri) {
      try {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const imageRef = storageRef(storage, `users/${uid}/avatar.jpg`);
        await uploadBytes(imageRef, blob);
        photoURL = await getDownloadURL(imageRef);
      } catch (storageErr) {
        console.warn("Storage upload failed, using local URI:", storageErr);
        photoURL = photoUri;
      }
    }

    const timestamp = Date.now();
    const workspaceId = `${uid}_default`;

    const userProfile = {
      uid,
      ownerName,
      businessName,
      email,
      address,
      phone,
      password,
      photoURL,
      activeWorkspaceId: workspaceId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Save mapping, user profile, and default workspace in RTDB
    await dbSet(dbRef(rtdb, `emails/${safeEmail}`), uid);
    await dbSet(dbRef(rtdb, `users/${uid}`), userProfile);
    await dbSet(dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}`), {
      name: businessName || "My Business",
      ownerId: uid,
      type: "business",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await dbSet(
      dbRef(
        rtdb,
        `users/${uid}/workspaces/${workspaceId}/collaborators/${uid}`,
      ),
      {
        role: "owner",
        joinedAt: timestamp,
        name: ownerName,
        email,
      },
    );

    await setAuthState(userProfile);
    return userProfile;
  },

  async signIn(data: SignInData): Promise<any> {
    const { email, password } = data;
    const safeEmail = email.toLowerCase().replace(/\./g, "_");

    const uidSnap = await dbGet(dbRef(rtdb, `emails/${safeEmail}`));
    const uid = uidSnap.val();
    if (!uid) {
      throw new Error("No user found with this email");
    }

    const userSnap = await dbGet(dbRef(rtdb, `users/${uid}`));
    const user = userSnap.val();
    if (!user || user.password !== password) {
      throw new Error("Incorrect password");
    }

    await setAuthState(user);
    return user;
  },

  async signOut(): Promise<void> {
    await setAuthState(null);
  },

  getCurrentUser(): any | null {
    return cachedUser;
  },

  onAuthStateChanged(callback: (user: any | null) => void) {
    listeners.add(callback);
    if (initialized) {
      callback(cachedUser);
    }
    return () => {
      listeners.delete(callback);
    };
  },

  async getUserProfile(uid: string) {
    const snap = await dbGet(dbRef(rtdb, `users/${uid}`));
    if (snap.exists()) {
      return snap.val();
    }
    return null;
  },
};
