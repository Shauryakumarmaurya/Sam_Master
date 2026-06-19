const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseUrl = rawUrl.replace(/['"]/g, '').trim();
const supabaseKey = rawKey.replace(/['"]/g, '').trim();

export async function POST(req) {
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_PROJECT_ID')) {
    return Response.json({ success: false, error: 'Database not fully configured yet' }, { status: 500 });
  }
  
  try {
    const payload = await req.json();
    
    // We use the existing sam_sync_grades table to store share links as a clever hack
    // by using "SHARE_LINK" as the examId, which gets filtered out from actual grade syncing!
    const shareId = "share_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const newEntry = {
      id: shareId,
      examId: "SHARE_LINK",
      examName: "SHARE_LINK",
      subjectId: "SHARE_LINK",
      subjectName: "SHARE_LINK",
      grades: payload, // Shove the entire payload into the JSONB column
      timestamp: Date.now()
    };
    
    const res = await fetch(`${supabaseUrl}/rest/v1/sam_sync_grades`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(newEntry)
    });
      
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Supabase error: ${res.status} ${errorText}`);
    }
    
    return Response.json({ success: true, id: shareId });
  } catch (error) {
    console.error('Share generation error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) return Response.json({ error: 'Missing ID' }, { status: 400 });
  if (!supabaseUrl || !supabaseKey) return Response.json({ error: 'DB not configured' }, { status: 500 });

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/sam_sync_grades?id=eq.${id}&select=grades`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      next: { revalidate: 0 }
    });
    
    if (!res.ok) throw new Error('Fetch failed');
    
    const data = await res.json();
    if (data.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    
    return Response.json({ payload: data[0].grades });
  } catch (error) {
    return Response.json({ error: 'Failed to retrieve link' }, { status: 500 });
  }
}
