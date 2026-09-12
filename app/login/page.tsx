import { AuthForm } from "@/components/auth-form";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  return <AuthForm action={login} mode="login" />;
}
