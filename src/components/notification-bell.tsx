"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getUnreadCount, markAllAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getUnreadCount().then(setCount).catch(() => setCount(0));
  }, []);

  function handleMarkAll() {
    startTransition(async () => {
      await markAllAsRead();
      setCount(0);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        render={<Link href="/notifications" />}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>
      {count > 0 && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleMarkAll}
          disabled={isPending}
          title="Mark all as read"
        >
          <span className="text-[10px]">Clear</span>
        </Button>
      )}
    </div>
  );
}
