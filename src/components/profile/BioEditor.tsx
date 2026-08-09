"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { fetcher } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { showToast } from "@/components/ui/ToastContainer";

const MAX_BIO_LENGTH = 300;

interface BioEditorProps {
  profileId: string;
  initialBio: string | null;
  canEdit: boolean;
}

export default function BioEditor({
  profileId,
  initialBio,
  canEdit,
}: BioEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(initialBio ?? "");
  const [saving, setSaving] = useState(false);

  if (!canEdit && !initialBio) return null;

  const save = async () => {
    setSaving(true);
    try {
      await fetcher(`/api/users/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bio.trim() }),
      });
      setOpen(false);
      showToast("Bio updated ✨");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save bio", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-5 flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
          {initialBio ?? (
            <span className="italic text-stone-400">
              No bio yet — tell the community about yourself.
            </span>
          )}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setBio(initialBio ?? "");
              setOpen(true);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-zinc-900 active:scale-[0.97]"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit bio
          </button>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit bio"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              disabled={!bio.trim()}
              onClick={save}
            >
              Save bio
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Textarea
            name="bio"
            rows={5}
            maxLength={MAX_BIO_LENGTH}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What kind of reader are you? Which genres do you love? Where do you like to swap books?"
          />
          <p className="text-right text-xs text-stone-400">
            {bio.length}/{MAX_BIO_LENGTH}
          </p>
        </div>
      </Modal>
    </>
  );
}
