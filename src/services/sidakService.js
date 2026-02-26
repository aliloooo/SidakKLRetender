import { supabase } from './supabaseClient'
import { calcTotalNilai, determineStatus } from '../utils/calculateScore'

// ── SIDAK Header ─────────────────────────────────────────────
export async function getSidakList() {
    const { data, error } = await supabase
        .from('sidak_header')
        .select(`
      *,
      sidak_detail (
        id, aspek_id, sub_aspek_id, jumlah_unit, kelengkapan, keterangan, nilai,
        sub_aspek (nama_sub_aspek)
      )
    `)
        .order('created_at', { ascending: false })
    if (error) throw error
    return data
}

export async function getSidakById(id) {
    const { data, error } = await supabase
        .from('sidak_header')
        .select(`
            *,
            sidak_detail (
                *,
                sub_aspek (nama_sub_aspek)
            )
        `)
        .eq('id', id)
        .single()
    if (error) throw error
    return data
}

export async function updateSidak(id, { identity, details }) {
    // 1. Calculate new totals
    const total_nilai = calcTotalNilai(details)
    const status = determineStatus(total_nilai)

    // 2. Update header
    const { data: updatedHeader, error: headerError } = await supabase
        .from('sidak_header')
        .update({
            nama_ro: identity.nama_ro,
            nama_kl: identity.nama_kl,
            tanggal_kunjungan: identity.tanggal_kunjungan,
            total_nilai,
            status,
        })
        .eq('id', id)
        .select()

    if (headerError) throw headerError
    const header = updatedHeader && updatedHeader.length > 0 ? updatedHeader[0] : null
    if (!header) throw new Error('Data tidak ditemukan atau gagal diperbarui')

    // 3. Delete old details
    const { error: deleteError } = await supabase
        .from('sidak_detail')
        .delete()
        .eq('sidak_id', id)
    if (deleteError) throw deleteError

    // 4. Insert new details
    const detailRows = details.map((d) => ({
        sidak_id: id,
        aspek_id: d.aspek_id,
        sub_aspek_id: d.sub_aspek_id,
        jumlah_unit: d.jumlah_unit || 0,
        kelengkapan: d.kelengkapan,
        keterangan: d.keterangan || '',
        nilai: d.nilai,
    }))

    const { error: insertError } = await supabase
        .from('sidak_detail')
        .insert(detailRows)
    if (insertError) throw insertError

    return { ...header, sidak_detail: detailRows }
}

// ── Create full SIDAK (header + detail) ─────────────────────
export async function createSidak({ identity, details }) {
    // 1. Calculate totals
    const total_nilai = calcTotalNilai(details)
    const status = determineStatus(total_nilai)

    // 2. Insert header
    const { data: header, error: headerError } = await supabase
        .from('sidak_header')
        .insert([{
            nama_ro: identity.nama_ro,
            nama_kl: identity.nama_kl,
            tanggal_kunjungan: identity.tanggal_kunjungan,
            total_nilai,
            status,
        }])
        .select()
        .single()
    if (headerError) throw headerError

    // 3. Insert detail rows
    const detailRows = details.map((d) => ({
        sidak_id: header.id,
        aspek_id: d.aspek_id,
        sub_aspek_id: d.sub_aspek_id,
        jumlah_unit: d.jumlah_unit || 0,
        kelengkapan: d.kelengkapan,
        keterangan: d.keterangan || '',
        nilai: d.nilai,
    }))

    const { error: detailError } = await supabase
        .from('sidak_detail')
        .insert(detailRows)
    if (detailError) throw detailError

    return { ...header, sidak_detail: detailRows }
}

export async function deleteSidak(id) {
    // sidak_detail should cascade, but just in case:
    await supabase.from('sidak_detail').delete().eq('sidak_id', id)
    const { error } = await supabase.from('sidak_header').delete().eq('id', id)
    if (error) throw error
}
