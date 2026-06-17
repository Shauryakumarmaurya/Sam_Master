const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseUrl = rawUrl.replace(/['"]/g, '').trim();
const supabaseKey = rawKey.replace(/['"]/g, '').trim();

export async function GET() {
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_PROJECT_ID')) {
    return Response.json([]);
  }
  
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/sam_sync_grades?select=*&order=timestamp.desc&limit=50`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      next: { revalidate: 0 } // Ensure Next.js doesn't cache this request
    });
    
    if (!res.ok) {
      const txt = await res.text();
      console.error('Supabase GET error:', res.status, txt);
      throw new Error(`Failed to fetch from Supabase: ${res.status} ${txt}`);
    }
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    console.error('Error reading DB', err);
    return Response.json([]);
  }
}

export async function POST(req) {
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_PROJECT_ID')) {
    return Response.json({ success: false, error: 'Supabase not fully configured yet' }, { status: 500 });
  }
  
  try {
    const payload = await req.json();
    
    const newEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      "examId": payload.examId,
      "examName": payload.examName || 'Exam',
      "subjectId": payload.subjectId,
      "subjectName": payload.subjectName || 'Subject',
      "grades": payload.grades,
      "timestamp": Date.now()
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
      console.error('Supabase POST error:', res.status, errorText);
      throw new Error(`Supabase error: ${res.status} ${errorText}`);
    }
    
    return Response.json({ success: true, id: newEntry.id });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: error.message || 'Failed to save' }, { status: 500 });
  }
}
