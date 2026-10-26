"use client"

import * as React from "react"

import type { ActionState } from "@/app/admin/actions"

/**
 * Like useActionState, but submits via onSubmit so React does not reset the
 * form afterwards: on a validation error the admin keeps what they typed.
 */
export function useFormAction(
  fn: (prev: ActionState, form: FormData) => Promise<ActionState>
) {
  const [state, dispatch, pending] = React.useActionState<ActionState, FormData>(fn, {})
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    React.startTransition(() => dispatch(form))
  }
  return { state, pending, onSubmit }
}
