import { Link, useLocation } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'

export default function Navbar() {
    const location = useLocation()
    const isAdminPath = location.pathname.startsWith('/admin')

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 flex-shrink-0">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        <div className="hidden xs:block">
                            <span className="font-bold text-gray-900 text-sm leading-none block uppercase">SIDAK</span>
                            <span className="text-[10px] text-gray-400 leading-none">Kantor Layanan</span>
                        </div>
                    </Link>


                    <nav className="flex items-center gap-1">
                        <Link
                            to="/"
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/' && !isAdminPath
                                ? 'bg-brand-50 text-brand-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            Dashboard
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    )
}
