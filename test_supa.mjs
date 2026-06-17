import fs from 'fs';

async function testSupabase() {
  const url = 'https://gubiqlwizaiipbvtscqc.supabase.co';
  const key = 'sb_publishable_6ftrB5JVmrUSfhtaFEULBg_l5mX8QlU';
  
  const newEntry = {
    id: 'test_123',
    examId: 'e1',
    examName: 'Exam',
    subjectId: 's1',
    subjectName: 'Sub',
    grades: {},
    timestamp: Date.now()
  };
  
  console.log('Sending to:', `${url}/rest/v1/sam_sync_grades`);
  
  try {
    const res = await fetch(`${url}/rest/v1/sam_sync_grades`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(newEntry)
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.log('FAILED!', res.status, text);
    } else {
      console.log('SUCCESS!');
    }
  } catch (err) {
    console.error('Network Error:', err);
  }
}

testSupabase();
