'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getFeedbackSubmissions, createComment } from '@/actions/cabang'
import { getCurrentProfile } from '@/actions/auth'
import { MessagesSquare, Search, Filter, Send, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

export default function FeedbackPage() {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  // New states for Tab-Based Chat UI
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeUlok, setActiveUlok] = useState<any>(null)
  const [chatInput, setChatInput] = useState('')

  // Scroll ref for tab strip
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const scrollTabs = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  const fetchSubmissions = React.useCallback(async () => {
    setLoading(true)
    // Fetch current user profile
    const profileRes = await getCurrentProfile()
    if (profileRes.success && profileRes.profile) {
      setCurrentUser(profileRes.profile)
    }
    // Fetch submissions
    const res = await getFeedbackSubmissions()
    if (res.success && res.data) {
      setSubmissions(res.data)
    } else {
      if (res.error && res.error.includes('Unauthorized')) {
        router.push('/')
      } else {
        alert('Gagal memuat feedback: ' + res.error)
      }
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchSubmissions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Step 2: Fixed processedSubmissions — show ALL submissions with at least 1 comment, sort by newest comment
  const processedSubmissions = React.useMemo(() => {
    return submissions
      .map((sub) => {
        // Sort all comments chronologically to find the last comment
        const allCommentsSorted = [...(sub.comments || [])].sort(
          (a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
        const lastComment = allCommentsSorted[allCommentsSorted.length - 1]

        return {
          ...sub,
          allCommentsSorted,
          lastComment,
        }
      })
      .filter((sub) => sub.allCommentsSorted.length > 0) // MUST have at least 1 comment from anyone
      .sort((a, b) => {
        // Sort descending by last comment date (newest chat always on the left)
        const dateA = new Date(a.lastComment?.created_at || a.created_at).getTime()
        const dateB = new Date(b.lastComment?.created_at || b.created_at).getTime()
        return dateB - dateA
      })
  }, [submissions])

  const filteredTabSubmissions = React.useMemo(() => {
    return processedSubmissions.filter((sub) => {
      const matchSearch = sub.nama_lokasi?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus =
        statusFilter === 'all' || sub.status?.toLowerCase() === statusFilter.toLowerCase()
      return matchSearch && matchStatus
    })
  }, [processedSubmissions, searchQuery, statusFilter])

  useEffect(() => {
    if (filteredTabSubmissions.length === 0) {
      setActiveUlok(null)
      return
    }

    // First load: select the newest chat
    if (!activeUlok) {
      setActiveUlok(filteredTabSubmissions[0])
      return
    }

    // Keep the currently selected chat synced with the newest fetched data.
    // This fixes messages from other users only appearing after switching tabs.
    const freshActive = filteredTabSubmissions.find(
      (sub) => sub.id === activeUlok.id
    )

    if (freshActive) {
      setActiveUlok(freshActive)
    } else {
      // If the current chat is no longer in the active filter, select the first one.
      setActiveUlok(filteredTabSubmissions[0])
    }
  }, [filteredTabSubmissions])

  const parseFeedbackMessage = (message: string) => {
    if (!message) return { tag: null, text: '' }
    const match = message.match(/\[([\s\S]*?)\]:\s*([\s\S]*)$/)
    if (match) {
      return { tag: match[1], text: match[2].trim() }
    }
    return { tag: null, text: message }
  }

  // Step 5: Fixed send logic — re-fetches all submissions and updates activeUlok + sorts tabs
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !activeUlok || !currentUser) return

    setIsSending(true)
    try {
      const res = await createComment(activeUlok.id, currentUser.id, chatInput)
      if (res.success) {
        setChatInput('')
        // Re-fetch to update all submissions and trigger sorting
        const freshRes = await getFeedbackSubmissions()
        if (freshRes.success && freshRes.data) {
          setSubmissions(freshRes.data)
          // Find the updated active ulok to refresh the chat window
          const updatedActive = freshRes.data.find((s: any) => s.id === activeUlok.id)
          if (updatedActive) {
            const allCommentsSorted = [...(updatedActive.comments || [])].sort(
              (a: any, b: any) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            )
            setActiveUlok({
              ...updatedActive,
              allCommentsSorted,
              lastComment: allCommentsSorted[allCommentsSorted.length - 1],
            })
          }
        }
      } else {
        alert('Gagal mengirim pesan: ' + res.error)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      <div className="space-y-6">

        {/* === HEADER: FEEDBACK === */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Feedback Assessor
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
            Daftar feedback, catatan revisi, dan pesan dari Assessor untuk usulan lokasi cabang Anda.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#142B4D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ACTION BAR: SEARCH, FILTER & REFRESH */}
            <div className="flex flex-row items-center gap-2 mb-6 relative z-20">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4D] dark:focus:ring-blue-500 transition-all shadow-sm h-11 md:h-10"
                />
              </div>

              {/* Filter */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`w-11 h-11 sm:w-auto sm:h-10 sm:px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${
                    statusFilter !== 'all'
                      ? 'border-[#142B4D] text-[#142B4D] dark:border-blue-500 dark:text-blue-400 bg-blue-50/50'
                      : 'border-gray-200 dark:border-gray-800'
                  }`}
                  title="Filter Status"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-30 py-2">
                    {/* Draft removed from options */}
                    {['all', 'In Review', 'Revisi', 'Approved'].map((status) => (
                      <button
                        key={status}
                        onClick={() => { setStatusFilter(status); setIsFilterOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          statusFilter === status
                            ? 'font-bold text-[#142B4D] dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {status === 'all' ? 'Semua Status' : status}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchSubmissions()}
                disabled={loading}
                className="w-11 h-11 sm:w-auto sm:h-10 sm:px-4 shrink-0 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-sm">Refresh</span>
              </button>
            </div>

            {/* HORIZONTAL TABS (MASTER) */}
            <div className="relative group mb-2">
              {/* Left Arrow (Desktop Only) */}
              <button
                onClick={() => scrollTabs('left')}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-10 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center shadow-md text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-blue-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-3 pb-4 snap-x scrollbar-hide scroll-smooth"
              >
                {filteredTabSubmissions.length === 0 ? (
                  <div className="text-sm text-gray-400 p-4 w-full text-center border border-dashed rounded-xl border-gray-200 dark:border-gray-800">
                    Tidak ada data yang cocok dengan pencarian/filter.
                  </div>
                ) : (
                  filteredTabSubmissions.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveUlok(sub)}
                      className={`shrink-0 w-[calc(50%-0.375rem)] md:w-60 lg:w-[calc(25%-0.75rem)] p-3.5 rounded-xl border text-left transition-all snap-start shadow-sm flex flex-col gap-1.5 ${
                        activeUlok?.id === sub.id
                          ? 'dark:border-blue-500 bg-blue-50/80 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <h4 className="font-bold text-sm truncate text-gray-900 dark:text-gray-100 w-full">
                        {sub.nama_lokasi}
                      </h4>

                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {sub.lastComment?.profiles?.full_name || 'System'}:
                        </span>{' '}
                        {sub.lastComment?.message || ''}
                      </p>

                      <p className="text-[10px] text-gray-500 flex items-center mt-0.5 font-medium">
                        Status:{' '}
                        <span className="font-bold ml-1 text-gray-700 dark:text-gray-300">
                          {sub.status}
                        </span>
                      </p>
                    </button>
                  ))
                )}
              </div>

              {/* Right Arrow (Desktop Only) */}
              <button
                onClick={() => scrollTabs('right')}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 -mr-2 z-10 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center shadow-md text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-blue-500"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* CHAT ROOM (DETAIL) */}
            {activeUlok && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 overflow-hidden flex flex-col h-[800px]">

                {/* Chat Header */}
                <div className="bg-[#142B4D] dark:bg-slate-900 px-4 py-3 md:px-5 md:py-3.5 flex flex-wrap items-center justify-between gap-3 transition-colors rounded-t-xl">
                  <h3 className="text-white font-bold text-sm md:text-base flex items-center gap-2.5 min-w-0">
                    <MessagesSquare className="w-5 h-5 md:w-5.5 md:h-5.5 text-blue-400 shrink-0" />

                    <span className="shrink-0 text-white/80">
                      ChatRoom -
                    </span>

                    <span
                      onClick={() => {
                        const isPerorangan = [
                          "Perorangan",
                          "Waris",
                          "Hibah",
                          "Kuasa",
                        ].includes(activeUlok.jenis_badan_hukum)

                        router.push(
                          `/admin/cabang/usulan-lokasi/form/${
                            isPerorangan ? "perorangan" : "badanhukum"
                          }?id=${activeUlok.id}`,
                        )
                      }}
                      className="truncate max-w-[150px] md:max-w-md cursor-pointer text-white hover:text-blue-300 transition-all duration-200"
                      title="Klik untuk masuk ke detail usulan"
                    >
                      {activeUlok.nama_lokasi}
                    </span>
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] md:text-[11px] text-blue-100 bg-black/20 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full whitespace-nowrap hidden sm:inline-block">
                      Last Chat:{" "}
                      {activeUlok.lastComment
                        ? new Date(
                            activeUlok.lastComment.created_at,
                          ).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* Messages Area */}
                <div
                  className="
                    flex-1 overflow-y-auto
                    px-2 py-3
                    md:px-5 md:py-4
                    space-y-1.5 md:space-y-2
                    bg-gray-50 dark:bg-gray-950
                    bg-[radial-gradient(circle_at_1px_1px,_rgba(20,43,77,0.06)_1px,_transparent_0)]
                    [background-size:8px_8px]
                    dark:bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.035)_1px,_transparent_0)]
                    transition-colors
                  "
                >
                  {!activeUlok.allCommentsSorted ||
                  activeUlok.allCommentsSorted.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400 dark:text-gray-600 text-xs md:text-sm">
                        Belum ada pesan.
                      </div>
                    </div>
                  ) : (
                    activeUlok.allCommentsSorted?.map((msg: any) => {
                      // Check if current logged-in user sent this message
                      const isSelf =
                        currentUser?.id === msg.user_id ||
                        currentUser?.id === msg.profiles?.id

                      // Check if message is from any admin cabang
                      const isAdminCabang =
                        msg.profiles?.role === "admin_cabang"

                      const { tag, text } = parseFeedbackMessage(msg.message)

                      const isComplaint =
                        msg.message?.includes("[Catatan Assessor")

                      return (
                        <div
                          key={msg.id}
                          className={`flex w-full ${
                            isSelf || isAdminCabang
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`
                              group
                              max-w-[82%]
                              sm:max-w-[70%]
                              md:max-w-[65%]
                              px-3 py-2
                              md:px-4 md:py-2.5
                              rounded-lg
                              shadow-sm
                              transition-all duration-150
                              leading-relaxed

                              ${
                                isSelf
                                  ? `
                                    bg-[#142B4D]
                                    dark:bg-[#142B4D]
                                    text-white
                                    rounded-tr-none
                                    shadow-[0_2px_6px_rgba(20,43,77,0.15)]
                                  `
                                  : isAdminCabang
                                    ? `
                                      bg-blue-500
                                      dark:bg-blue-500
                                      text-white
                                      rounded-tr-none
                                      shadow-[0_2px_6px_rgba(59,130,246,0.12)]
                                    `
                                    : isComplaint
                                      ? `
                                        bg-rose-50
                                        dark:bg-rose-950/40
                                        border border-rose-200/70
                                        dark:border-rose-900/60
                                        text-gray-800
                                        dark:text-gray-100
                                        rounded-tl-none
                                      `
                                      : `
                                        bg-white
                                        dark:bg-gray-800
                                        border border-gray-200/70
                                        dark:border-gray-700/70
                                        text-gray-800
                                        dark:text-gray-100
                                        rounded-tl-none
                                      `
                              }
                            `}
                          >
                            {/* Sender Info */}
                            <div
                              className={`
                                flex items-center gap-1
                                text-[9px]
                                md:text-[10px]
                                font-bold
                                border-b
                                mb-1

                                ${
                                  isSelf || isAdminCabang
                                    ? "border-white/10 text-blue-200"
                                    : isComplaint
                                      ? "border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400"
                                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                                }
                              `}
                            >
                              <span className="truncate max-w-[180px] md:max-w-[250px]">
                                {isSelf
                                  ? "Anda"
                                  : msg.profiles?.full_name || "User"}
                              </span>

                              <span className="opacity-60 lowercase font-medium">
                                (
                                {msg.profiles?.role === "admin_cabang"
                                  ? "Cabang"
                                  : "Assessor"}
                                )
                              </span>
                            </div>

                            {/* Optional Tag */}
                            {tag && (
                              <span
                                className={`
                                  text-[9px]
                                  md:text-[10px]
                                  font-bold
                                  px-1.5
                                  py-0.5
                                  md:px-2
                                  md:py-0.5
                                  rounded-md
                                  inline-block
                                  mb-1

                                  ${
                                    isSelf || isAdminCabang
                                      ? "bg-white/10 text-blue-100"
                                      : "bg-black/5 dark:bg-white/10"
                                  }
                                `}
                              >
                                {tag}
                              </span>
                            )}

                            {/* Message */}
                            <p className="text-[10px] md:text-sm mt-1 whitespace-pre-line break-words leading-relaxed">
                              {text}
                            </p>

                            {/* Time */}
                            <div
                              className={`
                                text-[8px]
                                md:text-[9px]
                                mt-0.5
                                md:mt-1
                                text-right

                                ${
                                  isSelf || isAdminCabang
                                    ? "text-white/45"
                                    : "text-gray-400 dark:text-gray-500"
                                }
                              `}
                            >
                              {new Date(msg.created_at).toLocaleString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  className="
                    px-3 py-2.5
                    md:px-4 md:py-3
                    border-t border-gray-200
                    dark:border-gray-800
                    bg-white
                    dark:bg-gray-900
                    flex gap-2
                    md:gap-2.5
                  "
                >
                  <input
                    type="text"
                    placeholder="Ketik balasan pesan..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="
                      flex-1
                      bg-gray-100
                      dark:bg-gray-800
                      border border-transparent
                      rounded-lg
                      px-3.5
                      py-2
                      md:px-4
                      md:py-2.5
                      text-xs
                      md:text-sm
                      text-gray-800
                      dark:text-gray-100
                      placeholder:text-gray-400
                      dark:placeholder:text-gray-500
                      focus:ring-2
                      focus:ring-[#142B4D]/20
                      dark:focus:ring-blue-500/30
                      focus:border-[#142B4D]/20
                      outline-none
                      transition-all
                    "
                  />

                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isSending}
                    className="
                      w-10
                      h-10
                      md:w-11
                      md:h-11
                      rounded-lg
                      bg-[#142B4D]
                      hover:bg-[#1a3863]
                      active:scale-95
                      text-white
                      flex
                      items-center
                      justify-center
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                      transition-all
                      shrink-0
                      shadow-sm
                    "
                  >
                    <Send className="w-3.5 h-3.5 md:w-4 md:h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
