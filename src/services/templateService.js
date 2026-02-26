import { supabase } from './supabaseClient'

const BUCKET = 'sidak-templates'

export async function getTemplateFiles() {
    const { data, error } = await supabase
        .from('template_files')
        .select('*')
        .order('uploaded_at', { ascending: false })
    if (error) throw error
    return data
}

export async function getLatestTemplate() {
    const { data, error } = await supabase
        .from('template_files')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    if (error) throw error
    return data
}

export async function uploadTemplate(file) {
    const fileName = `${Date.now()}_${file.name}`
    const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, { upsert: false })
    if (storageError) throw storageError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName)

    const { data, error } = await supabase
        .from('template_files')
        .insert([{ nama_file: file.name, file_url: publicUrl }])
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deleteTemplate(id, file_url) {
    // Extract storage path from URL
    const url = new URL(file_url)
    const pathParts = url.pathname.split(`/${BUCKET}/`)
    const storagePath = pathParts[1] || ''

    if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath])
    }

    const { error } = await supabase.from('template_files').delete().eq('id', id)
    if (error) throw error
}
