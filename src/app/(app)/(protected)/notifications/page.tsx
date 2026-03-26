import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const items = await getNotifications();

  const unreadCount = items.filter((n) => !n.readAt).length;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">No notifications</h2>
        <p className="text-sm text-muted-foreground">
          You'll see visa deadline reminders here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {unreadCount > 0 && (
          <form
            action={async () => {
              "use server";
              await markAllAsRead();
            }}
          >
            <Button variant="outline" size="sm" type="submit">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      {items.map((notification) => (
        <Card
          key={notification.id}
          className={notification.readAt ? "opacity-60" : ""}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {!notification.readAt && (
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                )}
                {notification.type.replace("_", " ")}
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {notification.createdAt.toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {notification.message}
            </p>
            {!notification.readAt && (
              <form
                action={async () => {
                  "use server";
                  await markAsRead(notification.id);
                }}
              >
                <Button variant="ghost" size="sm" type="submit">
                  Mark read
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
