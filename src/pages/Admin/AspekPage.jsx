import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { getAspek, createAspek, updateAspek, deleteAspek } from '../../services/aspekService'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AspekPage() {
    const [aspekList, setAspekList] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [editItem, setEditItem] = useState(null) // null = add, object = edit
    const [deleteItem, setDeleteItem] = useState(null)
    const [form, setForm] = useState({ nama_aspek: '', bobot_aspek: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        try {
            const data = await getAspek()
            setAspekList(data)
        } catch (err) {
            toast.error('Gagal memuat aspek: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    function openAdd() {
        setEditItem(null)
        setForm({ nama_aspek: '', bobot_aspek: '' })
        setModalOpen(true)
    }

    function openEdit(item) {
        setEditItem(item)
        setForm({ nama_aspek: item.nama_aspek, bobot_aspek: item.bobot_aspek })
        setModalOpen(true)
    }

    function openDelete(item) {
        setDeleteItem(item)
        setDeleteModalOpen(true)
    }

    const totalBobot = aspekList.reduce((s, a) => s + Number(a.bobot_aspek), 0)

    async function handleSave(e) {
        e.preventDefault()
        if (!form.nama_aspek.trim()) return toast.error('Nama aspek wajib diisi')
        if (!form.bobot_aspek || isNaN(form.bobot_aspek)) return toast.error('Bobot harus berupa angka')

        // Decimal validation (max 2 decimal places)
        const bobotStr = form.bobot_aspek.toString()
        if (bobotStr.includes('.') && bobotStr.split('.')[1].length > 2) {
            return toast.error('Bobot maksimal 2 angka di belakang koma')
        }

        setSaving(true)
        try {
            if (editItem) {
                await updateAspek(editItem.id, { nama_aspek: form.nama_aspek, bobot_aspek: Number(form.bobot_aspek) })
                toast.success('Aspek diperbarui!')
            } else {
                await createAspek({ nama_aspek: form.nama_aspek, bobot_aspek: Number(form.bobot_aspek) })
                toast.success('Aspek ditambahkan!')
            }
            setModalOpen(false)
            loadData()
        } catch (err) {
            toast.error('Gagal menyimpan: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        setSaving(true)
        try {
            await deleteAspek(deleteItem.id)
            toast.success('Aspek dihapus!')
            setDeleteModalOpen(false)
            loadData()
        } catch (err) {
            toast.error('Gagal menghapus: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Aspek</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola aspek penilaian dan bobot masing-masing</p>
                </div>
                <button onClick={openAdd} className="btn-primary w-full sm:w-auto justify-center">
                    <Plus className="w-4 h-4" /> Tambah Aspek
                </button>
            </div>

            {/* Bobot total warning */}
            {totalBobot !== 100 && aspekList.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                        Total bobot saat ini <strong>{totalBobot.toFixed(2)}%</strong>. Idealnya total bobot aspek = 100%.
                    </p>
                </div>
            )}

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                {loading ? <LoadingSpinner /> : aspekList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="text-gray-400">Belum ada aspek. Klik "Tambah Aspek" untuk memulai.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="table-th w-10 hidden sm:table-cell">No</th>
                                    <th className="table-th min-w-[150px]">Nama Aspek</th>
                                    <th className="table-th w-32 text-center">Bobot (%)</th>
                                    <th className="table-th w-32 text-center">Aksi</th>
                                </tr>
                            </thead>

                            <tbody>
                                {aspekList.map((a, idx) => (
                                    <tr key={a.id} className="hover:bg-gray-50">
                                        <td className="table-td text-gray-400 w-10 hidden sm:table-cell">{idx + 1}</td>
                                        <td className="table-td font-medium text-gray-900">{a.nama_aspek}</td>
                                        <td className="table-td text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                                                {Number(a.bobot_aspek).toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="table-td text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openDelete(a)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {/* Add/Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Aspek' : 'Tambah Aspek'}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="form-label">Nama Aspek <span className="text-red-500">*</span></label>
                        <input
                            className="form-input"
                            value={form.nama_aspek}
                            onChange={(e) => setForm({ ...form, nama_aspek: e.target.value })}
                            placeholder="Contoh: Layanan Nasabah"
                        />
                    </div>
                    <div>
                        <label className="form-label">Bobot (%) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            className="form-input"
                            value={form.bobot_aspek}
                            onChange={(e) => setForm({ ...form, bobot_aspek: e.target.value })}
                            placeholder="Contoh: 30.25"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Hapus Aspek" size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Yakin ingin menghapus aspek <strong>"{deleteItem?.nama_aspek}"</strong>?
                        Semua sub aspek terkait juga akan terhapus.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary">Batal</button>
                        <button onClick={handleDelete} disabled={saving} className="btn-danger">
                            {saving ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
