const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

export function getStorageUrl(path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
}
