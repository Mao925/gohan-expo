'use client';

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError, SERVER_UNAVAILABLE_MESSAGE } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { ErrorBanner } from "@/components/error-banner";

const schema = z.object({
  name: z.string().min(2, "2文字以上で入力してください"),
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(6, "6文字以上で入力してください"),
});

type FormValues = z.infer<typeof schema>;

type RegisterCardProps = {
  description?: string;
  error?: string | null;
  onLineRegister: () => void;
  onRegistered?: () => void;
};

export function RegisterCard({
  description,
  error,
  onLineRegister,
  onRegistered,
}: RegisterCardProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const handleSubmitForm = async (values: FormValues) => {
    setSubmissionError(null);
    try {
      await registerUser(values);
      onRegistered?.();
    } catch (err) {
      const apiError = err as ApiError | undefined;
      if (apiError?.isServerError) {
        setSubmissionError(SERVER_UNAVAILABLE_MESSAGE);
        return;
      }
      setSubmissionError(apiError?.message ?? "登録に失敗しました");
    }
  };

  const message = error ?? submissionError;

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>新規登録</CardTitle>
        {description ? <CardContent>{description}</CardContent> : null}
      </CardHeader>
      <ErrorBanner message={message} />
      <form onSubmit={handleSubmit(handleSubmitForm)} className="mt-6 space-y-5">
        <Field label="名前" error={errors.name?.message}>
          <Input placeholder="山田 太郎" autoComplete="name" {...register("name")} />
        </Field>
        <Field label="メールアドレス" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
        </Field>
        <Field label="パスワード" error={errors.password?.message}>
          <Input
            type="password"
            placeholder="•••••••"
            autoComplete="new-password"
            {...register("password")}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "送信中..." : "登録する"}
        </Button>
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>または</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Button
          type="button"
          className="w-full bg-[#06c755] text-white hover:bg-[#05b24c]"
          onClick={onLineRegister}
        >
          LINEで新規登録
        </Button>
        <div className="mt-6 space-y-2">
          <p className="text-center text-sm text-slate-600">すでにアカウントをお持ちの方</p>
          <Button
            variant="outline"
            className="w-full border-[var(--brand)] text-[var(--brand)] bg-white hover:bg-[var(--brand)]/10"
            asChild
          >
            <Link href="/login">ログインはこちら</Link>
          </Button>
        </div>
      </form>
    </Card>
  );
}
