import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, mobile, city } = await request.json()
    
    const contactForm = await db.contactForm.create({
      data: {
        fullName,
        email,
        mobile,
        city
      }
    })
    
    return NextResponse.json({ message: 'Contact form submitted successfully', contactForm })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit contact form' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const contacts = await db.contactForm.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(contacts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}