import { useEffect, useState } from 'react'
import { Trash2, Eye, FileText, AlertTriangle, Calendar, Building2, User, Search, Pencil, FileDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { getSidakList, deleteSidak } from '../../services/sidakService'
import { getAspek } from '../../services/aspekService'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ResultsPage() {
    const [sidakList, setSidakList] = useState([])
    const [aspekList, setAspekList] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewItem, setViewItem] = useState(null)
    const [deleteItem, setDeleteItem] = useState(null)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [data, aspek] = await Promise.all([getSidakList(), getAspek()])
            setSidakList(data)
            setAspekList(aspek)
        } catch (err) {
            toast.error('Gagal memuat data: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteSidak(deleteItem.id)
            toast.success('Data SIDAK berhasil dihapus')
            setDeleteModalOpen(false)
            loadData()
        } catch (err) {
            toast.error('Gagal menghapus: ' + err.message)
        } finally {
            setDeleting(false)
        }
    }

    function getNilaiAspek(sidak, aspek_id) {
        if (!sidak.sidak_detail) return 0
        return sidak.sidak_detail
            .filter((d) => d.aspek_id === aspek_id)
            .reduce((s, d) => s + Number(d.nilai), 0)
    }

    const filteredList = sidakList.filter(s =>
        s.nama_ro.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nama_kl.toLowerCase().includes(searchQuery.toLowerCase())
    )

    function exportAllDetailsToExcel() {
        try {
            const allDetails = []
            sidakList.forEach(sidak => {
                const headerInfo = {
                    'Regional Office': sidak.nama_ro,
                    'Kantor Layanan': sidak.nama_kl,
                    'Tanggal': new Date(sidak.tanggal_kunjungan).toLocaleDateString('id-ID'),
                    'Status': sidak.status,
                    'Total Nilai': Number(sidak.total_nilai).toFixed(2)
                }

                if (sidak.sidak_detail && sidak.sidak_detail.length > 0) {
                    sidak.sidak_detail.forEach(detail => {
                        const aspek = aspekList.find(a => a.id === detail.aspek_id)
                        allDetails.push({
                            ...headerInfo,
                            'Aspek': aspek?.nama_aspek || detail.aspek_id,
                            'Sub Aspek': detail.sub_aspek?.nama_sub_aspek || detail.sub_aspek_id,
                            'Kelengkapan': detail.kelengkapan,
                            'Unit': detail.jumlah_unit || '-',
                            'Keterangan': detail.keterangan || '-',
                            'Nilai': Number(detail.nilai).toFixed(2)
                        })
                    })
                }
            })

            const worksheet = XLSX.utils.json_to_sheet(allDetails)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Semua Detail SIDAK')
            XLSX.writeFile(workbook, 'Rincian_Seluruh_Hasil_SIDAK.xlsx')
            toast.success('Rincian seluruh data berhasil diekspor!')
        } catch (error) {
            toast.error('Gagal mengekspor rincian data: ' + error.message)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Hasil SIDAK</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Pantau dan kelola semua laporan SIDAK yang telah diinput</p>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-base font-semibold text-gray-900">Laporan Masuk</h2>
                    <div className="flex items-center gap-3">
                        {sidakList.length > 0 && (
                            <button
                                onClick={exportAllDetailsToExcel}
                                className="btn-secondary text-xs py-1.5"
                                title="Download semua rincian penilaian dari semua laporan"
                            >
                                <FileDown className="w-4 h-4" />
                                Export Detail Semua
                            </button>
                        )}
                        <span className="text-xs text-gray-400">{sidakList.length} total laporan</span>
                    </div>
                </div>

                {/* Search Bar */}
                {sidakList.length > 0 && (
                    <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari berdasarkan RO atau Kantor Layanan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                )}

                {sidakList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="w-12 h-12 text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">Belum ada laporan SIDAK</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="table-th">No</th>
                                    <th className="table-th">RO / KL</th>
                                    <th className="table-th">Tanggal</th>
                                    <th className="table-th text-center">Total Nilai</th>
                                    <th className="table-th">Status</th>
                                    <th className="table-th text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="table-td text-center py-10 text-gray-500 italic">
                                            Tidak ada hasil yang sesuai dengan pencarian "{searchQuery}"
                                        </td>
                                    </tr>
                                ) : (
                                    filteredList.map((s, idx) => (
                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="table-td text-gray-400 w-10">{idx + 1}</td>
                                            <td className="table-td">
                                                <div className="font-semibold text-gray-900">{s.nama_ro}</div>
                                                <div className="text-xs text-gray-500">{s.nama_kl}</div>
                                            </td>
                                            <td className="table-td whitespace-nowrap">
                                                {new Date(s.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="table-td text-center font-bold text-gray-900">
                                                {Number(s.total_nilai).toFixed(2)}
                                            </td>
                                            <td className="table-td">
                                                {s.status === 'Comply' ? (
                                                    <span className="badge-comply">✓ Comply</span>
                                                ) : (
                                                    <span className="badge-not-comply">✗ Not Comply</span>
                                                )}
                                            </td>
                                            <td className="table-td text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => { setViewItem(s); setViewModalOpen(true); }}
                                                        className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <Link
                                                        to={`/admin/results/edit/${s.id}`}
                                                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                                        title="Edit Laporan"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => { setDeleteItem(s); setDeleteModalOpen(true); }}
                                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Detail Modal */}
            <Modal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title="Detail Hasil SIDAK"
                size="xl"
            >
                {viewItem && (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Regional Office</p>
                                    <p className="text-sm font-semibold text-gray-700">{viewItem.nama_ro}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Kantor Layanan</p>
                                    <p className="text-sm font-semibold text-gray-700">{viewItem.nama_kl}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Tanggal Kunjungan</p>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {new Date(viewItem.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                            day: '2-digit', month: 'long', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Summary Score */}
                        <div className={`p-4 rounded-xl flex items-center justify-between ${viewItem.status === 'Comply' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Nilai Akhir</p>
                                <p className={`text-3xl font-bold ${viewItem.status === 'Comply' ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {Number(viewItem.total_nilai).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                                <span className={viewItem.status === 'Comply' ? 'badge-comply' : 'badge-not-comply'}>
                                    {viewItem.status === 'Comply' ? '✓ Comply' : '✗ Not Comply'}
                                </span>
                            </div>
                        </div>

                        {/* Aspek Breakdown */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 border-b pb-2">Rincian Per Aspek</h4>
                            {aspekList.map(aspek => (
                                <div key={aspek.id} className="border rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b">
                                        <span className="font-semibold text-gray-700">{aspek.nama_aspek}</span>
                                        <span className="text-brand-600 font-bold">{getNilaiAspek(viewItem, aspek.id).toFixed(2)}</span>
                                    </div>
                                    <div className="p-0">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-white">
                                                    <th className="px-4 py-2 text-left text-gray-400">Sub Aspek</th>
                                                    <th className="px-4 py-2 text-center text-gray-400">Kelengkapan</th>
                                                    <th className="px-4 py-2 text-center text-gray-400">Unit</th>
                                                    <th className="px-4 py-2 text-center text-gray-400">Nilai</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {viewItem.sidak_detail
                                                    ?.filter(d => d.aspek_id === aspek.id)
                                                    .map(detail => (
                                                        <tr key={detail.id}>
                                                            <td className="px-4 py-2 text-gray-600">{detail.sub_aspek?.nama_sub_aspek || detail.sub_aspek_id}</td>
                                                            <td className="px-4 py-2 text-center">
                                                                <span className={`px-2 py-0.5 rounded-full ${detail.kelengkapan === 'Sesuai' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {detail.kelengkapan}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-center text-gray-500">{detail.jumlah_unit || '-'}</td>
                                                            <td className="px-4 py-2 text-center font-bold text-gray-700">{Number(detail.nilai).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Hapus Laporan SIDAK"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                        <p className="text-sm">Tindakan ini tidak dapat dibatalkan. Laporan akan dihapus selamanya.</p>
                    </div>
                    <p className="text-sm text-gray-600">
                        Yakin ingin menghapus laporan SIDAK untuk <strong>{deleteItem?.nama_kl}</strong> ({deleteItem?.nama_ro})?
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary">Batal</button>
                        <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                            {deleting ? 'Menghapus...' : 'Hapus Laporan'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
