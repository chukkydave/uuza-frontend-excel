import { useState, useEffect } from 'react'
import { api, ApiError } from '../utils/api'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkAuth = async () => {
    try {
      setLoading(true)
      setError(null)
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch (err) {
      if (err instanceof ApiError && err.status === 307) {
        // User is not authenticated, this is expected
        setUser(null)
      } else {
        setError(err.message)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const logout = () => {
    api.logout()
  }

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
    refetch: checkAuth,
  }
}
