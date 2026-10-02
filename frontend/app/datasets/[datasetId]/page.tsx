"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DatasetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params?.datasetId as string;

  useEffect(() => {
    if (datasetId) {
      localStorage.setItem("active_dataset_id", datasetId);
      router.replace(`/datasets/${datasetId}/recommendations`);
    }
  }, [datasetId, router]);

  return <div className="text-center py-20 text-gray-400">Opening dataset dashboard...</div>;
}
