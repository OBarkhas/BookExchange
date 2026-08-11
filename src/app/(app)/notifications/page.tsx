import dynamic from "next/dynamic";
import PageHeader from "@/components/ui/PageHeader";

const NotificationsList = dynamic(
  () => import("@/components/notifications/NotificationsList"),
  {
    loading: () => (
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-amber-100/50" />
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-2xl bg-amber-100/40"
          />
        ))}
      </div>
    ),
  },
);

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Requests, messages, badges and more."
      />
      <NotificationsList />
    </div>
  );
}
