import { NextResponse } from 'next/server';
import { getEbayApplicationToken } from '@/services/ebay';

export async function GET() {
  try {
    await getEbayApplicationToken();

    return NextResponse.json({
      success: true,
      tokenReceived: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve eBay application token',
      },
      { status: 500 },
    );
  }
}
