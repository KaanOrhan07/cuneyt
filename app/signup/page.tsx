import { AuthForm } from "@/components/auth-form";
import { signup } from "@/lib/actions/auth";

export default function SignupPage() {
  return <AuthForm action={signup} mode="signup" />;
}
