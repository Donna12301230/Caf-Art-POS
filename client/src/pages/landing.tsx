import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, Palette, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Parse from "@/lib/parseClient";

export default function Landing() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const demoMutation = useMutation({
    mutationFn: () => Parse.User.logIn("demo", "demo1234"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseCurrentUser"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Demo 登入失敗", description: err.message });
    },
  });

  const loginMutation = useMutation({
    mutationFn: () => Parse.User.logIn(username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseCurrentUser"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "登入失敗", description: err.message });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const user = new Parse.User();
      user.set("username", username);
      user.set("email", email);
      user.set("password", password);
      return user.signUp();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseCurrentUser"] });
      toast({ title: "註冊成功", description: "歡迎加入 CaféArt POS！" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "註冊失敗", description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate();
    } else {
      if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "密碼不一致", description: "請確認兩次輸入的密碼相同" });
        return;
      }
      registerMutation.mutate();
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending || demoMutation.isPending;

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 coffee-gradient rounded-2xl flex items-center justify-center">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">CaféArt POS</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            結合咖啡文化與藝術創意的全方位銷售點平台
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Coffee className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">咖啡店 POS 系統</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                完整的銷售點系統，包含訂單管理、庫存追蹤與付款處理
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Palette className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-lg">藝術家合作</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                為本地藝術家提供展示和銷售作品的平台，並自動追蹤佣金
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle className="text-lg">多角色權限</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                為管理員、經理和收銀員提供基於角色的權限管理及安全驗證
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-chart-4" />
              </div>
              <CardTitle className="text-lg">分析與報表</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                提供銷售、庫存和藝術家表現的全面報表，以及即時分析
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login / Register Form */}
        <div className="text-center">
          <Card className="max-w-md mx-auto floating-card">
            <CardHeader>
              <CardTitle className="text-2xl">
                {mode === "login" ? "登入系統" : "建立帳號"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* DEMO 快速登入 */}
              {mode === "login" && (
                <div className="mb-5">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-2 border-primary/50 text-primary hover:bg-primary/5 font-semibold py-5 text-base"
                    onClick={() => demoMutation.mutate()}
                    disabled={isPending}
                    data-testid="button-demo-login"
                  >
                    {demoMutation.isPending ? "連線中..." : "⚡ 快速 DEMO 體驗（免輸入帳密）"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-2">使用展示帳號一鍵進入系統</p>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">或使用帳號登入</span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <Label htmlFor="username">帳號</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="請輸入帳號"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>

                {mode === "register" && (
                  <div className="space-y-1 text-left">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="請輸入 Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <Label htmlFor="password">密碼</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="請輸入密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </div>

                {mode === "register" && (
                  <div className="space-y-1 text-left">
                    <Label htmlFor="confirmPassword">確認密碼</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="請再次輸入密碼"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full coffee-gradient text-white hover:opacity-90 transition-opacity"
                  disabled={isPending}
                  data-testid="button-login"
                >
                  {isPending
                    ? (mode === "login" ? "登入中..." : "註冊中...")
                    : (mode === "login" ? "登入" : "註冊")}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>
                    還沒有帳號？{" "}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-primary hover:underline font-medium"
                    >
                      立即註冊
                    </button>
                  </>
                ) : (
                  <>
                    已有帳號？{" "}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-primary hover:underline font-medium"
                    >
                      返回登入
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>CaféArt POS v2.1.0 - 結合咖啡文化與藝術創意</p>
        </div>
      </div>
    </div>
  );
}
