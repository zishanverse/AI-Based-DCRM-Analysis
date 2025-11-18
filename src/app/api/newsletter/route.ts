import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    const newsletter = await db.newsletter.create({
      data: {
        email
      }
    })
    
    return NextResponse.json({ message: 'Successfully subscribed to newsletter', newsletter })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already subscribed' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to subscribe to newsletter' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const subscribers = await db.newsletter.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(subscribers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
  }
}