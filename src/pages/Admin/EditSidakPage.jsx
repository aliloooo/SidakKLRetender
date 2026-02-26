import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, CheckCheck, CheckCircle2, Building2, User, Calendar } from 'lucide-react'
import { getSidakById, updateSidak } from '../../services/sidakService'
import { getAspek, getAllSubAspekByAspek } from '../../services/aspekService'
import { calcNilaiSubAspek, calcNilaiAspek, calcTotalNilai, determineStatus } from '../../utils/calculateScore'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function EditSidakPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [aspekList, setAspekList] = useState([])
    const [subAspekList, setSubAspekList] = useState([])

    // Form state
    const [identity, setIdentity] = useState({
        nama_ro: '',
        nama_kl: '',
        tanggal_kunjungan: ''
    })
    const [details, setDetails] = useState([])

    useEffect(() => {
        loadData()
    }, [id])

    async function loadData() {
        setLoading(true)
        try {
            const [sidak, aspek, subAspek] = await Promise.all([
                getSidakById(id),
                getAspek(),
                getAllSubAspekByAspek()
            ])

            setIdentity({
                nama_ro: sidak.nama_ro,
                nama_kl: sidak.nama_kl,
                tanggal_kunjungan: sidak.tanggal_kunjungan
            })

            // Map existing details, ensuring we have all sub_aspek even if missing in previous save
            const rows = subAspek.map(sa => {
                const existing = (sidak.sidak_detail || []).find(d => d.sub_aspek_id === sa.id)
                return {
                    sub_aspek_id: sa.id,
                    aspek_id: sa.aspek_id,
                    jumlah_unit: existing?.jumlah_unit ?? 0,
                    kelengkapan: existing?.kelengkapan ?? 'Tidak Sesuai',
                    keterangan: existing?.keterangan ?? '',
                    bobot_sub_aspek: sa.bobot_sub_aspek,
                    nama_sub_aspek: sa.nama_sub_aspek,
                    nilai: existing?.nilai ?? 0
                }
            })

            setAspekList(aspek)
            setSubAspekList(subAspek)
            setDetails(rows)
        } catch (err) {
            toast.error('Gagal memuat data: ' + err.message)
            navigate('/admin/results')
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
        if (!identity.nama_ro || !identity.nama_kl || !identity.tanggal_kunjungan) {
            toast.error('Harap lengkapi informasi identitas')
            return
        }

        setSubmitting(true)
        try {
            await updateSidak(id, { identity, details })
            toast.success('Laporan SIDAK berhasil diperbarui!')
            navigate('/admin/results')
        } catch (err) {
            toast.error('Gagal memperbarui: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/results')} className="btn-secondary">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Laporan SIDAK</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Lakukan perubahan pada data identitas atau hasil checklist</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identity Section */}
                <div className="card grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="form-label mb-1.5 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            Regional Office
                        </label>
                        <input
                            type="text"
                            value={identity.nama_ro}
                            onChange={e => setIdentity({ ...identity, nama_ro: e.target.value })}
                            className="form-input"
                            placeholder="Contoh: RO Jakarta"
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label mb-1.5 flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            Kantor Layanan
                        </label>
                        <input
                            type="text"
                            value={identity.nama_kl}
                            onChange={e => setIdentity({ ...identity, nama_kl: e.target.value })}
                            className="form-input"
                            placeholder="Contoh: KL Sudirman"
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label mb-1.5 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            Tanggal Kunjungan
                        </label>
                        <input
                            type="date"
                            value={identity.tanggal_kunjungan}
                            onChange={e => setIdentity({ ...identity, tanggal_kunjungan: e.target.value })}
                            className="form-input"
                            required
                        />
                    </div>
                </div>

                {/* Score Summary Banner */}
                <div className={`rounded-xl border p-5 flex items-center justify-between shadow-sm transition-all ${status === 'Comply' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Total Skor Akhir</p>
                            <p className="text-4xl font-black">{totalNilai.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs opacity-80 mb-1 uppercase tracking-wider">Status Kelulusan</p>
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full">
                            <span className="text-lg font-bold">{status === 'Comply' ? 'LULUS (Comply)' : 'TIDAK LULUS'}</span>
                        </div>
                        <p className="text-[10px] opacity-60 mt-1.5 italic">*Batas minimum kelulusan adalah 80.00</p>
                    </div>
                </div>

                {/* Checklist Sections */}
                {aspekList.map((aspek) => {
                    const aspekSubAspek = subAspekList.filter((sa) => sa.aspek_id === aspek.id)
                    const aspekDetails = details.filter((d) => d.aspek_id === aspek.id)
                    const nilaiAspek = calcNilaiAspek(details, aspek.id)

                    return (
                        <div key={aspek.id} className="card p-0 overflow-hidden border-2 border-gray-100">
                            {/* Aspek Header */}
                            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-8 bg-brand-600 rounded-full" />
                                    <div>
                                        <h3 className="font-bold text-gray-900">{aspek.nama_aspek}</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                            Bobot Maks: {Number(aspek.bobot_aspek).toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Capaian Nilai</p>
                                        <p className="text-2xl font-black text-brand-600">{nilaiAspek.toFixed(2)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAllSesuai(aspek.id)}
                                        className="btn-secondary bg-white text-xs py-1.5 border-gray-200"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Auto Sesuai
                                    </button>
                                </div>
                            </div>

                            {/* Sub Aspek Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="table-th py-3">Sub Aspek</th>
                                            <th className="table-th py-3 w-40 text-center">Kelengkapan</th>
                                            <th className="table-th py-3 w-24 text-center">Unit</th>
                                            <th className="table-th py-3">Keterangan</th>
                                            <th className="table-th py-3 w-20 text-center">Nilai</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {aspekDetails.map((d) => (
                                            <tr key={d.sub_aspek_id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="table-td py-3 font-medium text-gray-700">{d.nama_sub_aspek}</td>
                                                <td className="table-td py-3">
                                                    <select
                                                        value={d.kelengkapan}
                                                        onChange={(e) => updateDetail(d.sub_aspek_id, 'kelengkapan', e.target.value)}
                                                        className={`w-full px-3 py-1.5 rounded-lg border text-xs font-bold transition-all focus:ring-2 focus:ring-brand-500 outline-none ${d.kelengkapan === 'Sesuai' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                                                            }`}
                                                    >
                                                        <option value="Sesuai">Sesuai</option>
                                                        <option value="Tidak Sesuai">Tidak Sesuai</option>
                                                    </select>
                                                </td>
                                                <td className="table-td py-3 text-center">
                                                    <input
                                                        type="number"
                                                        value={d.jumlah_unit || ''}
                                                        onChange={(e) => updateDetail(d.sub_aspek_id, 'jumlah_unit', e.target.value)}
                                                        className="w-16 px-2 py-1.5 text-center border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="table-td py-3">
                                                    <input
                                                        type="text"
                                                        value={d.keterangan || ''}
                                                        onChange={(e) => updateDetail(d.sub_aspek_id, 'keterangan', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                                                        placeholder="Catatan..."
                                                    />
                                                </td>
                                                <td className="table-td py-3 text-center font-black text-brand-600">
                                                    {d.nilai.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                })}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 pb-12">
                    <button type="button" onClick={() => navigate('/admin/results')} className="btn-secondary px-8">
                        Batalkan Perubahan
                    </button>
                    <button type="submit" disabled={submitting} className="btn-primary px-12 py-3 text-base shadow-lg shadow-brand-200">
                        {submitting ? (
                            <>
                                <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                Memperbarui...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Simpan Perubahan Laporan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
