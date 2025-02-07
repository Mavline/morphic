'use client'

import { auth } from '@/lib/firebase'
import { signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword } from 'firebase/auth'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'

export function AuthButtons() {
  const [user, setUser] = useState(auth.currentUser)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  // Simple example: sign in with Email & Password
  async function handleSignInEmail() {
    try {
      await signInWithEmailAndPassword(auth, 'test@example.com', 'somePassword')
    } catch (error) {
      console.error('Error signing in via email:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (user) {
    return (
      <Button variant="ghost" onClick={handleSignOut}>
        Sign Out
      </Button>
    )
  }

  return (
    <>
      <Button variant="ghost" onClick={handleSignIn}>Sign In (Google)</Button>
      <Button variant="ghost" onClick={handleSignInEmail}>Sign In (Email)</Button>
    </>
  )
} 