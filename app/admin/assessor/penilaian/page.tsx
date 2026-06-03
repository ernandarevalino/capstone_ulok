"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getAssessorSubmissions } from "@/actions/assessor";

export default function PenilaianPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [viewedIds, setViewedIds] = useState<string[]>([]);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  const itemsPerPage = 12;

  useEffect(() => {
    fetchData();
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("priolo_assessor_viewed_ulok");
      if (saved) {
        try {
          setViewedIds(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    setLoading(true);
    const res = await getAssessorSubmissions();
    console.log("LOG ASSESSOR RES:", res);
    if (res.success && res.data) {
      setSubmissions(res.data);
    } else {
      console.error(res.error);
    }
    setLoading(false);
  }

  const toggleGroup = (groupTitle: string) => {
    if (expandedGroup === groupTitle) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupTitle);
    }
    setCurrentPage(1);
  };

  const handleSortCycle = (column: string) => {
    if (sortColumn !== column) {
      setSortColumn(column);
      setSortDirection("asc");
    } else {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else setSortDirection("asc");
    }
  };

  const renderSortButton = (column: string) => {
    const isActive = sortColumn === column;
    const isAsc = isActive && sortDirection === "asc";
    const isDesc = isActive && sortDirection === "desc";

    return (
      <button
        onClick={() => handleSortCycle(column)}
        className={`ml-1.5 inline-flex items-center justify-center p-0.5 rounded hover:bg-gray-200/80 dark:hover:bg-gray-700/50 transition-all ${
          isActive ? "opacity-100 bg-blue-100/50 dark:bg-blue-950/50" : "opacity-40 hover:opacity-85"
        }`}
        title={`Sort by ${column} (${isActive ? (isAsc ? "Ascending" : "Descending") : "None"})`}
      >
        <img
          src="/icons/icon-filter-2.svg"
          alt="Sort"
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isDesc ? "rotate-180 text-blue-950 dark:text-blue-400" : "text-gray-500"}`}
        />
      </button>
    );
  };

  const getFormRoute = (jenisBadanHukum: string) => {
    const kelompokPerorangan = ["Perorangan", "Waris", "Hibah", "Kuasa"];
    if (kelompokPerorangan.includes(jenisBadanHukum)) {
      return "/admin/assessor/penilaian/ulok-perorangan";
    }
    return "/admin/assessor/penilaian/ulok-badanhukum";
  };

  const handleViewPenilaian = (id: string, jenisBadanHukum: string) => {
    startTransition(() => {
      if (!viewedIds.includes(id)) {
        const updatedViewed = [...viewedIds, id];
        setViewedIds(updatedViewed);
        if (typeof window !== "undefined") {
          localStorage.setItem("priolo_assessor_viewed_ulok", JSON.stringify(updatedViewed));
        }
      }
      router.push(`${getFormRoute(jenisBadanHukum)}?id=${id}`);
    });
  };

  const filteredData = submissions.filter((item) => {
    const namaCabang = item.profiles?.branches?.nama_cabang || "";
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (item.nama_lokasi || "").toLowerCase().includes(q) ||
      (item.nama_pemegang_hak || "").toLowerCase().includes(q) ||
      namaCabang.toLowerCase().includes(q)
    );
  });

  const renderTableGroup = (
    title: string,
    allowedStatuses: string[],
    colorStyles: string,
    viewCheck: "all" | "new_only" | "viewed_only" = "all"
  ) => {
    const dataSorted = [...filteredData].filter((item) => {
      if (!allowedStatuses.includes(item.status)) return false;
      if (viewCheck === "new_only") return !viewedIds.includes(item.id);
      if (viewCheck === "viewed_only") return viewedIds.includes(item.id);
      return true;
    });

    if (sortColumn && sortDirection) {
      dataSorted.sort((a, b) => {
        if (sortColumn === "nama_lokasi") {
          const va = (a.nama_lokasi || "").toString();
          const vb = (b.nama_lokasi || "").toString();
          return sortDirection === "asc"
            ? va.localeCompare(vb, "id", { sensitivity: "base" })
            : vb.localeCompare(va, "id", { sensitivity: "base" });
        }
        if (sortColumn === "tanggal") {
          const ta = new Date(a.created_at).getTime();
          const tb = new Date(b.created_at).getTime();
          return sortDirection === "asc" ? ta - tb : tb - ta;
        }
        if (sortColumn === "kepemilikan") {
          const va = (a.nama_pemegang_hak || "").toString();
          const vb = (b.nama_pemegang_hak || "").toString();
          return sortDirection === "asc"
            ? va.localeCompare(vb, "id", { sensitivity: "base" })
            : vb.localeCompare(va, "id", { sensitivity: "base" });
        }
        return 0;
      });
    } else {
      dataSorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const isExpanded = expandedGroup === title;

    const totalItems = dataSorted.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const activePage = Math.min(currentPage, totalPages);

    let displayedData = [] as any[];
    if (isExpanded) {
      displayedData = dataSorted.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);
    } else {
      displayedData = dataSorted.slice(0, 3);
    }

    return (
      <div className="mb-6" key={title}>
        <div
          onClick={() => toggleGroup(title)}
          className="flex items-center gap-2 mb-2 cursor-pointer select-none group transition-all duration-200"
        >
          <div
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-lg transition-all duration-200 flex items-center justify-center"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <img src="/icons/icon-expand.svg" alt="Expand/Collapse" className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base flex items-center group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors duration-200">
            {title}
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-bold ml-2">
              {dataSorted.length}
            </span>
          </h3>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold text-xs border-b border-gray-100 dark:border-gray-800">
                <th className="p-4 w-1/4">
                  <div className="flex items-center">
                    Nama ULOK
                    {renderSortButton("nama_lokasi")}
                  </div>
                </th>
                <th className="p-4">Asal Cabang</th>
                <th className="p-4">
                  <div className="flex items-center">
                    Tanggal Diajukan
                    {renderSortButton("tanggal")}
                  </div>
                </th>
                <th className="p-4">Kepemilikan</th>
                <th className="p-4 text-center">Skor SAW</th>
                <th className="p-4 text-center">Status Berkas</th>
                <th className="p-4 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400 italic">
                    Memuat berkas masuk...
                  </td>
                </tr>
              ) : displayedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    Tidak ada usulan lokasi pada kelompok ini.
                  </td>
                </tr>
              ) : (
                displayedData.map((item: any) => {
                  const branchName = item.profiles?.branches?.nama_cabang || "Cabang Pusat / Lainnya";
                  return (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="p-4 flex items-center gap-3" title={item.nama_lokasi}>
                        <span className="text-sm select-none">📁</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200 text-[13px] max-w-[180px] truncate block whitespace-nowrap">
                          {item.nama_lokasi}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold px-2.5 py-1 rounded-md text-[11px] border">
                          {branchName}
                        </span>
                      </td>

                      <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </td>

                      <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                        <span className="font-semibold text-gray-900 dark:text-gray-200">{item.jenis_badan_hukum}</span>
                        <div className="text-[11px] text-gray-400 mt-0.5">a.n {item.nama_pemegang_hak}</div>
                      </td>

                      <td className="p-4 text-center font-mono font-bold text-sm text-purple-700">
                        {item.final_score !== null && item.final_score !== undefined ? item.final_score.toFixed(2) : "0.00"}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase inline-block ${colorStyles}`}>
                          {item.status === "In Review" && !viewedIds.includes(item.id) ? "BARU MASUK" : item.status}
                        </span>
                      </td>

                      <td className="p-4 text-center w-20">
                        <button
                          onClick={() => handleViewPenilaian(item.id, item.jenis_badan_hukum)}
                          disabled={isPending}
                          title={isPending ? "Memproses..." : viewedIds.includes(item.id) ? "Lanjut Review 📝" : "Mulai Nilai 🔍"}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-95 inline-flex items-center justify-center text-gray-700 dark:text-gray-300 disabled:opacity-40"
                        >
                          {isPending ? (
                            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : viewedIds.includes(item.id) ? (
                            <img src="/icons/icon-form.svg" alt="Lanjut Review" className="w-5 h-5 dark:brightness-0 dark:invert" />
                          ) : (
                            <img src="/icons/icon-view.svg" alt="Mulai Nilai" className="w-5 h-5 dark:brightness-0 dark:invert" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* === PAGINATION === */}
          {isExpanded && totalItems > itemsPerPage && (
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
              <button
                disabled={activePage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
              >
                Prev
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">Halaman {activePage} dari {totalPages}</span>
              <button
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-255 mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-12">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Validasi & Penilaian Usulan Lokasi</h1>
          <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">Sistem Pendukung Keputusan pemilihan lokasi ekspansi gerai baru PRIOLO.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:shrink-0">
          <div className="relative flex items-center w-full lg:w-auto">
            <img src="/icons/icon_sharp-search.svg" alt="Search" className="absolute left-3 w-4 h-4 pointer-events-none dark:brightness-0 dark:invert" />
            <input
              type="text"
              placeholder="Cari Usulan / Pemilik / Cabang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-950 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-950/10 w-full sm:w-60 sm:focus:w-72 transition-all duration-300 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {renderTableGroup("ULOK Baru (Belum Disentuh)", ["In Review"], "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60", "new_only")}
        {renderTableGroup("Sedang Direview (On Progress)", ["In Review"], "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60", "viewed_only")}
        {renderTableGroup("Perlu Revisi (Dikembalikan ke Cabang)", ["Revision"], "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60", "all")}
        {renderTableGroup("Selesai Dinilai (Approved / Rejected)", ["Approved", "Rejected"], "bg-green-50 text-green-700 border border-green-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60", "all")}
      </div>
    </div>
  );
}