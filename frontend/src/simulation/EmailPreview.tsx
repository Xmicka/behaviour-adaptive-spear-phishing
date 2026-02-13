import React from 'react'

export default function EmailPreview({subject, body}:{subject:string; body:string}){
  return (
    <div className="card">
      <div className="text-xs text-gray-400">Preview</div>
      <div className="mt-2">
        <div className="font-semibold">{subject}</div>
        <div className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{body}</div>
      </div>
    </div>
  )
}
