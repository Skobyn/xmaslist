// API Route Template (App Router)
// Place in: app/api/[route-name]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'

// Optional: Configure route segment
// export const runtime = 'edge' | 'nodejs'
// export const dynamic = 'force-dynamic' | 'force-static'

// GET handler
export async function GET(request: NextRequest) {
  try {
    // Access URL search params
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const page = searchParams.get('page') || '1'

    // Access headers
    const headersList = headers()
    const authorization = headersList.get('authorization')

    // Access cookies
    const cookieStore = cookies()
    const token = cookieStore.get('token')

    // Validate authentication
    if (!authorization) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch data
    const data = await fetchData(query, parseInt(page))

    // Return JSON response
    return NextResponse.json(
      { data, page: parseInt(page) },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    // Parse JSON body
    const body = await request.json()

    // Validate body
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content' },
        { status: 400 }
      )
    }

    // Access headers
    const headersList = headers()
    const auth = headersList.get('authorization')

    // Validate authentication
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process data
    const result = await createData(body)

    // Set cookies
    cookies().set('last_action', 'create', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    })

    // Return created resource
    return NextResponse.json(
      { data: result },
      {
        status: 201,
        headers: {
          'Location': `/api/items/${result.id}`,
        },
      }
    )
  } catch (error) {
    console.error('POST error:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// PUT handler
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      )
    }

    // Update data
    const result = await updateData(id, body)

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// DELETE handler
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      )
    }

    // Delete data
    await deleteData(id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// PATCH handler (partial update)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      )
    }

    // Partial update
    const result = await patchData(id, body)

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// Example: Dynamic route API
// Place in: app/api/posts/[id]/route.ts
export async function GET_DynamicExample(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id

  try {
    const post = await getPost(id)

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: post })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// Helper functions
async function fetchData(query: string | null, page: number) {
  // Implement data fetching logic
  return { items: [], total: 0 }
}

async function createData(data: any) {
  // Implement data creation logic
  return { id: '1', ...data }
}

async function updateData(id: string, data: any) {
  // Implement data update logic
  return { id, ...data }
}

async function deleteData(id: string) {
  // Implement data deletion logic
}

async function patchData(id: string, data: any) {
  // Implement partial update logic
  return { id, ...data }
}

async function getPost(id: string) {
  // Implement post fetching logic
  return null
}

// Custom error class
class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Example: Middleware pattern for API routes
function withAuth(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const token = request.headers.get('authorization')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify token
    try {
      const user = await verifyToken(token)
      // Attach user to request (in practice, use context or other method)
      return handler(request, { ...context, user })
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
  }
}

async function verifyToken(token: string) {
  // Implement token verification
  return { id: '1', name: 'User' }
}
