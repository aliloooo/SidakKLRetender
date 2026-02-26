import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function AdminRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return <LoadingSpinner fullscreen />
    if (!user) return <Navigate to="/admin/login" replace />
    return children
}
