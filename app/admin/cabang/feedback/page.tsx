'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getFeedbackSubmissions, createComment } from '@/actions/cabang'
import { getCurrentProfile } from '@/actions/auth'
import { MessagesSquare, Search, Filter, Send, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

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
  const [readTimestamps, setReadTimestamps] = useState<Record<string, string>>({})

  // Load read timestamps from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ulok_feedback_read_times')
    if (saved) {
      try {
        setReadTimestamps(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const handleSelectTab = (sub: any) => {
    setActiveUlok(sub)

    // Mark this ULOK as read up to the current time
    const now = new Date().toISOString()
    setReadTimestamps((prev) => {
      const updated = { ...prev, [sub.id]: now }
      localStorage.setItem('ulok_feedback_read_times', JSON.stringify(updated))
      return updated
    })
  }

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

  // Step 2: Realtime subscription — bypass Next.js cache by directly injecting new comments
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('realtime-feedback-comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        async (payload) => {
          console.log('Realtime payload received:', payload)

          // Fetch the exact new comment with its profile directly from Supabase (bypassing Next.js cache)
          const { data: newComment } = await supabase
            .from('comments')
            .select('*, profiles(*)')
            .eq('id', payload.new.id)
            .single()

          if (newComment) {
            setSubmissions((prevSubmissions) => {
              // Find the submission this comment belongs to
              const targetSub = prevSubmissions.find((s) => s.id === newComment.ulok_id)
              if (!targetSub) return prevSubmissions // Ignore if submission isn't currently loaded

              // Prevent duplication if the sender already appended it via handleSendMessage
              const isDuplicate = targetSub.comments?.some((c: any) => c.id === newComment.id)
              if (isDuplicate) return prevSubmissions

              // Inject the new comment into the specific submission's comments array
              return prevSubmissions.map((sub) => {
                if (sub.id === newComment.ulok_id) {
                  return {
                    ...sub,
                    comments: [...(sub.comments || []), newComment],
                  }
                }
                return sub
              })
            })
          }
        },
      )
      .subscribe((status) => {
        console.log('Supabase Realtime Status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
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
      const initialSub = filteredTabSubmissions[0]
      setActiveUlok(initialSub)
      if (initialSub && !readTimestamps[initialSub.id]) {
        const now = new Date().toISOString()
        setReadTimestamps((prev) => {
          const updated = { ...prev, [initialSub.id]: now }
          localStorage.setItem('ulok_feedback_read_times', JSON.stringify(updated))
          return updated
        })
      }
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
      const initialSub = filteredTabSubmissions[0]
      setActiveUlok(initialSub)
      if (initialSub && !readTimestamps[initialSub.id]) {
        const now = new Date().toISOString()
        setReadTimestamps((prev) => {
          const updated = { ...prev, [initialSub.id]: now }
          localStorage.setItem('ulok_feedback_read_times', JSON.stringify(updated))
          return updated
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-7 md:h-8 w-56 md:w-72 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3.5 md:h-4 w-full max-w-md bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        ) : (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              Feedback Assessor
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
              Daftar feedback, catatan revisi, dan pesan dari Assessor untuk usulan lokasi cabang Anda.
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {/* ACTION BAR SKELETON */}
            <div className="flex flex-row items-center gap-2 mb-6 animate-pulse">
              {/* Search placeholder */}
              <div className="flex-1 h-11 md:h-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              {/* Filter placeholder */}
              <div className="w-11 h-11 sm:w-20 sm:h-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              {/* Refresh placeholder */}
              <div className="w-11 h-11 sm:w-24 sm:h-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>

            {/* HORIZONTAL TABS SKELETON */}
            <div className="flex overflow-x-auto gap-3 pb-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="min-w-[180px] sm:min-w-[200px] shrink-0 h-[70px] rounded-xl bg-slate-200 dark:bg-slate-800 p-3.5 flex flex-col gap-1.5"
                >
                  <div className="h-3.5 w-2/3 bg-slate-300 dark:bg-slate-700 rounded"></div>
                  <div className="h-2.5 w-1/2 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
                </div>
              ))}
            </div>

            {/* CHAT ROOM SKELETON */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 overflow-hidden flex flex-col h-[800px] animate-pulse">
              {/* Chat Header */}
              <div className="bg-slate-200 dark:bg-slate-800 px-4 py-3 md:px-5 md:py-3.5 border-b border-slate-300 dark:border-slate-700">
                <div className="h-5 w-40 bg-slate-300 dark:bg-slate-700 rounded"></div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 px-4 py-3 md:px-5 md:py-4 space-y-4 bg-gray-50 dark:bg-gray-950">
                {[1, 2, 3, 4].map((i) => {
                  const isRight = i % 2 === 0;
                  return (
                    <div key={i} className={`flex w-full ${isRight ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-xl flex flex-col gap-2 ${
                          isRight
                            ? 'bg-slate-200 dark:bg-slate-800 rounded-tr-none ml-auto'
                            : 'bg-slate-200 dark:bg-slate-800 rounded-tl-none'
                        }`}
                      >
                        <div className="h-2.5 w-16 bg-slate-300 dark:bg-slate-700 rounded"></div>
                        <div className="h-3 w-40 sm:w-60 bg-slate-300 dark:bg-slate-700 rounded"></div>
                        <div className="h-2 w-10 bg-slate-300 dark:bg-slate-700 rounded"></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <div className="px-3 py-2.5 md:px-4 md:py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2 md:gap-2.5">
                <div className="flex-1 h-10 md:h-11 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="w-10 h-10 md:w-11 md:h-11 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              </div>
            </div>
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
                  filteredTabSubmissions.map((sub) => {
                    const lastReadTime = readTimestamps[sub.id] ? new Date(readTimestamps[sub.id]).getTime() : 0;

                    const unreadCount = (sub.comments || []).filter((msg: any) => {
                      const isMyMessage = currentUser?.id === msg.user_id || currentUser?.id === msg.profiles?.id;
                      const msgTime = new Date(msg.created_at).getTime();
                      return !isMyMessage && msgTime > lastReadTime;
                    }).length;

                    return (
                      <div
                        key={sub.id}
                        className="relative shrink-0 w-[calc(50%-0.375rem)] md:w-60 lg:w-[calc(25%-0.75rem)]"
                      >
                        {/* UNREAD COUNTER BADGE (TOP-LEFT) */}
                        {unreadCount > 0 && (
                          <span className="absolute h-5 min-w-[20px] px-1.5 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-md animate-pulse top-20 left-65">
                            {unreadCount > 15 ? '15+' : unreadCount}
                          </span>
                        )}

                        <button
                          onClick={() => handleSelectTab(sub)}
                          className={`w-full h-full p-3.5 rounded-xl border text-left transition-all snap-start shadow-sm flex flex-col gap-1.5 ${
                            activeUlok?.id === sub.id
                              ? "dark:border-blue-500 bg-blue-50/80 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 w-full">
                            <h4 className="font-bold text-sm truncate text-gray-900 dark:text-gray-100">
                              {sub.nama_lokasi}
                            </h4>

                            <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm whitespace-nowrap shrink-0">
                              {sub.allCommentsSorted?.length || 0}
                              <span className="hidden sm:inline"> Pesan</span>
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {sub.lastComment?.profiles?.full_name || "System"}:
                            </span>{" "}
                            {sub.lastComment?.message || ""}
                          </p>

                          <p className="text-[10px] text-gray-500 flex items-center mt-0.5 font-medium">
                            Status:{" "}
                            <span className="font-bold ml-1 text-gray-700 dark:text-gray-300">
                              {sub.status}
                            </span>
                          </p>
                        </button>
                      </div>
                    );
                  })
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
                            isSelf
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
                                      rounded-tl-none
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
                                ${isSelf ? 'text-right' : 'text-left'}

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
