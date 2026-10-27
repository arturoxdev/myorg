import { AppLogo } from "@/components/app-logo"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-sidebar p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-semibold tracking-tight">
          <AppLogo className="size-7" />
          Tareas
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
