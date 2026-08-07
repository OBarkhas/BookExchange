import PageHeader from "@/components/ui/PageHeader";
import NotificationsList from "@/components/notifications/NotificationsList";

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
