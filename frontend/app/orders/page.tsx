"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function OrdersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const dsId = localStorage.getItem("active_dataset_id");
    if (dsId) {
      router.replace(`/datasets/${dsId}/recommendations`);
    } else {
      api.getDatasets().then((list) => {
        if (list && list.length > 0) {
          localStorage.setItem("active_dataset_id", list[0].id);
          router.replace(`/datasets/${list[0].id}/recommendations`);
        }
      }).catch(() => {});
    }
  }, [router]);

  return (
    <div className="py-20 max-w-md mx-auto text-center">
      <EmptyState
        icon={<ShoppingCart className="h-10 w-10 text-slate-400" />}
        title="Opening Order Queue"
        description="Redirecting to the active dark store purchase order queue..."
        action={
          <Link href="/datasets">
            <Button variant="primary" size="sm">
              Select Facility Dataset
            </Button>
          </Link>
        }
      />
    </div>
  );
}
