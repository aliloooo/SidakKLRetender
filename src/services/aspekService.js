import { supabase } from './supabaseClient'

// ── Aspek ───────────────────────────────────────────────────
export async function getAspek() {
    const { data, error } = await supabase
        .from('aspek')
        .select('*')
        .order('nama_aspek')
    if (error) throw error
    return data
}

export async function createAspek({ nama_aspek, bobot_aspek }) {
    const { data, error } = await supabase
        .from('aspek')
        .insert([{ nama_aspek, bobot_aspek }])
        .select()
        .single()
    if (error) throw error
    return data
}

export async function updateAspek(id, { nama_aspek, bobot_aspek }) {
    const { data, error } = await supabase
        .from('aspek')
        .update({ nama_aspek, bobot_aspek })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deleteAspek(id) {
    const { error } = await supabase.from('aspek').delete().eq('id', id)
    if (error) throw error
}

// ── Sub Aspek ────────────────────────────────────────────────
export async function getSubAspek(aspek_id = null) {
    let query = supabase
        .from('sub_aspek')
        .select('*, aspek:aspek_id(nama_aspek, bobot_aspek)')
        .order('nama_sub_aspek')
    if (aspek_id) query = query.eq('aspek_id', aspek_id)
    const { data, error } = await query
    if (error) throw error
    return data
}

export async function getAllSubAspekByAspek() {
    const { data, error } = await supabase
        .from('sub_aspek')
        .select('*, aspek:aspek_id(nama_aspek, bobot_aspek)')
        .order('aspek_id')
    if (error) throw error
    return data
}

export async function createSubAspek({ aspek_id, nama_sub_aspek, bobot_sub_aspek }) {
    const { data, error } = await supabase
        .from('sub_aspek')
        .insert([{ aspek_id, nama_sub_aspek, bobot_sub_aspek }])
        .select()
        .single()
    if (error) throw error
    return data
}

export async function updateSubAspek(id, { aspek_id, nama_sub_aspek, bobot_sub_aspek }) {
    const { data, error } = await supabase
        .from('sub_aspek')
        .update({ aspek_id, nama_sub_aspek, bobot_sub_aspek })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deleteSubAspek(id) {
    const { error } = await supabase.from('sub_aspek').delete().eq('id', id)
    if (error) throw error
}
