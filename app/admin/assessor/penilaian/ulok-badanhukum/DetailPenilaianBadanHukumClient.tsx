'use client'

import React, { useEffect, useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getComments, createComment, getUploadedDocuments, getChecklistMaster, getLastUploaderName, uploadChatAttachment } from '@/actions/cabang'
import { updateUlokStatus } from '@/actions/assessor'
import { generateVendorToken } from '@/actions/vendor-token'
import { supabase } from '@/lib/supabaseClient'
import { getRealtimeClient } from '@/utils/supabase/client'
import DocumentChecklistPanel from '@/components/shared/DocumentChecklistPanel'
import { getChecklistMasterIds, getEffectiveChecklistId } from '@/utils/progress'
import UlokSummaryCard from '@/components/shared/UlokSummaryCard'
import { Paperclip, FileText, X, Reply, ExternalLink, QrCode, Share2, Copy, Check as CheckIcon, Send, MessagesSquare } from 'lucide-react'
import AvatarPopover, { AvatarPopoverState } from '@/components/shared/AvatarPopover'
import { QRCodeCanvas } from 'qrcode.react'

const getAssessorOriginInfo = (source: string | null) => {
  switch (source) {
    case 'dashboard':
      return { backPath: '/admin/assessor', label: 'Dashboard' }
    case 'clustering':
      return { backPath: '/admin/assessor/clustering', label: 'Clustering' }
    case 'feedback':
      return { backPath: '/admin/assessor/feedback', label: 'Feedback' }
    case 'pengelompokan':
    default:
      return { backPath: '/admin/assessor/pengelompokan', label: 'Pengelompokan' }
  }
}

interface DetailPenilaianBadanHukumClientProps {
  ulokId: string
  initialPrefill: string
  initialDetail: any
  initialComments: any[]
  initialProfile: any
  initialUserId: string | null
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'In Review':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60'
    case 'Revisi':
      return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60'
    case 'Approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
    case 'Rejected':
      return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800'
  }
}

const formatLastReviewedDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'Belum pernah direview'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Belum pernah direview'
    const pad = (num: number) => String(num).padStart(2, '0')
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const year = String(date.getFullYear()).slice(-2)
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    const seconds = pad(date.getSeconds())
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
  } catch (e) {
    return 'Belum pernah direview'
  }
}

