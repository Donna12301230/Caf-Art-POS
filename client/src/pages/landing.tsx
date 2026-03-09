import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Parse from "@/lib/parseClient";
import { NCYU_COLLEGES } from "@/constants/ncyuDepartments";
import { ShoppingBag, Clock, Tag, Store } from "lucide-react";

export default function Landing() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: () => Parse.User.logIn(username, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parseCurrentUser"] }),
    onError: (err: Error) => toast({ variant: "destructive", title: "登入失敗", description: err.message }),
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) throw new Error("兩次輸入的密碼不一致");
      const user = new Parse.User();
      user.set("username", username);
      user.set("email", email);
      user.set("password", password);
      user.set("displayName", displayName || username);
      user.set("phone", phone);
      user.set("studentId", studentId);
      user.set("department", department);
      user.set("role", "customer");
      return user.signUp();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseCurrentUser"] });
      toast({ title: "註冊成功", description: "歡迎加入嘉大便當預訂平台！" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "註冊失敗", description: err.message }),
  });

  const isPendingLogin = loginMutation.isPending;
  const isPendingReg = registerMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🍱</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">嘉大便當預訂平台</h1>
          <p className="text-gray-500 text-lg">國立嘉義大學 · 美味便當 · 提早預訂更優惠</p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: ShoppingBag, title: "線上預訂", desc: "輕鬆挑選、輕鬆下單" },
            { icon: Clock, title: "提前預訂", desc: "提前安排、省時省力" },
            { icon: Tag, title: "早鳥優惠", desc: "越早訂購越划算" },
            { icon: Store, title: "多家廠商", desc: "嘉大周邊精選店家" },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="text-center p-4">
              <Icon className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <div className="font-semibold text-sm">{title}</div>
              <div className="text-xs text-muted-foreground mt-1">{desc}</div>
            </Card>
          ))}
        </div>

        {/* Login / Register */}
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-xl">歡迎使用</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="login" className="flex-1">登入</TabsTrigger>
                <TabsTrigger value="register" className="flex-1">會員註冊</TabsTrigger>
              </TabsList>

              {/* Login */}
              <TabsContent value="login">
                <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(); }} className="space-y-3">
                  <div>
                    <Label>帳號</Label>
                    <Input placeholder="請輸入帳號" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div>
                    <Label>密碼</Label>
                    <Input type="password" placeholder="請輸入密碼" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isPendingLogin}>
                    {isPendingLogin ? "登入中..." : "登入"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register">
                <form onSubmit={(e) => { e.preventDefault(); registerMutation.mutate(); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>帳號 *</Label>
                      <Input placeholder="登入用帳號" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div>
                      <Label>顯示名稱</Label>
                      <Input placeholder="顯示給廠商的名字" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" placeholder="電子信箱" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>密碼 *</Label>
                      <Input type="password" placeholder="至少 6 位" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div>
                      <Label>確認密碼 *</Label>
                      <Input type="password" placeholder="再輸入一次" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>手機號碼</Label>
                      <Input placeholder="09xx-xxx-xxx" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div>
                      <Label>學號</Label>
                      <Input placeholder="選填" value={studentId} onChange={e => setStudentId(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>系所</Label>
                    <Select onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇系所（選填）" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">不選擇 / 校外人士</SelectItem>
                        {NCYU_COLLEGES.map(college => (
                          <div key={college.name}>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted">
                              {college.name}
                            </div>
                            {college.departments.map(dept => (
                              <SelectItem key={dept} value={`${college.name} ${dept}`}>
                                {dept}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isPendingReg}>
                    {isPendingReg ? "註冊中..." : "立即註冊"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 嘉大便當預訂平台 · 憶香軒快炒料理 合作夥伴
        </p>
      </div>
    </div>
  );
}
