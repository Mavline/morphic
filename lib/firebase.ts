import { initializeApp, getApps } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBq3u9-UzhdtI3qJaNt2HHnFqfUI1QkyGk",
  authDomain: "morphic-search-engine.firebaseapp.com",
  projectId: "morphic-search-engine",
  storageBucket: "morphic-search-engine.firebasestorage.app",
  messagingSenderId: "787698904371",
  appId: "1:787698904371:web:048beddc41d3426e902246",
  measurementId: "G-MJR5XQ84Z4"
}

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)

// Initialize Analytics only on client side
if (typeof window !== 'undefined') {
  getAnalytics(app)
} 