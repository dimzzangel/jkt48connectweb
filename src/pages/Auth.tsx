import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const OSHIMEN_OPTIONS = [
  "Freya", "Christy", "Marsha", "Gracia", "Feni", "Shani", "Zee", "Gita", 
  "Jessi", "Fiony", "Flora", "Lulu", "Muthe", "Oniel", "Olla", "Ella"
];

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"username" | "oshimen" | "auth">("username");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [oshimen, setOshimen] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleUsernameNext = () => {
    if (!username.trim()) {
      toast({
        title: "Username diperlukan",
        description: "Silakan masukkan username Anda",
        variant: "destructive",
      });
      return;
    }
    setStep("oshimen");
  };

  const handleOshimenNext = () => {
    if (!oshimen) {
      toast({
        title: "Pilih oshimen",
        description: "Silakan pilih oshimen favorit Anda",
        variant: "destructive",
      });
      return;
    }
    // Save oshimen to localStorage
    localStorage.setItem("oshimen", oshimen);
    setStep("auth");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Lengkapi form",
        description: "Email dan password harus diisi",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails, try to sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Create profile with all required fields
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              user_id: signUpData.user.id,
              username,
              email,
              account_number: Math.random().toString().substring(2, 8),
              account_id: `WN48_${signUpData.user.id.substring(0, 8)}`,
            });

          if (profileError) throw profileError;

          toast({
            title: "Registrasi berhasil!",
            description: "Akun Anda telah dibuat",
          });
          navigate("/");
        }
      } else {
        toast({
          title: "Login berhasil!",
          description: "Selamat datang kembali",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Selamat Datang di JKT48 Connect</CardTitle>
          <CardDescription>
            {step === "username" && "Masukkan username Anda"}
            {step === "oshimen" && "Pilih oshimen favorit Anda"}
            {step === "auth" && "Masukkan email dan password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "username" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username Anda"
                />
              </div>
              <Button onClick={handleUsernameNext} className="w-full">
                Selanjutnya
              </Button>
            </div>
          )}

          {step === "oshimen" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Oshimen</Label>
                <div className="grid grid-cols-2 gap-2">
                  {OSHIMEN_OPTIONS.map((member) => (
                    <Button
                      key={member}
                      variant={oshimen === member ? "default" : "outline"}
                      onClick={() => setOshimen(member)}
                      className="w-full"
                    >
                      {member}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleOshimenNext} className="w-full">
                Selanjutnya
              </Button>
            </div>
          )}

          {step === "auth" && (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Masuk / Daftar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
