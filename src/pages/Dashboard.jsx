import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Download, CheckCircle2, XCircle, ClipboardList, TrendingUp, AlertTriangle, FileSpreadsheet, Search } from 'lucide-react'
import * as XLSX from 'xlsx'
import { getSidakList } from '../services/sidakService'
import { getAspek } from '../services/aspekService'
import { getLatestTemplate } from '../services/templateService'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Dashboard() {
    const [sidakList, setSidakList] = useState([])
    const [aspekList, setAspekList] = useState([])
    const [template, setTemplate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [sidak, aspek, tmpl] = await Promise.all([
                getSidakList(),
                getAspek(),
                getLatestTemplate(),
            ])
            setSidakList(sidak)
            setAspekList(aspek)
            setTemplate(tmpl)
        } catch (err) {
            toast.error('Gagal memuat data: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const totalCompliant = sidakList.filter((s) => s.status === 'Comply').length
    const totalNotCompliant = sidakList.length - totalCompliant

    // Filtered list based on search
    const filteredList = sidakList.filter(s =>
        s.nama_ro.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nama_kl.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const avgScore = sidakList.length
        ? (sidakList.reduce((s, i) => s + Number(i.total_nilai), 0) / sidakList.length).toFixed(2)
        : '0.00'

    // Build per-aspek nilai lookup: { sidak_id: { aspek_id: nilai } }
    function getNilaiAspek(sidak, aspek_id) {
        if (!sidak.sidak_detail) return '-'
        const val = sidak.sidak_detail
            .filter((d) => d.aspek_id === aspek_id)
            .reduce((s, d) => s + Number(d.nilai), 0)
        return val.toFixed(2)
    }

    function exportToExcel() {
        try {
            // Prepare data array specifically for Excel columns
            const excelData = sidakList.map((sidak, index) => {
                const rowData = {
                    'No': index + 1,
                    'Regional Office (RO)': sidak.nama_ro,
                    'Kantor Layanan (KL)': sidak.nama_kl,
                    'Tanggal Kunjungan': new Date(sidak.tanggal_kunjungan).toLocaleDateString('id-ID'),
                };

                // Add columns for each aspek dynamically
                aspekList.forEach(a => {
                    rowData[a.nama_aspek] = Number(getNilaiAspek(sidak, a.id));
                });

                rowData['Total Nilai'] = Number(sidak.total_nilai).toFixed(2);
                rowData['Status'] = sidak.status;

                return rowData;
            });

            // Create worksheet and workbook
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap SIDAK');

            // Trigger download
            XLSX.writeFile(workbook, 'Rekap_Laporan_SIDAK.xlsx');
            toast.success('File Rekap Excel berhasil diunduh!');
        } catch (error) {
            toast.error('Gagal mengekspor data rekap: ' + error.message);
        }
    }

    function exportSingleToExcel(sidak) {
        try {
            // Header info
            const headerData = [
                ['LAPORAN HASIL SIDAK KANTOR LAYANAN'],
                [''],
                ['Regional Office:', sidak.nama_ro],
                ['Kantor Layanan:', sidak.nama_kl],
                ['Tanggal Kunjungan:', new Date(sidak.tanggal_kunjungan).toLocaleDateString('id-ID')],
                ['Total Nilai Akhir:', Number(sidak.total_nilai).toFixed(2)],
                ['Status:', sidak.status],
                [''],
                ['RINCIAN PENILAIAN'],
                ['Aspek', 'Sub Aspek', 'Kelengkapan', 'Unit', 'Keterangan', 'Nilai']
            ];

            // Detail rows
            const detailRows = [];
            aspekList.forEach(aspek => {
                // Filter details for this aspek from the sidak object
                const details = (sidak.sidak_detail || []).filter(d => d.aspek_id === aspek.id);

                details.forEach((d, idx) => {
                    detailRows.push([
                        idx === 0 ? aspek.nama_aspek : '',
                        d.sub_aspek?.nama_sub_aspek || d.sub_aspek_id || 'Detail tidak ditemukan',
                        d.kelengkapan,
                        d.jumlah_unit || '-',
                        d.keterangan || '-',
                        Number(d.nilai).toFixed(2)
                    ]);
                });

                // Add empty row between aspects
                if (details.length > 0) detailRows.push(['']);
            });

            const worksheet = XLSX.utils.aoa_to_sheet([...headerData, ...detailRows]);

            // Set column widths
            worksheet['!cols'] = [
                { wch: 30 }, // Aspek
                { wch: 45 }, // Sub Aspek
                { wch: 15 }, // Kelengkapan
                { wch: 10 }, // Unit
                { wch: 35 }, // Keterangan
                { wch: 10 }, // Nilai
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Detail Laporan');

            const fileName = `SIDAK_${sidak.nama_kl}_${sidak.tanggal_kunjungan}.xlsx`.replace(/\s+/g, '_');
            XLSX.writeFile(workbook, fileName);
            toast.success(`Laporan ${sidak.nama_kl} berhasil diunduh!`);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengekspor laporan: ' + error.message);
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard SIDAK</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Ringkasan hasil pengisian checklist kantor layanan</p>
                </div>
                <div className="flex items-center gap-3">
                    {template && (
                        <a
                            href={template.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                        >
                            <Download className="w-4 h-4" />
                            Download Template
                        </a>
                    )}
                    <Link to="/input-sidak" className="btn-primary">
                        <Plus className="w-4 h-4" />
                        Input SIDAK
                    </Link>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total SIDAK</p>
                        <p className="text-2xl font-bold text-gray-900">{sidakList.length}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Comply</p>
                        <p className="text-2xl font-bold text-gray-900">{totalCompliant}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                        <XCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Not Comply</p>
                        <p className="text-2xl font-bold text-gray-900">{totalNotCompliant}</p>
                    </div>
                </div>
            </div>

            {/* Average Score Banner */}
            {sidakList.length > 0 && (
                <div className="card bg-gradient-to-r from-brand-600 to-brand-700 border-0 flex items-center gap-4">
                    <TrendingUp className="w-8 h-8 text-brand-200 flex-shrink-0" />
                    <div>
                        <p className="text-brand-200 text-sm font-medium">Rata-rata Total Nilai</p>
                        <p className="text-white text-3xl font-bold">{avgScore}</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Daftar Hasil SIDAK</h2>
                        <span className="text-xs text-gray-400">{sidakList.length} entri</span>
                    </div>
                    {sidakList.length > 0 && (
                        <button
                            onClick={exportToExcel}
                            className="btn-secondary text-gray-600 hover:text-brand-600 border-gray-200 text-xs py-1.5"
                            title="Download rekap semua laporan dalam satu file Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-brand-600" />
                            Rekap Semua (Excel)
                        </button>
                    )}
                </div>

                {/* Search Bar - only show if list has items */}
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
                        <AlertTriangle className="w-12 h-12 text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">Belum ada data SIDAK</p>
                        <p className="text-gray-400 text-sm mt-1">Klik "Input SIDAK" untuk menambahkan</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="table-th rounded-tl-none">No</th>
                                    <th className="table-th">Nama RO</th>
                                    <th className="table-th">Nama KL</th>
                                    <th className="table-th">Tanggal</th>
                                    {aspekList.map((a) => (
                                        <th key={a.id} className="table-th whitespace-nowrap">
                                            {a.nama_aspek}
                                        </th>
                                    ))}
                                    <th className="table-th">Total Nilai</th>
                                    <th className="table-th">Status</th>
                                    <th className="table-th text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredList.length === 0 ? (
                                    <tr>
                                        <td colSpan={aspekList.length + 7} className="table-td text-center py-10 text-gray-500 italic">
                                            Tidak ada hasil yang sesuai dengan pencarian "{searchQuery}"
                                        </td>
                                    </tr>
                                ) : (
                                    filteredList.map((sidak, idx) => (
                                        <tr key={sidak.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="table-td text-gray-400 font-medium w-10">{idx + 1}</td>
                                            <td className="table-td font-medium text-gray-900">{sidak.nama_ro}</td>
                                            <td className="table-td">{sidak.nama_kl}</td>
                                            <td className="table-td whitespace-nowrap">
                                                {new Date(sidak.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            {aspekList.map((a) => (
                                                <td key={a.id} className="table-td text-center font-medium">
                                                    {getNilaiAspek(sidak, a.id)}
                                                </td>
                                            ))}
                                            <td className="table-td font-bold text-gray-900">
                                                {Number(sidak.total_nilai).toFixed(2)}
                                            </td>
                                            <td className="table-td">
                                                {sidak.status === 'Comply' ? (
                                                    <span className="badge-comply">✓ Comply</span>
                                                ) : (
                                                    <span className="badge-not-comply">✗ Not Comply</span>
                                                )}
                                            </td>
                                            <td className="table-td text-center">
                                                <button
                                                    onClick={() => exportSingleToExcel(sidak)}
                                                    className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors inline-flex items-center gap-1.5 group"
                                                    title="Download laporan detail Excel untuk entri ini"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    <span className="text-[10px] font-bold uppercase tracking-tight group-hover:underline">Excel</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
