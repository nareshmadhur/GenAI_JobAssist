import * as cheerio from 'cheerio';

export async function fetchAndExtractTextFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript, iframe, img, svg, header, footer, nav, .nav, .footer, .sidebar').remove();

    // Extract text and clean it up
    let text = $('body').text();
    
    // Replace multiple newlines and spaces with single space/newline
    text = text.replace(/\\s+/g, ' ')
               .replace(/\\n+/g, '\\n')
               .trim();

    return text;
  } catch (error: any) {
    console.error('Error fetching URL:', error);
    throw new Error(`Could not extract text from URL: ${error.message}`);
  }
}
