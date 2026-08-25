"use client";

import { useActionState } from "react";
import { deleteOwner, type HouseholdActionState } from "./household-actions";

const initialState: HouseholdActionState = {
  message: "",
  status: "idle",
};

export function OwnerDeleteForm({
  ownerId,
  ownerName,
}: {
  ownerId: string;
  ownerName: string;
}) {
  const [state, action, pending] = useActionState(deleteOwner, initialState);

  return (
    <form
      action={action}
      className="owner-delete-form"
      onSubmit={(event) => {
        if (!window.confirm(`Excluir ${ownerName} permanentemente?`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="ownerId" type="hidden" value={ownerId} />
      <button className="text-button danger-text-button" disabled={pending} type="submit">
        {pending ? "Excluindo…" : "Excluir"}
      </button>
      {state.status === "error" && (
        <small className="owner-action-message" role="alert">{state.message}</small>
      )}
    </form>
  );
}