// Separate component for rendering comments, memoized to prevent re-renders when typing in the input field
const CommentItem = React.memo(({ 
  item, 
  currentUserId, 
  currentProfile,
  allComments,
  highlightedMsgId,
  onReply,
  onScrollToMessage,
  onAvatarClick
}: { 
  item: any; 
  currentUserId: string | null; 
  currentProfile: any;
  allComments?: any[];
  highlightedMsgId?: string | null;
  onReply?: (msg: any) => void;
  onScrollToMessage?: (msgId: string) => void;
  onAvatarClick?: (e: React.MouseEvent, profile: any) => void;
}) => {
  const isSelf = useMemo(() => {
    return (
      (currentUserId && (item.profile_id === currentUserId || item.profiles?.id === currentUserId)) || 
      (currentProfile?.id && (item.profile_id === currentProfile.id || item.profiles?.id === currentProfile.id)) ||
      (currentProfile?.full_name && item.profiles?.full_name === currentProfile.full_name) ||
      (item.profiles?.role?.toUpperCase() === 'ASSESSOR')
    )
  }, [item, currentUserId, currentProfile])

  const avatarUrl = item.profiles?.avatar_url
  const fullName = item.profiles?.full_name || (isSelf ? 'Anda' : 'User')

  const isComplaint = useMemo(() => {
    return item.message?.includes('[Catatan Assessor - Grup:')
  }, [item.message])

  const repliedParent = useMemo(() => {
    if (!item.reply_to_id || !allComments) return null
    return allComments.find((c: any) => c.id === item.reply_to_id)
  }, [item.reply_to_id, allComments])

  return (
    <div
      id={`message-${item.id}`}
      onContextMenu={(e) => {
        e.preventDefault()
        if (onReply) onReply(item)
      }}
      className={`flex items-start gap-2.5 w-full group relative ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* User Avatar */}
      <button
        type="button"
        onClick={(e) => onAvatarClick && onAvatarClick(e, item.profiles)}
        className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#142B4D] rounded-full"
        title={`Lihat profil ${fullName}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-2xs mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-2xs border border-white/20 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity ${
            isSelf ? 'bg-[#142B4D]' : 'bg-slate-600'
          }`}>
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* Message Bubble */}
      <div 
        className={`px-3 py-2 md:px-4 md:py-2.5 rounded-lg border shadow-xs max-w-xl transition-all duration-300 leading-relaxed relative ${
          highlightedMsgId === item.id 
            ? 'ring-2 ring-amber-400 bg-amber-500/20 dark:bg-amber-400/20 scale-[1.01]' 
            : ''
        } ${
          isSelf 
            ? 'bg-[#142B4D] dark:bg-[#142B4D] border-transparent text-white rounded-tr-none shadow-[0_2px_6px_rgba(20,43,77,0.15)]' 
            : isComplaint 
              ? 'bg-rose-50 border-rose-200/70 dark:bg-rose-950/40 dark:border-rose-900/60 text-gray-800 dark:text-gray-100 rounded-tl-none' 
              : 'bg-white border-gray-200/70 dark:bg-gray-800 dark:border-gray-700/70 text-gray-800 dark:text-gray-100 rounded-tl-none'
        }`}
      >
        <div className={`flex items-center justify-between gap-6 mb-2 text-[10px] uppercase font-bold border-b pb-1.5 ${
          isSelf 
            ? 'border-white/10 text-blue-200' 
            : isComplaint 
              ? 'border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400' 
              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
        }`}>
          <span className="flex items-center gap-1">
            {!isSelf && isComplaint && <span>⚠️ REVISI PENTING</span>}
            <span>{isSelf ? 'Anda (Assessor)' : `${item.profiles?.full_name || 'Admin Cabang'} (${item.profiles?.role || 'User'})`}</span>
          </span>
          <span className={isSelf ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}>
            {new Date(item.created_at).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {repliedParent && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              if (item.reply_to_id && onScrollToMessage) {
                onScrollToMessage(item.reply_to_id)
              }
            }}
            className={`mb-2 px-2.5 py-1.5 rounded border-l-2 text-[10px] md:text-xs cursor-pointer hover:opacity-90 transition-all ${
              isSelf
                ? 'bg-black/20 border-white/40 text-blue-100 hover:bg-black/30'
                : 'bg-black/5 dark:bg-white/10 border-[#142B4D] dark:border-blue-400 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20'
            }`}
            title="Klik untuk melihat pesan yang dibalas"
          >
            <div className="font-bold flex items-center gap-1 opacity-90">
              <Reply className="w-3 h-3 shrink-0" />
              <span>Membalas {repliedParent.profiles?.full_name || 'Pengguna'}</span>
            </div>
            <p className="truncate italic opacity-80 mt-0.5">
              {repliedParent.message || 'Pesan sebelumnya...'}
            </p>
          </div>
        )}

        <div className="flex items-start gap-1.5">
          {!isSelf && isComplaint && <span className="text-sm shrink-0 mt-0.5 select-none">⚠️</span>}
          <p className="text-xs md:text-sm font-semibold whitespace-pre-line break-words">
            {item.message}
          </p>
        </div>

        {item.attachment_url && (
          <div className="mt-2">
            {item.attachment_type === 'image' || ['jpg', 'jpeg', 'png', 'webp'].some(ext => item.attachment_url?.toLowerCase().includes(ext)) ? (
              <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10 max-w-xs mt-1">
                <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" title="Klik untuk membuka gambar ukuran penuh">
                  <img
                    src={item.attachment_url}
                    alt="Lampiran Gambar"
                    className="max-h-48 w-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </a>
              </div>
            ) : (
              <a
                href={item.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 p-2 rounded-lg border transition text-xs font-semibold max-w-xs mt-1 ${
                  isSelf
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
      </div>

      {onReply && (
        <button
          type="button"
          onClick={() => onReply(item)}
          className="
            opacity-0 group-hover:opacity-100 transition-opacity duration-150
            shrink-0 p-1.5 rounded-md text-[10px] font-bold shadow-2xs
            flex items-center gap-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
            border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700
            cursor-pointer self-center
          "
          title="Balas pesan ini"
        >
          <Reply className="w-3 h-3 text-blue-500" />
          <span className="hidden sm:inline">Balas</span>
        </button>
      )}
    </div>
  )
})
CommentItem.displayName = 'CommentItem'

export function DetailPenilaianBadanHukumClient({
  ulokId,
  initialPrefill,
  initialDetail,
  initialComments,
  initialProfile,
  initialUserId
}: DetailPenilaianBadanHukumClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromSource = searchParams.get('from')
  const { backPath, label: originLabel } = getAssessorOriginInfo(fromSource)
  const [isPending, startTransition] = useTransition()

  const [namaLokasi] = useState(initialDetail?.nama_lokasi || '')
  const [statusBadan] = useState(initialDetail?.jenis_badan_hukum || '')
  const [namaPemegang] = useState(initialDetail?.nama_pemegang_hak || '')
  const [statusSubmission, setStatusSubmission] = useState(initialDetail?.status || 'Draft')
  
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [lastReviewedAt, setLastReviewedAt] = useState<string | null>(initialDetail?.last_reviewed_at || null)

  const [comments, setComments] = useState<any[]>(initialComments)
  const [newComment, setNewComment] = useState(initialPrefill)
  const [isSending, setIsSending] = useState(false)
  const [currentProfile] = useState<any>(initialProfile)
  const [currentUserId] = useState<string | null>(initialUserId)
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null)
  const [avatarPopover, setAvatarPopover] = useState<AvatarPopoverState | null>(null)

  // === VENDOR TOKEN STATE ===
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [vendorToken, setVendorToken] = useState<string | null>(null)
  const [isGeneratingToken, setIsGeneratingToken] = useState(false)
  const [vendorLinkCopied, setVendorLinkCopied] = useState(false)

  const vendorUrl = vendorToken
    ? (typeof window !== 'undefined' ? `${window.location.origin}/vendor/upload/${vendorToken}` : `/vendor/upload/${vendorToken}`)
    : ''

  const handleGenerateVendorToken = useCallback(async () => {
    setIsGeneratingToken(true)
    try {
      const res = await generateVendorToken(ulokId)
      if (res.success && res.token) {
        setVendorToken(res.token)
      } else {
        alert('Gagal generate token: ' + res.error)
      }
    } finally {
      setIsGeneratingToken(false)
    }
  }, [ulokId])

  const handleCopyVendorLink = useCallback(async () => {
    if (!vendorUrl) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(vendorUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = vendorUrl
        textarea.style.position = 'fixed'
        textarea.style.left = '-999999px'
        textarea.style.top = '-999999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
      }
      setVendorLinkCopied(true)
      setTimeout(() => setVendorLinkCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }, [vendorUrl])

  const handleAvatarClick = useCallback((e: React.MouseEvent, profile: any) => {
    e.stopPropagation()
    setAvatarPopover({ x: e.clientX, y: e.clientY, profile })
  }, [])

  const scrollToMessage = useCallback((msgId: string) => {
    if (!msgId) return
    const el = document.getElementById(`message-${msgId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedMsgId(msgId)
      setTimeout(() => {
        setHighlightedMsgId(null)
      }, 2000)
    }
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
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
  }, [])

  const [checklistItems, setChecklistItems] = useState<any[]>([])
  const [checklistLoading, setChecklistLoading] = useState(true)
  const [percentage, setPercentage] = useState(0)
  const [numerator, setNumerator] = useState(0)
  const [denominator, setDenominator] = useState(0)
  const [lastUploaderName, setLastUploaderName] = useState<string | null>(null)

  useEffect(() => {
    if (!ulokId) return

    const fetchChecklistData = async () => {
      setChecklistLoading(true)
      try {
        const [docsRes, masterRes, uploaderRes] = await Promise.all([
          getUploadedDocuments(ulokId),
          getChecklistMaster(statusBadan || 'PT'),
          getLastUploaderName(ulokId)
        ])

        if (docsRes.success && masterRes.success) {
          const docs = docsRes.data || []
          const master = masterRes.data || []
          
          const submissionMock = {
            jenis_badan_hukum: statusBadan || 'PT',
          }
          
          const checklistMasterIds = getChecklistMasterIds(submissionMock, docs)
          const denom = checklistMasterIds.length

          const uniqueUploadedIds = new Set<number>()
          for (const doc of docs) {
            const effectiveId = getEffectiveChecklistId(doc, submissionMock.jenis_badan_hukum)
            if (effectiveId !== null && checklistMasterIds.includes(effectiveId)) {
              uniqueUploadedIds.add(effectiveId)
            }
          }

          const num = uniqueUploadedIds.size
          const pct = denom > 0 ? parseFloat(((num / denom) * 100).toFixed(2)) : 0

          const filteredChecklist = (master || [])
            .filter((cm: any) => cm.jenis_badan_hukum === submissionMock.jenis_badan_hukum && checklistMasterIds.includes(cm.id))
            .sort((a: any, b: any) => a.id - b.id)

          const items = filteredChecklist.map((cm: any) => {
            const doc = docs.find((d: any) => {
              if (d.checklist_id === cm.id) return true
              const effectiveId = getEffectiveChecklistId(d, submissionMock.jenis_badan_hukum)
              return effectiveId === cm.id
            })
            return {
              nama_dokumen: cm.nama_dokumen,
              is_uploaded: !!(doc && doc.file_url),
              file_url: doc?.file_url || undefined,
              is_negotiable: !!cm.is_negotiable,
              is_verified: doc ? !!doc.is_verified : false
            }
          })

          setNumerator(num)
          setDenominator(denom)
          setPercentage(pct)
          setChecklistItems(items)
        }

        if (uploaderRes.success) {
          setLastUploaderName(uploaderRes.data)
        }
      } catch (err) {
        console.error('Error fetching checklist data:', err)
      } finally {
        setChecklistLoading(false)
      }
    }

    fetchChecklistData()
  }, [ulokId, statusBadan])

  // Real-time comments subscription
  useEffect(() => {
    let channel: any = null
    let activeClient: any = null
    let cancelled = false

    const initRealtime = async () => {
      const client = await getRealtimeClient()
      if (cancelled) return
      activeClient = client

      channel = client
        .channel(`comments-ulok-bh-assessor-${ulokId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments',
            filter: `ulok_id=eq.${ulokId}`,
          },
          async () => {
            const commentsRes = await getComments(ulokId)
            if (commentsRes.success && commentsRes.data) {
              setComments(commentsRes.data)
            }
          }
        )

      if (cancelled) {
        activeClient.removeChannel(channel)
        return
      }

      channel.subscribe()
    }

    initRealtime()

    return () => {
      cancelled = true
      if (channel && activeClient) {
        activeClient.removeChannel(channel)
      }
    }
  }, [ulokId])

  const handleSendComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const activeId = currentUserId || currentProfile?.id
    if (!ulokId || (!newComment.trim() && !selectedFile) || !activeId) return

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

      const commentText = newComment.trim() || (selectedFile ? `[Lampiran: ${selectedFile.name}]` : '')
      const res = await createComment(
        ulokId, 
        activeId, 
        commentText, 
        replyingTo?.id || null, 
        attachmentUrl, 
        attachmentType
      )

      if (res.success) {
        setNewComment('')
        setReplyingTo(null)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''

        const commentsRes = await getComments(ulokId)
        if (commentsRes.success && commentsRes.data) {
          setComments(commentsRes.data)
        }
        router.refresh()
      } else {
        alert('Gagal mengirim feedback catatan: ' + res.error)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSending(false)
    }
  }, [ulokId, newComment, selectedFile, replyingTo, currentUserId, currentProfile, router])

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!ulokId) return
    setStatusSubmission(newStatus)

    startTransition(async () => {
      const res = await updateUlokStatus(ulokId, newStatus)
      if (res.success) {
        setSuccessMessage('Status usulan lokasi berhasil diperbarui!')
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
          router.push('/admin/assessor/pengelompokan')
        }, 1500)
      } else {
        alert('Gagal mengubah status berkas: ' + res.error)
      }
    })
  }, [ulokId, router])

  const memoizedCommentsList = useMemo(() => {
    if (comments.length === 0) {
      return (
        <div className="text-center my-auto py-12 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          <span className="text-3xl mb-2 opacity-50">✉️</span>
          <p className="font-bold">Belum ada komentar atau pesan dari assessor.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Seluruh feedback peninjauan berkas akan tampil di sini.</p>
        </div>
      )
    }
    return (
      <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto overflow-x-hidden pr-2 flex flex-col">
        {comments.map((item) => (
          <CommentItem 
            key={item.id} 
            item={item} 
            currentUserId={currentUserId} 
            currentProfile={currentProfile}
            allComments={comments}
            highlightedMsgId={highlightedMsgId}
            onReply={(msg) => setReplyingTo(msg)}
            onScrollToMessage={scrollToMessage}
            onAvatarClick={handleAvatarClick}
          />
        ))}
      </div>
    )
  }, [comments, currentUserId, currentProfile, highlightedMsgId, scrollToMessage, handleAvatarClick])

  return (
    <div className="w-full overflow-x-hidden space-y-4 md:space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      <div className="space-y-6">
        
        {/* === BREADCRUMB === */}
        <nav className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 select-none mb-10 uppercase tracking-wider">
          <span 
            onClick={() => router.push(backPath)} 
            className="cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition"
          >
            {originLabel}
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-200 font-extrabold">Detail Usulan Badan Hukum</span>
        </nav>

        {/* === HEADER & NAVIGASI BALIK === */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push(backPath)}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 transition bg-white dark:bg-gray-900 p-2.5 rounded-full shadow-xs border border-gray-200 dark:border-gray-800 active:scale-90 flex items-center justify-center"
              title="Kembali"
            >
              <img 
                src="/icons/icon-back.svg" 
                alt="Kembali" 
                className="w-6 h-6 object-contain dark:brightness-0 dark:invert" 
              />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Data Usulan Lokasi (ULOK)</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-0.5">ID Berkas: {ulokId}</p>
            </div>
          </div>
          
          {/* === ACTION: GO TO PENILAIAN + VENDOR SHARE === */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              onClick={() => setShowVendorModal(true)}
              className="flex-1 sm:flex-none bg-[#F28705] hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
              title="Bagikan akses upload ke vendor"
            >
              <Share2 className="w-4 h-4" />
              QR Share
            </button>
            <button
              onClick={() => router.push(`/admin/assessor/penilaian/ulok-badanhukum/detail-penilaian/section1?id=${ulokId}${fromSource ? `&from=${fromSource}` : ''}`)}
              className="flex-1 sm:flex-none bg-[#142B4D] dark:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-blue-900 dark:hover:bg-slate-700 transition shadow-xs flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <img 
                src="/icons/icon-form.svg" 
                alt="Penilaian" 
                className="w-4 h-4 object-contain brightness-0 invert" 
              />
              Lihat Berkas
            </button>
          </div>
        </div>

        <UlokSummaryCard
          namaLokasi={namaLokasi}
          namaCabang={initialDetail?.profiles?.branches?.nama_cabang || 'Cabang Tidak Diketahui'}
          namaPengusul={initialDetail?.profiles?.full_name || 'Pengusul Tidak Diketahui'}
          jenisKepemilikan={statusBadan || 'PT'}
          status={statusSubmission}
          totalDokumen={checklistItems.length}
          dokumenTerunggah={checklistItems.filter((item) => item.is_uploaded).length}
          dokumenSesuai={checklistItems.filter((item) => item.is_verified).length}
          dokumenBelumSesuai={checklistItems.filter((item) => item.is_uploaded && !item.is_verified).length}
        />

        {/* === FORM: DATA UTAMA === */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800/80 overflow-hidden transition-colors duration-300">
          <div className="bg-[#142B4D] dark:bg-slate-900 px-4 py-3.5 md:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors rounded-t-xl">
            <h2 className="font-bold text-white text-sm md:text-base tracking-tight">
              Informasi Usulan Kelompok Badan Hukum
            </h2>
            
            {/* === FORM: DROPDOWN STATUS === */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Status:</span>
              <select
                value={statusSubmission}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isPending}
                className={`px-4 py-2 rounded-lg text-xs font-bold border transition shadow-xs outline-none cursor-pointer ${getStatusStyle(statusSubmission)} disabled:opacity-60`}
              >
                {(statusSubmission === 'Draft' || statusSubmission === 'In Review') && (
                  <option value={statusSubmission} disabled>{statusSubmission === 'Draft' ? 'Draft (Belum Direview)' : 'In Review'}</option>
                )}
                <option value="Revisi">Revisi</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Nama Lokasi</label>
                <input 
                  type="text"
                  value={namaLokasi}
                  readOnly
                  disabled
                  className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-gray-50/50 dark:bg-gray-950/40 text-gray-400 dark:text-gray-500 font-semibold cursor-not-allowed outline-none select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Nama Pemegang Hak</label>
                <input 
                  type="text"
                  value={namaPemegang}
                  readOnly
                  disabled
                  className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-gray-50/50 dark:bg-gray-950/40 text-gray-400 dark:text-gray-500 font-semibold cursor-not-allowed outline-none select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">NOMOR ULOK</label>
                <input 
                  type="text"
                  value={initialDetail?.id_ulok || '-'}
                  readOnly
                  disabled
                  className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-gray-50/50 dark:bg-gray-950/40 text-gray-400 dark:text-gray-500 font-semibold cursor-not-allowed outline-none select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status Kepemilikan (Khusus Badan Hukum)</label>
                <input 
                  type="text"
                  value={statusBadan === 'PT' ? 'PT (Perseroan Terbatas)' : statusBadan}
                  readOnly
                  disabled
                  className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-gray-50/50 dark:bg-gray-950/40 text-gray-400 dark:text-gray-500 font-semibold cursor-not-allowed outline-none select-none"
                />
              </div>

              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 font-bold">
                  {lastReviewedAt ? `Terakhir direview pada (${formatLastReviewedDate(lastReviewedAt)})` : 'Belum pernah direview'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* === PANEL: KOMENTAR & FEEDBACK === */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800/80 overflow-hidden transition-colors duration-300">
          <div className="bg-[#142B4D] dark:bg-slate-900 px-4 py-3.5 md:px-5 flex items-center justify-between transition-colors rounded-t-xl">
            <h2 className="font-bold text-white text-sm md:text-base tracking-tight">Kolom Komentar / Pesan Assessor</h2>
          </div>
          
          <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-950 bg-[radial-gradient(circle_at_1px_1px,_rgba(20,43,77,0.06)_1px,_transparent_0)] [background-size:8px_8px] dark:bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.035)_1px,_transparent_0)] min-h-[300px] flex flex-col justify-between transition-colors">
            {/* === LIST PESAN === */}
            {memoizedCommentsList}

            {/* Reply / File Preview Bar */}
            {(replyingTo || selectedFile) && (
              <div className="mt-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800/90 rounded-lg flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between text-xs transition-all">
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

            <form onSubmit={handleSendComment} className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-2 md:gap-2.5 items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition shrink-0"
                title="Unggah PDF / Gambar (.pdf, .jpg, .png)"
              >
                <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-300" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0])
                }}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />

              <input 
                type="text" 
                placeholder={replyingTo ? `Balas catatan ${replyingTo.profiles?.full_name || ''}...` : "Tulis catatan revisi atau feedback untuk Admin Cabang..."} 
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2 md:px-4 md:py-2.5 text-xs md:text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#142B4D]/20 dark:focus:ring-blue-500/30 focus:border-[#142B4D]/20 outline-none transition-all font-medium"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onPaste={handlePaste}
                disabled={isSending}
              />
              <button 
                type="submit"
                className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#142B4D] hover:bg-[#1a3863] text-white flex items-center justify-center disabled:opacity-40 transition-all shrink-0 shadow-sm active:scale-95"
                disabled={isSending || (!newComment.trim() && !selectedFile)}
                title="Kirim Catatan"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-3.5 h-3.5 md:w-4 md:h-4 ml-0.5" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* === PANEL CHECKLIST DOKUMEN === */}
        {checklistLoading ? (
          <div className="py-8 text-center text-gray-400 italic flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-800 dark:border-slate-800 dark:border-t-slate-200"></div>
            <span className="text-xs">Memuat status checklist dokumen...</span>
          </div>
        ) : (
          <DocumentChecklistPanel
            percentage={percentage}
            numerator={numerator}
            denominator={denominator}
            jenisBadanHukum={statusBadan || 'PT'}
            checklistItems={checklistItems}
            lastUploaderName={lastUploaderName}
          />
        )}

      </div>

      {/* === MODAL: SUKSES === */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* === MODAL: VENDOR ACCESS QR === */}
      {showVendorModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowVendorModal(false); setVendorToken(null) } }}
        >
          <div className="w-full max-w-sm space-y-2 animate-[scaleUp_0.2s_ease-out]">
            {/* === HEADER MODAL === */}
            <div className="bg-[#142B4D] text-white p-4 font-bold flex items-center justify-between rounded-xl shadow-md">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-white shrink-0" />
                <span className="text-sm">QR Share</span>
              </div>
            </div>

            {/* === BODY MODAL === */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden p-6 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Generate link akses untuk vendor.
              </p>

              {!vendorToken ? (
                <div className="py-6 text-center text-gray-400 dark:text-gray-500 space-y-2">
                  <QrCode className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 animate-pulse" />
                  <p className="text-xs">Klik tombol <strong className="text-[#142B4D] dark:text-blue-400">Generate</strong> di bawah untuk membuat QR Code & link akses vendor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                      <QRCodeCanvas
                        value={vendorUrl}
                        size={180}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  {/* URL Display + Copy */}
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Link Akses Vendor</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-700 dark:text-gray-200 font-mono break-all flex-1 leading-relaxed">{vendorUrl}</p>
                      <button
                        onClick={handleCopyVendorLink}
                        className="shrink-0 p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 transition"
                        title="Salin link"
                      >
                        {vendorLinkCopied
                          ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                          : <Copy className="w-3.5 h-3.5 text-gray-500" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Expiry Note */}
                  <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      Link ini akan <strong>kadaluarsa dalam 1 jam</strong> jika tidak dibuka. Sesi akan diperpanjang otomatis selama halaman vendor tetap terbuka.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* === FOOTER: AKSI === */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 flex items-center gap-1 p-1">
              <button
                type="button"
                onClick={() => { setShowVendorModal(false); setVendorToken(null) }}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGenerateVendorToken}
                disabled={isGeneratingToken}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-[#142B4D] hover:bg-[#1a3863] transition-all duration-200 active:scale-95 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isGeneratingToken ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Membuat...</span>
                  </>
                ) : (
                  <span>{vendorToken ? 'Generate Ulang' : 'Generate'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Profile Popover */}
      <AvatarPopover popover={avatarPopover} onClose={() => setAvatarPopover(null)} />
    </div>
  )
}
