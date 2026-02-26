import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowLeft, Save, CheckCheck } from 'lucide-react'
import { getAspek, getAllSubAspekByAspek } from '../services/aspekService'
import { createSidak } from '../services/sidakService'
import useSidakStore from '../store/useSidakStore'
import { calcNilaiSubAspek, calcNilaiAspek, calcTotalNilai, determineStatus } from '../utils/calculateScore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Checklist() {
    const navigate = useNavigate()
    const { identity, resetIdentity } = useSidakStore()

    const [aspekList, setAspekList] = useState([])
    const [subAspekList, setSubAspekList] = useState([])
    const [details, setDetails] = useState([]) // array of { sub_aspek_id, aspek_id, jumlah_unit, keterangan, nilai, bobot_sub_aspek }
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Guard: if no identity, redirect back
    useEffect(() => {
        if (!identity.nama_ro) {
            toast.error('Silakan isi informasi awal terlebih dahulu')
            navigate('/input-sidak')
            return
        }
        loadChecklistData()
    }, [])

    async function loadChecklistData() {
        try {
            const [aspek, subAspek] = await Promise.all([getAspek(), getAllSubAspekByAspek()])
            setAspekList(aspek)
            setSubAspekList(subAspek)

            // Initialize detail rows
            const rows = subAspek.map((sa) => ({
                sub_aspek_id: sa.id,
                aspek_id: sa.aspek_id,
                jumlah_unit: 0,
                kelengkapan: 'Tidak Sesuai',
                keterangan: '',
                nilai: 0,
                bobot_sub_aspek: sa.bobot_sub_aspek,
                nama_sub_aspek: sa.nama_sub_aspek,
            }))
            setDetails(rows)
        } catch (err) {
            toast.error('Gagal memuat checklist: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    function updateDetail(sub_aspek_id, field, value) {
        setDetails((prev) =>
            prev.map((d) => {
                if (d.sub_aspek_id !== sub_aspek_id) return d
                const updated = { ...d, [field]: value }
                // Recalculate nilai based on kelengkapan
                updated.nilai = calcNilaiSubAspek(updated.bobot_sub_aspek, updated.kelengkapan)
                return updated
            })
        )
    }

    function setAllSesuai(aspekId) {
        setDetails((prev) =>
            prev.map((d) => {
                if (d.aspek_id !== aspekId) return d
                const updated = { ...d, kelengkapan: 'Sesuai' }
                updated.nilai = calcNilaiSubAspek(updated.bobot_sub_aspek, updated.kelengkapan)
                return updated
            })
        )
        toast.success('Semua item di aspek ini diatur ke Sesuai')
    }

    const totalNilai = calcTotalNilai(details)
    const status = determineStatus(totalNilai)

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            await createSidak({ identity, details })
            toast.success('SIDAK berhasil disimpan!')
            resetIdentity()
            navigate('/')
        } catch (err) {
            toast.error('Gagal menyimpan: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <LoadingSpinner />

    if (aspekList.length === 0) {
        return (
            <div className="max-w-3xl mx-auto text-center py-16">
                <p className="text-gray-500 font-medium">Belum ada aspek penilaian.</p>
                <p className="text-gray-400 text-sm mt-1">Admin perlu menambahkan aspek & sub aspek terlebih dahulu.</p>
                <button onClick={() => navigate('/')} className="btn-secondary mt-4">Kembali ke Dashboard</button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <button onClick={() => navigate('/input-sidak')} className="btn-secondary mt-1">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold">2</span>
                        <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">Langkah 2 dari 2</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Pengisian Checklist</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        <span className="font-medium text-gray-700">{identity.nama_ro}</span> / {identity.nama_kl} — {identity.tanggal_kunjungan}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: '100%' }} />
            </div>

            {/* Floating Score Card */}
            <div className={`sticky top-20 z-30 rounded-xl border p-4 flex items-center justify-between shadow-md transition-colors ${status === 'Comply'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-red-600 border-red-500 text-white'
                }`}>
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 opacity-80" />
                    <div>
                        <p className="text-xs font-medium opacity-80">Total Nilai Akhir</p>
                        <p className="text-3xl font-bold">{totalNilai.toFixed(2)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs opacity-80 mb-1">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${status === 'Comply' ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
                        }`}>
                        {status === 'Comply' ? '✓ Comply' : '✗ Not Comply'}
                    </span>
                    <p className="text-xs opacity-60 mt-1">Minimum: 80</p>
                </div>
            </div>

            {/* Aspek Tables */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {aspekList.map((aspek) => {
                    const aspekSubAspek = subAspekList.filter((sa) => sa.aspek_id === aspek.id)
                    const aspekDetails = details.filter((d) => d.aspek_id === aspek.id)
                    const nilaiAspek = calcNilaiAspek(details, aspek.id)

                    return (
                        <div key={aspek.id} className="card p-0 overflow-hidden">
                            {/* Aspek Header */}
                            <div className="flex items-center justify-between px-6 py-3.5 bg-brand-600">
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-semibold text-sm">{aspek.nama_aspek}</span>
                                    <span className="text-brand-200 text-xs bg-brand-700/50 px-2 py-0.5 rounded-full">
                                        Bobot {Number(aspek.bobot_aspek).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-brand-200 text-[10px] uppercase font-bold tracking-wider">Nilai Aspek</p>
                                    <p className="text-white font-bold text-lg">{nilaiAspek.toFixed(2)}</p>
                                    <button
                                        type="button"
                                        onClick={() => setAllSesuai(aspek.id)}
                                        className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all font-medium text-xs shadow-sm active:scale-95"
                                        title="Set Sesuai untuk semua item di aspek ini"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Set Sesuai Semua
                                    </button>
                                </div>
                            </div>

                            {/* Sub Aspek Table */}
                            <div className="overflow-x-auto">
                                {aspekSubAspek.length === 0 ? (
                                    <p className="text-gray-400 text-sm px-6 py-4 italic">Belum ada sub aspek.</p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr>
                                                <th className="table-th">Sub Aspek</th>
                                                <th className="table-th w-32 text-center">Kelengkapan</th>
                                                <th className="table-th w-32 text-center">Jumlah Unit</th>
                                                <th className="table-th">Keterangan</th>
                                                <th className="table-th w-28 text-center">Bobot (%)</th>
                                                <th className="table-th w-24 text-center">Nilai</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aspekSubAspek.map((sa) => {
                                                const detail = aspekDetails.find((d) => d.sub_aspek_id === sa.id)
                                                return (
                                                    <tr key={sa.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="table-td font-medium text-gray-800">{sa.nama_sub_aspek}</td>
                                                        <td className="table-td text-center">
                                                            <select
                                                                value={detail?.kelengkapan ?? 'Tidak Sesuai'}
                                                                onChange={(e) => updateDetail(sa.id, 'kelengkapan', e.target.value)}
                                                                className={`w-full px-2 py-1.5 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${(detail?.kelengkapan ?? 'Tidak Sesuai') === 'Sesuai'
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                                    }`}
                                                            >
                                                                <option value="Sesuai" className="bg-white text-gray-900 font-normal">Sesuai</option>
                                                                <option value="Tidak Sesuai" className="bg-white text-gray-900 font-normal">Tidak Sesuai</option>
                                                            </select>
                                                        </td>
                                                        <td className="table-td text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0"
                                                                value={detail?.jumlah_unit ?? ''}
                                                                onChange={(e) => updateDetail(sa.id, 'jumlah_unit', e.target.value)}
                                                                className="w-24 px-2 py-1.5 text-center border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                                            />
                                                        </td>
                                                        <td className="table-td">
                                                            <input
                                                                type="text"
                                                                placeholder="Opsional..."
                                                                value={detail?.keterangan ?? ''}
                                                                onChange={(e) => updateDetail(sa.id, 'keterangan', e.target.value)}
                                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                                            />
                                                        </td>
                                                        <td className="table-td text-center text-gray-600">
                                                            {Number(sa.bobot_sub_aspek).toFixed(2)}%
                                                        </td>
                                                        <td className="table-td text-center font-bold text-brand-700">
                                                            {(detail?.nilai ?? 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )
                })}

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pb-8">
                    <button type="button" onClick={() => navigate('/')} className="btn-secondary">
                        Batal
                    </button>
                    <button type="submit" disabled={submitting} className="btn-primary px-8">
                        {submitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Simpan SIDAK
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
