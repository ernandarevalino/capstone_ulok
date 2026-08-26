'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getFeedbackSubmissions, createComment, uploadChatAttachment } from '@/actions/cabang'
import { useCabangProfile } from '@/context/CabangProfileContext'
import { MessagesSquare, Search, Filter, Send, RefreshCw, ChevronLeft, ChevronRight, RotateCcw, Paperclip, FileText, X, Reply, ExternalLink } from 'lucide-react'
import { createClient, getRealtimeClient } from '@/utils/supabase/client'

export default function FeedbackPage() {
  const router = useRouter()
  const profile = useCabangProfile()
  const currentUser = profile
  const [, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])

  // New states for Tab-Based Chat UI & Reply / File Attachments
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeUlok, setActiveUlok] = useState<any>(null)
  const [chatInput, setChatInput] = useState('')
  const [readTimestamps, setReadTimestamps] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null)

  const scrollToMessage = (msgId: string) => {
    if (!msgId) return
    const el = document.getElementById(`message-${msgId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedMsgId(msgId)
      setTimeout(() => {
        setHighlightedMsgId(null)
      }, 2000)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          setSelectedFile(file)
          break
        }
      }
    }
  }

  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedKepemilikan, setSelectedKepemilikan] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const filterRef = React.useRef<HTMLDivElement>(null)

  const activeFilterCount = [
    selectedStatus,
    selectedKepemilikan,
    startDate,
    endDate,
  ].filter(Boolean).length

  const handleResetFilters = () => {
    setSelectedStatus("")
    setSelectedKepemilikan("")
    setStartDate("")
    setEndDate("")
    setSearchQuery("")
  }

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

  // Click outside to close filter dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [filterRef])

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

  const fetchSubmissions = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
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
    if (!silent) setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchSubmissions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // === 1. SYNC ACTIVE CHAT (activeUlok) ===
  // Safely update the active chat window whenever submissions change in the background
  useEffect(() => {
    if (activeUlok) {
      const updatedUlok = submissions.find((s: any) => s.id === activeUlok.id)
      if (updatedUlok) {
        // Deep compare to prevent infinite loops, works regardless of relation name
        if (JSON.stringify(updatedUlok) !== JSON.stringify(activeUlok)) {
          setActiveUlok(updatedUlok)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions]) // Intentionally omitting activeUlok to prevent loops

  // === 2. REALTIME WEBSOCKET ===
  useEffect(() => {
    let channel: any = null
    let activeClient: any = null
    let cancelled = false

    const initRealtime = async () => {
      const supabase = await getRealtimeClient()
      if (cancelled) return
      activeClient = supabase

      // Unique channel to prevent cross-tab conflicts
      const channelName = `realtime-comments-${Date.now()}`

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'comments' },
          (payload: any) => {
            console.log('✅ Realtime Payload Received:', payload)
            // Trigger silent refresh
            if (typeof fetchSubmissions === 'function') {
              fetchSubmissions(true)
            }
          }
        )

      if (cancelled) {
        activeClient.removeChannel(channel)
        return
      }

      channel.subscribe((status: any) => {
        console.log('📡 Supabase Realtime Status:', status)
      })
    }

    initRealtime()

    return () => {
      cancelled = true
      if (channel && activeClient) {
        activeClient.removeChannel(channel)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array ensures we only subscribe once on mount

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
      const matchSearch =
        !searchQuery ||
        sub.nama_lokasi?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        !selectedStatus ||
        sub.status?.toLowerCase() === selectedStatus.toLowerCase();
      const matchKepemilikan =
        !selectedKepemilikan || sub.jenis_badan_hukum === selectedKepemilikan;

      let matchDate = true;
      if (startDate || endDate) {
        const subDate = new Date(sub.created_at);
        subDate.setHours(0, 0, 0, 0);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (subDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (subDate > end) matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchKepemilikan && matchDate;
    });
  }, [
    processedSubmissions,
    searchQuery,
    selectedStatus,
    selectedKepemilikan,
    startDate,
    endDate,
  ]);

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

  // Send logic — re-fetches all submissions and updates activeUlok + sorts tabs
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!chatInput.trim() && !selectedFile) || !activeUlok || !currentUser) return

    setIsSending(true)
    try {
      let attachmentUrl: string | null = null
      let attachmentType: string | null = null

      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const uploadRes = await uploadChatAttachment(formData)
        if (!uploadRes.success || !uploadRes.url) {
          alert('Gagal mengunggah lampiran: ' + uploadRes.error)
          setIsSending(false)
          return
        }
        attachmentUrl = uploadRes.url
        attachmentType = uploadRes.attachmentType
      }

      const msgText = chatInput.trim() || (selectedFile ? `[Lampiran: ${selectedFile.name}]` : '')
      const res = await createComment(
        activeUlok.id,
        currentUser.id,
        msgText,
        replyingTo?.id || null,
        attachmentUrl,
        attachmentType
      )

      if (res.success) {
        setChatInput('')
        setReplyingTo(null)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''

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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in review': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
      case 'revisi': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
      case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
      case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
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
              Feedback Admin Cabang
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
              Daftar feedback, catatan revisi, dan pesan dari Assessor untuk usulan lokasi cabang Anda.
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-1">
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
            <div className="flex flex-row items-center gap-2 mb-3 relative z-50">
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
              <div className="relative shrink-0" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`relative w-11 h-11 sm:w-auto sm:h-10 sm:px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-95 ${
                    activeFilterCount > 0
                      ? 'border-[#142B4D] text-[#142B4D] dark:border-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  title="Filter Feedback"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 md:relative md:top-0 md:right-0"></span>
                  )}
                </button>

                {isFilterOpen && (
                  <div className="absolute -right-13 mt-2 w-74 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-5 z-50 space-y-4 animate-[fadeIn_0.15s_ease-out]">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#142B4D] dark:text-blue-400" /> Filter Feedback
                      </h4>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={handleResetFilters}
                          className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                        Status Assessor
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                      >
                        <option value="">Semua Status</option>
                        <option value="In Review">Sedang Review</option>
                        <option value="Revisi">Butuh Revisi</option>
                        <option value="Approved">Disetujui</option>
                      </select>
                    </div>

                    {/* Kepemilikan Filter */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                        Jenis Badan Hukum
                      </label>
                      <select
                        value={selectedKepemilikan}
                        onChange={(e) => setSelectedKepemilikan(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                      >
                        <option value="">Semua Kepemilikan</option>
                        <optgroup label="Perorangan">
                          <option value="Perorangan">Perorangan</option>
                          <option value="Waris">Waris</option>
                          <option value="Hibah">Hibah</option>
                          <option value="Kuasa">Kuasa</option>
                        </optgroup>
                        <optgroup label="Badan Hukum">
                          <option value="PT">PT</option>
                          <option value="Yayasan">Yayasan</option>
                          <option value="Koperasi">Koperasi</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                        Rentang Tanggal Dibuat
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-gray-400 block mb-0.5">Dari</span>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-gray-200 dark:border-gray-800 p-2 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block mb-0.5">Sampai</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-gray-200 dark:border-gray-800 p-2 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full py-2 bg-[#142B4D] hover:bg-[#1a3863] text-white font-bold text-xs rounded-xl shadow transition-all active:scale-[0.98]"
                      >
                        Terapkan Filter
                      </button>
                    </div>
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
                className="flex overflow-x-auto gap-3 pt-3 px-2 pb-4 snap-x scrollbar-hide scroll-smooth -mx-2"
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
                          <span className="absolute -top-1 -left-1 z-20 h-5 min-w-[20px] px-1.5 bg-red-500 text-white border-2 border-white dark:border-gray-900 rounded-full text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
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

                          {/* NEW: Colored Status Badge */}
                          <div className="flex items-center gap-1.5 mt-0.5 w-full">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                              Status:
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${getStatusColor(sub.status)}`}
                            >
                              {sub.status}
                            </span>
                          </div>
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
                <div className="bg-[#142B4D] dark:bg-slate-900 h-16 px-4 py-3 md:px-5 md:py-3.5 flex flex-wrap items-center justify-between gap-3 transition-colors rounded-t-xl">
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
                          }?id=${activeUlok.id}&from=feedback`,
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
                    flex-1 overflow-y-auto overflow-x-hidden
                    px-2 py-3
                    md:px-5 md:py-4
                    space-y-2 md:space-y-2.5
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

                      const repliedParent = msg.reply_to_id
                        ? activeUlok.allCommentsSorted?.find((c: any) => c.id === msg.reply_to_id)
                        : null

                      const avatarUrl = msg.profiles?.avatar_url
                      const fullName = msg.profiles?.full_name || (isSelf ? 'Anda' : 'User')

                      return (
                        <div
                          id={`message-${msg.id}`}
                          key={msg.id}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            setReplyingTo(msg)
                          }}
                          className={`flex items-start gap-2.5 w-full group relative ${
                            isSelf ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {/* User Avatar */}
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={fullName}
                              className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700 shadow-2xs mt-0.5"
                            />
                          ) : (
                            <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-2xs border border-white/20 mt-0.5 ${
                              isSelf ? 'bg-[#142B4D]' : 'bg-slate-600'
                            }`}>
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`
                              max-w-[82%]
                              sm:max-w-[70%]
                              md:max-w-[65%]
                              px-3 py-2
                              md:px-4 md:py-2.5
                              rounded-lg
                              shadow-sm
                              transition-all duration-300
                              leading-relaxed

                              ${
                                highlightedMsgId === msg.id
                                  ? 'ring-2 ring-amber-400 bg-amber-500/20 dark:bg-amber-400/20 scale-[1.01]'
                                  : ''
                              }

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

                            {/* Replied Snippet Box */}
                            {repliedParent && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (msg.reply_to_id) {
                                    scrollToMessage(msg.reply_to_id)
                                  }
                                }}
                                className={`mb-1.5 px-2.5 py-1.5 rounded border-l-2 text-[10px] md:text-xs cursor-pointer hover:opacity-90 transition-all ${
                                  isSelf || isAdminCabang
                                    ? 'bg-black/20 border-white/40 text-blue-100 hover:bg-black/30'
                                    : 'bg-black/5 dark:bg-white/10 border-[#142B4D] dark:border-blue-400 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20'
                                }`}
                                title="Klik untuk melihat pesan yang dibalas"
                              >
                                <div className="font-bold flex items-center gap-1 opacity-90">
                                  <Reply className="w-3 h-3 shrink-0" />
                                  <span>
                                    Membalas {repliedParent.profiles?.full_name || 'Pengguna'}
                                  </span>
                                </div>
                                <p className="truncate italic opacity-80 mt-0.5">
                                  {repliedParent.message || 'Pesan sebelumnya...'}
                                </p>
                              </div>
                            )}

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

                            {/* Message Text */}
                            <p className="text-[10px] md:text-sm mt-1 whitespace-pre-line break-words leading-relaxed">
                              {text}
                            </p>

                            {/* Attachment Rendering */}
                            {msg.attachment_url && (
                              <div className="mt-2">
                                {msg.attachment_type === 'image' || ['jpg', 'jpeg', 'png', 'webp'].some(ext => msg.attachment_url?.toLowerCase().includes(ext)) ? (
                                  <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10 max-w-xs mt-1">
                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" title="Klik untuk membuka gambar ukuran penuh">
                                      <img
                                        src={msg.attachment_url}
                                        alt="Lampiran Gambar"
                                        className="max-h-48 w-full object-cover hover:scale-105 transition-transform duration-200"
                                      />
                                    </a>
                                  </div>
                                ) : (
                                  <a
                                    href={msg.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition text-xs font-semibold max-w-xs mt-1 ${
                                      isSelf || isAdminCabang
                                        ? 'bg-black/20 border-white/20 text-white hover:bg-black/30'
                                        : 'bg-black/5 dark:bg-white/10 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-black/10 dark:hover:bg-white/20'
                                    }`}
                                  >
                                    <FileText className="w-4 h-4 shrink-0 text-red-400" />
                                    <span className="truncate flex-1">Dokumen Lampiran (PDF)</span>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                  </a>
                                )}
                              </div>
                            )}

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

                          {/* Hover Reply Trigger (Inline next to bubble inside container) */}
                          <button
                            type="button"
                            onClick={() => setReplyingTo(msg)}
                            className="
                              opacity-0 group-hover:opacity-100 transition-opacity duration-150
                              shrink-0 p-1.5 rounded-md text-[10px] font-bold shadow-xs
                              flex items-center gap-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
                              border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700
                              cursor-pointer
                            "
                            title="Balas pesan ini"
                          >
                            <Reply className="w-3 h-3 text-blue-500" />
                            <span className="hidden sm:inline">Balas</span>
                          </button>
                        </div>
                      )
                    })
                  )}

                </div>

                {/* Reply / File Preview Bar above Input */}
                {(replyingTo || selectedFile) && (
                  <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between text-xs transition-all">
                    {replyingTo && (
                      <div className="flex items-center gap-1.5 min-w-0 text-blue-600 dark:text-blue-400 font-medium">
                        <Reply className="w-3.5 h-3.5 shrink-0" />
                        <span className="shrink-0">Membalas <strong className="font-semibold">{replyingTo.profiles?.full_name || 'Pengguna'}</strong>:</span>
                        <span className="truncate max-w-[200px] md:max-w-md italic opacity-80">"{replyingTo.message}"</span>
                        <button type="button" onClick={() => setReplyingTo(null)} className="ml-1 text-gray-400 hover:text-red-500 transition" title="Batal membalas">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {selectedFile && (
                      <div className="flex items-center gap-1.5 min-w-0 text-amber-600 dark:text-amber-400 font-medium">
                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[200px] md:max-w-md">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="ml-1 text-gray-400 hover:text-red-500 transition" title="Batal lampiran">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

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
                    items-center
                  "
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="
                      p-2.5
                      rounded-lg
                      bg-gray-100
                      dark:bg-gray-800
                      hover:bg-gray-200
                      dark:hover:bg-gray-700
                      text-gray-600
                      dark:text-gray-300
                      transition
                      shrink-0
                    "
                    title="Unggah PDF / Gambar (.pdf, .jpg, .png)"
                  >
                    <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0])
                      }
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />

                  <input
                    type="text"
                    placeholder={replyingTo ? `Balas pesan ${replyingTo.profiles?.full_name || ''}...` : "Ketik balasan pesan..."}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onPaste={handlePaste}
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
                    disabled={(!chatInput.trim() && !selectedFile) || isSending}
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
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-3.5 h-3.5 md:w-4 md:h-4 ml-0.5" />
                    )}
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
