import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { NCYU_COLLEGES } from "@/constants/ncyuDepartments";
import { User, LogOut } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [studentId, setStudentId] = useState(user?.studentId ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = Parse.User.current();
      if (!current) throw new Error("未登入");
      current.set("displayName", displayName);
      current.set("phone", phone);
      current.set("studentId", studentId);
      current.set("department", department);
      return current.save();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseCurrentUser"] });
      toast({ title: "儲存成功" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "儲存失敗", description: err.message }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => Parse.User.logOut(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parseCurrentUser"] }),
  });

  return (
    <CustomerLayout>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-orange-500" /> 會員中心
      </h2>

      <div className="max-w-lg space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">基本資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>帳號</Label>
              <Input value={user?.username ?? ""} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="bg-muted" />
            </div>
            <div>
              <Label>顯示名稱</Label>
              <Input placeholder="顯示給廠商的名稱" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label>手機號碼</Label>
              <Input placeholder="09xx-xxx-xxx" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">學生資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>學號</Label>
              <Input placeholder="選填" value={studentId} onChange={e => setStudentId(e.target.value)} />
            </div>
            <div>
              <Label>系所</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇系所" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">校外人士 / 不選擇</SelectItem>
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
          </CardContent>
        </Card>

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "儲存中..." : "儲存資料"}
        </Button>

        <Separator />

        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4 mr-2" /> 登出
        </Button>
      </div>
    </CustomerLayout>
  );
}
