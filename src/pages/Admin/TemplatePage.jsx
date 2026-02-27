import { useEffect, useState, useRef } from 'react'
import { Upload, Trash2, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react'
import { getTemplateFiles, uploadTemplate, deleteTemplate } from '../../services/templateService'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function TemplatePage() {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)
    const [deleteItem, setDeleteItem] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const fileRef = useRef()

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        try {
            const data = await getTemplateFiles()
            setFiles(data)
        } catch (err) {
            toast.error('Gagal memuat template: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return
        const allowed = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ]
        if (!allowed.includes(file.type)) {
            toast.error('Hanya file Excel (.xlsx, .xls) yang diperbolehkan')
            return
        }
        setUploading(true)
        try {
            await uploadTemplate(file)
            toast.success('Template berhasil diupload!')
            loadData()
        } catch (err) {
            toast.error('Upload gagal: ' + err.message)
        } finally {
            setUploading(false)
            fileRef.current.value = ''
        }
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteTemplate(deleteItem.id, deleteItem.file_url)
            toast.success('Template dihapus!')
            setDeleteModal(false)
            loadData()
        } catch (err) {
            toast.error('Gagal menghapus: ' + err.message)
        } finally {
            setDeleting(false)
        }
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Template Excel</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Upload dan kelola template Excel SIDAK</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="card border-2 border-dashed border-gray-300 hover:border-brand-400 transition-colors">
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                        <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Upload Template Excel</h3>
                    <p className="text-xs text-gray-400 mb-4">Format didukung: .xlsx, .xls</p>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleUpload}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        className={`btn-success cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengupload...</>
                        ) : (
                            <><Upload className="w-4 h-4" /> Pilih File</>
                        )}
                    </label>
                </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                    Template yang paling baru diupload akan ditampilkan sebagai tombol download di halaman Dashboard pengguna.
                    File lama tetap tersimpan dan dapat diakses di sini.
                </p>
            </div>

            {/* File List */}
            <div className="card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">Daftar Template</h2>
                </div>
                {loading ? <LoadingSpinner /> : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileSpreadsheet className="w-10 h-10 text-gray-200 mb-3" />
                        <p className="text-gray-400 text-sm">Belum ada template yang diupload.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="table-th">No</th>
                                <th className="table-th">Nama File</th>
                                <th className="table-th">Tanggal Upload</th>
                                <th className="table-th w-32 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((f, idx) => (
                                <tr key={f.id} className={`hover:bg-gray-50 ${idx === 0 ? 'bg-emerald-50/60' : ''}`}>
                                    <td className="table-td text-gray-400 w-10">{idx + 1}</td>
                                    <td className="table-td">
                                        <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            <span className="font-medium text-gray-900">{f.nama_file}</span>
                                            {idx === 0 && (
                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Latest</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-td text-gray-500">{formatDate(f.uploaded_at)}</td>
                                    <td className="table-td text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                href={f.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => { setDeleteItem(f); setDeleteModal(true) }}
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Delete Confirm */}
            <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Hapus Template" size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Yakin ingin menghapus file <strong>"{deleteItem?.nama_file}"</strong>?
                        File akan dihapus dari storage.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setDeleteModal(false)} className="btn-secondary">Batal</button>
                        <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                            {deleting ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
