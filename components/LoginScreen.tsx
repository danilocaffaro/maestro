"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lock, Sparkles, AlertCircle, KeyRound, Check } from "lucide-react";
import { motion } from "framer-motion";

interface LoginScreenProps {
  onLogin: (token: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState<boolean | null>(null); // null = checking

  useEffect(() => {
    // Check if password is already set
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setIsSetup(!d.passwordSet))
      .catch(() => setIsSetup(false));
  }, []);

  const handleSubmit = async () => {
    if (!password.trim() || password.length < 4) {
      setError("Senha deve ter pelo menos 4 caracteres");
      return;
    }

    if (isSetup && password !== confirmPassword) {
      setError("Senhas nao conferem");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          action: isSetup ? "setup" : "login",
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("maestro-session", data.token);
        onLogin(data.token);
      } else {
        setError(data.error || "Erro ao autenticar");
      }
    } catch {
      setError("Erro de conexao");
    }
    setLoading(false);
  };

  if (isSetup === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="w-full max-w-sm p-6 space-y-6">
          <div className="text-center space-y-2">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <Sparkles className="h-10 w-10 mx-auto text-primary/40" />
            </motion.div>
            <h1 className="text-xl font-semibold">Maestro</h1>
            <p className="text-sm text-muted-foreground">
              {isSetup ? "Crie uma senha para proteger seu acesso" : "Digite sua senha para continuar"}
            </p>
          </div>

          <div className="space-y-3">
            {isSetup && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 p-2.5">
                <KeyRound className="h-4 w-4 text-primary shrink-0" />
                <p className="text-[11px] text-primary">
                  Primeira vez? Defina uma senha para acessar o Maestro remotamente.
                </p>
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder={isSetup ? "Crie uma senha" : "Sua senha"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && !isSetup && handleSubmit()}
                className="pl-9 h-10"
              />
            </div>

            {isSetup && (
              <div className="relative">
                <Check className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirme a senha"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="pl-9 h-10"
                />
              </div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </motion.div>
            )}

            <Button className="w-full h-10" onClick={handleSubmit} disabled={loading || !password.trim()}>
              {loading ? "Verificando..." : isSetup ? "Criar senha" : "Entrar"}
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            {isSetup
              ? "Essa senha sera usada para acessar o Maestro de qualquer dispositivo."
              : "Acesso local (localhost) nao requer senha."}
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
