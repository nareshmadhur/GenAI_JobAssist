import * as cheerio from 'cheerio';

export interface ExtractedUrlContent {
  pageTitle: string;
  pageText: string;
  candidateBlocks: string[];
}

const JOB_SECTION_KEYWORDS =
  /(job|role|position|responsibilities|requirements|qualifications|about the role|about you|what you'll do|what you bring|experience|skills|summary|description)/i;

const NOISE_SELECTOR = [
  'script',
  'style',
  'noscript',
  'iframe',
  'img',
  'svg',
  'header',
  'footer',
  'nav',
  'form',
  'button',
  'aside',
  '[aria-hidden="true"]',
  '.nav',
  '.footer',
  '.sidebar',
  '.cookie',
  '.cookies',
  '.banner',
  '.modal',
  '.toast',
  '.newsletter',
  '.recommendations',
  '.related-jobs',
].join(', ');

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function scoreCandidate(text: string): number {
  const keywordHits = (text.match(JOB_SECTION_KEYWORDS) || []).length;
  const lengthScore = Math.min(text.length, 12000) / 400;
  return keywordHits * 25 + lengthScore;
}

function sliceCandidate(text: string, maxLength = 5000): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export async function fetchAndExtractTextFromUrl(url: string): Promise<ExtractedUrlContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $(NOISE_SELECTOR).remove();

    const title =
      normalizeText($('title').first().text()) ||
      normalizeText($('meta[property="og:title"]').attr('content') || '') ||
      normalizeText($('h1').first().text()) ||
      'Job posting';

    const candidateSelectors = [
      'main',
      'article',
      '[role="main"]',
      '[class*="job"]',
      '[id*="job"]',
      '[class*="posting"]',
      '[id*="posting"]',
      '[class*="description"]',
      '[id*="description"]',
      '[class*="content"]',
      '[data-testid*="job"]',
      'section',
    ];

    const candidates = candidateSelectors.flatMap((selector) =>
      $(selector)
        .toArray()
        .map((element) => normalizeText($(element).text()))
        .filter((text) => text.length >= 250)
    );

    const dedupedCandidates = Array.from(new Set(candidates))
      .sort((a, b) => scoreCandidate(b) - scoreCandidate(a))
      .slice(0, 4)
      .map((text) => sliceCandidate(text));

    const bodyText = normalizeText($('body').text());
    const pageTextSource = dedupedCandidates[0] || bodyText;
    const pageText = sliceCandidate(pageTextSource, 18000);

    return {
      pageTitle: title,
      pageText,
      candidateBlocks: dedupedCandidates,
    };
  } catch (error: any) {
    console.error('Error fetching URL:', error);
    throw new Error(`Could not extract text from URL: ${error.message}`);
  }
}
