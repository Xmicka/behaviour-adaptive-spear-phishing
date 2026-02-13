import React from 'react'

export default function Section({ title, children }: { title: string; children: React.ReactNode }){
  return (
    <section className="mb-6">
      <h2 className="text-lg font-medium mb-2">{title}</h2>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}
