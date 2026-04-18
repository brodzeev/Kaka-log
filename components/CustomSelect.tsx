'use client'

import { useState, useRef, useEffect } from 'react'

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
  className?: string
  textColor?: string
  bgColor?: string
  borderColor?: string
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  textColor = 'text-slate-900',
  bgColor = 'bg-slate-100',
  borderColor = 'border-slate-300'
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-xl border ${borderColor} px-3 py-2 text-sm text-left flex items-center justify-between ${bgColor} ${textColor} ${className}`}
      >
        <span>{selectedOption?.label || placeholder || 'Select...'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-2 rounded-xl border ${borderColor} ${bgColor} shadow-lg overflow-hidden`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-sm text-left ${textColor} hover:opacity-80 transition-opacity ${
                value === option.value ? `font-semibold opacity-100` : 'opacity-80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
