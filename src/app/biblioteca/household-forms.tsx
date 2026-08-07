"use client";

import { useActionState } from "react";
import {
  addOwner,
  createHousehold,
  type HouseholdActionState,
} from "./household-actions";

const initialHouseholdState: HouseholdActionState = {
  message: "",
  status: "idle",
};

export function CreateHouseholdForm() {
  const [state, action, pending] = useActionState(
    createHousehold,
    initialHouseholdState,
  );

  return (
    <form className="setup-form" action={action}>
      <div className="field">
        <label htmlFor="householdName">Nome da biblioteca</label>
        <input
          defaultValue="Biblioteca da Família"
          id="householdName"
          maxLength={100}
          minLength={3}
          name="householdName"
          required
          type="text"
        />
      </div>
      {state.message && (
        <p className={`form-message ${state.status}`} role="status">
          {state.message}
        </p>
      )}
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Preparando…" : "Criar minha biblioteca"}
      </button>
    </form>
  );
}

export function AddOwnerForm() {
  const [state, action, pending] = useActionState(addOwner, initialHouseholdState);

  return (
    <form className="add-owner-form" action={action}>
      <div className="field">
        <label htmlFor="ownerName">Adicionar proprietário</label>
        <div className="inline-field">
          <input
            autoComplete="off"
            id="ownerName"
            maxLength={100}
            minLength={2}
            name="ownerName"
            placeholder="Nome da pessoa"
            required
            type="text"
          />
          <button className="primary-button compact-button" disabled={pending} type="submit">
            {pending ? "Adicionando…" : "Adicionar"}
          </button>
        </div>
      </div>
      {state.message && (
        <p className={`form-message ${state.status}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
