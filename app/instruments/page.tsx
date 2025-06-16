// app/page.tsx or app/instruments/page.tsx
import { createClient } from '@/utils/supabase/server'

export default async function InstrumentsPage() {
  const supabase = await createClient()
  
  // Fetch instruments data
  const { data: instruments, error } = await supabase
    .from('instruments')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Error Loading Instruments</h1>
        <p className="text-red-500">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-black">Musical Instruments</h1>
        
        {instruments && instruments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {instruments.map((instrument) => (
              <div
                key={instrument.id}
                className="p-6 bg-white border-2 border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-black">
                    {instrument.name}
                  </h2>
                  <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                    ID: {instrument.id}
                  </span>
                </div>
                
                {/* Display any additional fields if they exist */}
                {Object.entries(instrument).map(([key, value]) => {
                  if (key !== 'id' && key !== 'name' && value !== null) {
                    return (
                      <div key={key} className="mt-2">
                        <span className="text-sm font-medium text-gray-800 capitalize">
                          {key.replace('_', ' ')}: 
                        </span>
                        <span className="text-sm text-black ml-2 font-medium">
                          {String(value)}
                        </span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-800 text-lg font-medium">No instruments found in the database.</p>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Database Info:</h3>
          <p className="text-sm text-blue-800">
            Found {instruments?.length || 0} instrument(s) in the database
          </p>
        </div>
      </div>
    </div>
  )
}