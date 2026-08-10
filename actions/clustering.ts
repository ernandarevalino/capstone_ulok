"use server";

import { getSAWLeaderboard } from "@/actions/saw";
import { getPengelompokanData } from "@/actions/pengelompokan";

export interface ClusteringResult {
  c1: any[]; // Lengkap & Lama (>=80%, >7 Hari) - Perlu Review Segera
  c2: any[]; // Belum Lengkap & Cepat (<80%, <=7 Hari) - Progress Aktif
  c3: any[]; // Lengkap & Cepat (>=80%, <=7 Hari) - Ideal Fast-Track
  c4: any[]; // Belum Lengkap & Lama (<80%, >7 Hari) - Bottleneck / Stagnan
  leaderboard: any[];
}

export async function getClusteringData(): Promise<{
  success: boolean;
  data?: ClusteringResult;
  error?: string;
}> {
  try {
    // 1. Fetch SAW Leaderboard
    const sawRes = await getSAWLeaderboard();
    const leaderboard = sawRes.success && sawRes.data ? sawRes.data : [];

    // 2. Fetch all ULOK Submissions with their checklist status
    const pengelompokanRes = await getPengelompokanData();
    if (!pengelompokanRes.success || !pengelompokanRes.data) {
      throw new Error(
        pengelompokanRes.error || "Failed to fetch base submission data"
      );
    }

    // Combine all active submissions
    const allData = [
      ...pengelompokanRes.data.baruMasuk,
      ...pengelompokanRes.data.antreanAktif,
      ...pengelompokanRes.data.patutDilihat,
      ...pengelompokanRes.data.perluRevisi,
      ...pengelompokanRes.data.selesai,
    ];

    const uniqueData = Array.from(
      new Map(allData.map((item) => [item.id, item])).values()
    );

    const c1: any[] = [];
    const c2: any[] = [];
    const c3: any[] = [];
    const c4: any[] = [];

    const now = new Date();

    uniqueData.forEach((item: any) => {
      const persentase = item.persentase || 0;
      const createdAt = new Date(item.created_at);
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Inject durasi hari into the object for UI rendering
      const clusteredItem = { ...item, durasi_hari: diffDays };

      if (persentase >= 80 && diffDays > 7) {
        c1.push(clusteredItem);
      } else if (persentase < 80 && diffDays <= 7) {
        c2.push(clusteredItem);
      } else if (persentase >= 80 && diffDays <= 7) {
        c3.push(clusteredItem);
      } else {
        c4.push(clusteredItem);
      }
    });

    return {
      success: true,
      data: { c1, c2, c3, c4, leaderboard },
    };
  } catch (error: any) {
    console.error("Error fetching clustering data:", error);
    return { success: false, error: error.message };
  }
}
