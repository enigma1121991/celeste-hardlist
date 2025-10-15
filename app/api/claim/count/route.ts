import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { canVerify } from '@/lib/auth-utils'
import { getPendingClaimCount } from '@/lib/queries/claims'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || !canVerify(session.user.role)) {
      return NextResponse.json({ count: 0 })
    }

    const count = await getPendingClaimCount()
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching pending claim count:', error)
    return NextResponse.json({ count: 0 })
  }
}



