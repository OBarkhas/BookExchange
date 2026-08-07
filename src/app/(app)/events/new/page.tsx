import PageHeader from "@/components/ui/PageHeader";
import EventForm from "@/components/events/EventForm";

export const metadata = { title: "Host a Meet — BookLoop" };

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Host a Swap Meet"
        subtitle="Bring book lovers together in your neighborhood."
      />
      <div className="rounded-2xl border border-amber-100 bg-white/80 p-6 shadow-sm shadow-amber-900/5 backdrop-blur-sm sm:p-8">
        <EventForm />
      </div>
    </div>
  );
}
