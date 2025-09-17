"use client"

export function EnvChecker() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded z-50 max-w-sm">
      <h3 className="font-bold">Environment Check:</h3>
      <div className="text-sm mt-2">
        <div>URL: {supabaseUrl ? '✅ SET' : '❌ MISSING'}</div>
        <div>Key: {supabaseKey ? '✅ SET' : '❌ MISSING'}</div>
        {supabaseUrl && (
          <div className="mt-1 text-xs break-all">
            URL: {supabaseUrl.substring(0, 30)}...
          </div>
        )}
      </div>
    </div>
  )
}