import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ClipboardCheck, LayoutDashboard, Layers, List, FileSpreadsheet, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
    { to: '/admin/aspek', label: 'Aspek', icon: Layers },
    { to: '/admin/sub-aspek', label: 'Sub Aspek', icon: List },
    { to: '/admin/results', label: 'Hasil SIDAK', icon: ClipboardCheck },
    { to: '/admin/template', label: 'Template Excel', icon: FileSpreadsheet },
]

export default function AdminLayout() {
    const { signOut } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await signOut()
        toast.success('Logout berhasil')
        window.location.href = '/'
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                {/* Brand */}
                <div className="px-5 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 text-sm">SIDAK Admin</span>
                            <span className="text-xs text-gray-400 block">Panel Manajemen</span>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-3">Menu</p>
                    <NavLink to="/" className="sidebar-link">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </NavLink>
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-3 py-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
