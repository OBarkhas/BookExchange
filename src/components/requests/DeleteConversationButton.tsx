"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteConversation } from "@/actions/requests";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/ToastContainer";

export default function DeleteConversationButton({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteConversation(requestId);
      setConfirming(false);
      showToast("Conversation deleted");
      router.push("/messages");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not delete conversation",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        aria-label="Delete conversation"
        title="Delete conversation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-500 active:scale-95"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete this conversation?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-stone-600">
          This permanently deletes the chat from your messages, exchanges and
          notifications. The other reader&apos;s copy stays intact, and this
          can&apos;t be undone.
        </p>
      </Modal>
    </>
  );
}
