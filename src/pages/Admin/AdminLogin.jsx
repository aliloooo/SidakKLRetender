import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ClipboardCheck, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'

const schema = yup.object({
    email: yup.string().email('Email tidak valid').required('Email wajib diisi'),
    password: yup.string().required('Password wajib diisi'),
})

export default function AdminLogin() {
    const { signIn } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    })

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            await signIn(data.email, data.password)
            toast.success('Login berhasil!')
            navigate('/admin/aspek')
        } catch (err) {
            toast.error('Login gagal: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
                        <ClipboardCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin SIDAK</h1>
                    <p className="text-brand-300 text-sm mt-1">Masuk untuk mengelola data</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="form-label">Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                className={errors.email ? 'form-input-error' : 'form-input'}
                                placeholder="admin@example.com"
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label className="form-label">Password</label>
                            <input
                                {...register('password')}
                                type="password"
                                className={errors.password ? 'form-input-error' : 'form-input'}
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
                            {loading ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                            ) : (
                                <><Lock className="w-4 h-4" /> Masuk</>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-brand-300 text-xs mt-6">
                    Halaman ini hanya untuk administrator
                </p>
            </div>
        </div>
    )
}
