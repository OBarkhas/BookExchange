"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { fetcher } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/ToastContainer";

export default function EventForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset());
  const minDateString = minDate.toISOString().slice(0, 16);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (!description.trim()) next.description = "Description is required";
    if (!location.trim()) next.location = "Location is required";
    if (!eventDate) next.eventDate = "Choose a date and time";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await fetcher("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          eventDate: new Date(eventDate).toISOString(),
        }),
      });
      showToast("Swap meet created! 🎪");
      router.push("/events");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create event", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Input
        name="title"
        label="Event title"
        placeholder="e.g. Sunday Book Swap at the Park"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />
      <Textarea
        name="description"
        label="Description"
        rows={4}
        placeholder="What should people bring? Any themes or limits?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          name="location"
          label="Location"
          placeholder="e.g. Sukhbaatar Square, west entrance"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          error={errors.location}
        />
        <div className="space-y-1.5">
          <label
            htmlFor="eventDate"
            className="block text-sm font-medium text-stone-700"
          >
            Date &amp; time
          </label>
          <input
            id="eventDate"
            type="datetime-local"
            min={minDateString}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm text-zinc-900 transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
          {errors.eventDate && (
            <p className="text-xs font-medium text-rose-600">{errors.eventDate}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-amber-100 pt-5">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          <CalendarDays className="h-4 w-4" /> Create swap meet
        </Button>
      </div>
    </form>
  );
}
