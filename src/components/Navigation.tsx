'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Navigation() {
  return (
    <nav className="bg-slate-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          EstatePro
        </Link>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-slate-800">
              Home
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="ghost" className="text-white hover:bg-slate-800">
              Admin Panel
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}