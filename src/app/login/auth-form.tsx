"use client";

import { useActionState, useState } from "react";
import {
  signIn,
  signUp,
  type AuthActionState,
} from "./actions";

type Mode = "signin" | "signup";

const initialAuthState: AuthActionState = {
  message: "",
  status: "idle",
};

function SubmitButton({ mode, pending }: { mode: Mode; pending: boolean }) {
  const label = mode === "signin" ? "Entrar" : "Criar minha conta";

  return (
    <button className="primary-button" disabled={pending} type="submit">
      {pending ? "Só um instante…" : label}
    </button>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    initialAuthState,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    initialAuthState,
  );
  const state: AuthActionState = mode === "signin" ? signInState : signUpState;

  return (
    <>
      <div className="mode-switch" role="tablist" aria-label="Tipo de acesso">
        <button
          aria-selected={mode === "signin"}
          onClick={() => setMode("signin")}
          role="tab"
          type="button"
        >
          Já tenho conta
        </button>
        <button
          aria-selected={mode === "signup"}
          onClick={() => setMode("signup")}
          role="tab"
          type="button"
        >
          Criar conta
        </button>
      </div>

      <form className="auth-form" action={mode === "signin" ? signInAction : signUpAction}>
        {mode === "signup" && (
          <div className="field">
            <label htmlFor="displayName">Como podemos chamar você?</label>
            <input
              autoComplete="name"
              id="displayName"
              maxLength={100}
              minLength={2}
              name="displayName"
              placeholder="Seu nome"
              required
              type="text"
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            autoCapitalize="none"
            autoComplete="email"
            id="email"
            name="email"
            placeholder="voce@exemplo.com"
            required
            type="email"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            id="password"
            minLength={8}
            name="password"
            placeholder="Mínimo de 8 caracteres"
            required
            type="password"
          />
          {mode === "signup" && (
            <p className="field-hint">Use pelo menos 8 caracteres.</p>
          )}
        </div>

        {state.message && (
          <p className={`form-message ${state.status}`} role="status">
            {state.message}
          </p>
        )}

        <SubmitButton
          mode={mode}
          pending={mode === "signin" ? signInPending : signUpPending}
        />
      </form>
    </>
  );
}

