"use client"

import { cn } from "cn"
import { useActionState } from "react"

import { login } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-semibold tracking-tight">Bienvenido de nuevo</CardTitle>
          <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <FieldGroup>
              <Field data-invalid={!!state?.error}>
                <FieldLabel htmlFor="username">Usuario</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  placeholder="admin"
                  autoComplete="username"
                  aria-invalid={!!state?.error}
                  required
                  autoFocus
                />
              </Field>
              <Field data-invalid={!!state?.error}>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!state?.error}
                  required
                />
                <FieldError>{state?.error}</FieldError>
              </Field>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending && <Spinner />}
                  Iniciar sesión
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Acceso privado. Las credenciales se configuran en las variables de entorno.
      </FieldDescription>
    </div>
  )
}
