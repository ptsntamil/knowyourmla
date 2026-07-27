import { NextResponse } from 'next/server';
import { MLAService } from '@/lib/services/mla.service';

export async function GET() {
  const service = new MLAService();
  const profile = await service.getMLAProfile('ramesh_srinivasan');
  return NextResponse.json(profile);
}
