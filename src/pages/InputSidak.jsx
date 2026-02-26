import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardCheck } from 'lucide-react'
import useSidakStore from '../store/useSidakStore'
import toast from 'react-hot-toast'

const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const schema = yup.object({
    nama_ro: yup.string().trim().required('Nama RO wajib diisi'),
    nama_kl: yup.string().trim().required('Nama KL wajib diisi'),
    tanggal_kunjungan: yup.string()
        .required('Tanggal kunjungan wajib diisi')
        .test('not-past', 'Tanggal kunjungan tidak boleh di masa lalu (hanya hari ini & ke depan)', (value) => {
            if (!value) return false;
            return value >= getTodayString();
        }),
})

const RO_OPTIONS = [
    "RO 1/Medan",
    "RO 2/ Pekanbaru",
    "RO 3/Padang",
    "RO 4/Palembang",
    "RO 5/ Bandar Lampung",
    "RO 6/ Jakarta 1",
    "RO 7/ Jakarta 2",
    "RO 8/ Jakarta 3",
    "RO 9/Bandung",
    "RO 10/Semarang",
    "RO 11/Yogyakarta",
    "RO 12/Surabaya",
    "RO 13/Malang",
    "RO 14/Banjarmasin",
    "RO 15/Makassar",
    "RO 16/Manado",
    "RO 17/Denpasar",
    "RO 18/Jayapura"
];

export default function InputSidak() {
    const navigate = useNavigate()
    const { identity, setIdentity } = useSidakStore()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: identity,
    })

    const onSubmit = (data) => {
        setIdentity(data)
        toast.success('Informasi tersimpan!')
        navigate('/checklist')
    }

    return (
        <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2.5 mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold">1</span>
                    <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">Langkah 1 dari 2</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Informasi Awal SIDAK</h1>
                <p className="text-sm text-gray-500 mt-1">Isi data identitas kantor layanan yang akan diinspeksi</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
                <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: '50%' }} />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
                {/* Nama RO */}
                <div>
                    <label className="form-label">
                        Nama Regional Office (RO) <span className="text-red-500">*</span>
                    </label>
                    <select
                        {...register('nama_ro')}
                        className={errors.nama_ro ? 'form-input-error' : 'form-input'}
                    >
                        <option value="">Pilih Regional Office</option>
                        {RO_OPTIONS.map((ro) => (
                            <option key={ro} value={ro}>{ro}</option>
                        ))}
                    </select>
                    {errors.nama_ro && (
                        <p className="text-xs text-red-500 mt-1">{errors.nama_ro.message}</p>
                    )}
                </div>

                {/* Nama KL */}
                <div>
                    <label className="form-label">
                        Nama Kantor Layanan (KL) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('nama_kl')}
                        className={errors.nama_kl ? 'form-input-error' : 'form-input'}
                        placeholder="Contoh: CRO Jakarta"
                    />
                    {errors.nama_kl && (
                        <p className="text-xs text-red-500 mt-1">{errors.nama_kl.message}</p>
                    )}
                </div>

                {/* Tanggal Kunjungan */}
                <div>
                    <label className="form-label">
                        Tanggal Kunjungan <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        min={getTodayString()}
                        {...register('tanggal_kunjungan')}
                        className={errors.tanggal_kunjungan ? 'form-input-error' : 'form-input'}
                    />
                    {errors.tanggal_kunjungan && (
                        <p className="text-xs text-red-500 mt-1">{errors.tanggal_kunjungan.message}</p>
                    )}
                </div>

                {/* Submit */}
                <div className="pt-2">
                    <button type="submit" className="btn-primary w-full justify-center py-2.5">
                        Lanjut ke Pengisian Checklist
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </form>

            {/* Info Box */}
            <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-100">
                <div className="flex items-start gap-3">
                    <ClipboardCheck className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-brand-700">
                        Setelah melengkapi informasi ini, Anda akan diarahkan ke halaman pengisian checklist aspek penilaian.
                    </p>
                </div>
            </div>
        </div>
    )
}
