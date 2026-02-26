import { create } from 'zustand'

const useSidakStore = create((set) => ({
    // Step 1 identity data (temp, before DB insert)
    identity: {
        nama_ro: '',
        nama_kl: '',
        tanggal_kunjungan: '',
    },
    setIdentity: (data) => set({ identity: data }),
    resetIdentity: () =>
        set({
            identity: { nama_ro: '', nama_kl: '', tanggal_kunjungan: '' },
        }),
}))

export default useSidakStore
