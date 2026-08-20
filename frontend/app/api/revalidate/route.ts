import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');

  if (tag) {
    // @ts-expect-error Next.js 16 type requires 2 args
    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag, now: Date.now() });
  }

  // If no specific tag, just revalidate all portfolio data
  // @ts-expect-error Next.js 16 type requires 2 args
  revalidateTag('portfolio');
  
  return NextResponse.json({ 
    revalidated: true, 
    message: 'Revalidated all portfolios',
    now: Date.now() 
  });
}
