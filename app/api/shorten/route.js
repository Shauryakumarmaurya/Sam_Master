export async function POST(req) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Use TinyURL free API to shorten the massive payload link
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    
    if (!res.ok) {
      throw new Error('Failed to shorten URL');
    }
    
    const shortUrl = await res.text();
    
    return Response.json({ shortUrl });
  } catch (error) {
    console.error('URL Shortening error:', error);
    return Response.json({ error: 'Failed to shorten URL' }, { status: 500 });
  }
}
