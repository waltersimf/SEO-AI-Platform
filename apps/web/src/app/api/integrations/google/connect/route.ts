import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get token from query parameter
    const token = request.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Make authenticated request to backend
    const response = await fetch('http://localhost:4000/api/integrations/google/connect', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      redirect: 'manual',
    });

    // Get redirect location
    const location = response.headers.get('location');
    
    if (location) {
      // Redirect to Google OAuth
      return NextResponse.redirect(location);
    }

    return NextResponse.json({ error: 'No redirect' }, { status: 500 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}