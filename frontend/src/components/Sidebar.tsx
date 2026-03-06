import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SidebarItem {
    id: string
    label: string
    icon: React.ReactNode
}

interface SidebarProps {
    items: SidebarItem[]
    activeId: string
    onSelect: (id: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ items, activeId, onSelect }) => {
    const [isHovered, setIsHovered] = useState(false)
    const [isOpenMobile, setIsOpenMobile] = useState(false)

    return (
        <>
            {/* Mobile Header Toggle */}
            <div className="md:hidden fixed z-50 top-16 left-4">
                <button
                    onClick={() => setIsOpenMobile(!isOpenMobile)}
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpenMobile ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>
            </div>

            {/* Desktop Sidebar (hover-expandable) & Mobile overlay */}
            <AnimatePresence>
                <motion.div
                    initial={{ x: -300 }}
                    animate={{ x: isOpenMobile ? 0 : -300 }}
                    className={`md:!transform-none fixed z-40 top-16 bottom-0 left-0 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 transition-all duration-300 ease-in-out md:translate-x-0 ${isHovered ? 'w-64' : 'w-16 md:w-20'
                        }`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className="flex flex-col h-full py-6 overflow-y-auto overflow-x-hidden">
                        <div className="px-4 mb-6">
                            <h2 className={`text-xs font-bold text-slate-500 uppercase tracking-wider transition-opacity duration-200 ${isHovered || isOpenMobile ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}>
                                Navigation
                            </h2>
                        </div>

                        <nav className="flex-1 px-2 space-y-1">
                            {items.map((item) => {
                                const isActive = activeId === item.id
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onSelect(item.id)
                                            setIsOpenMobile(false)
                                        }}
                                        className={`
                      w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
                      ${isActive
                                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            }
                    `}
                                    >
                                        <div className={`flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                            {item.icon}
                                        </div>

                                        <span
                                            className={`
                        ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300
                        ${isHovered || isOpenMobile ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden md:hidden'}
                      `}
                                        >
                                            {item.label}
                                        </span>

                                        {isActive && (isHovered || isOpenMobile) && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                                            />
                                        )}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>
                </motion.div>
            </AnimatePresence>
        </>
    )
}

export default Sidebar
