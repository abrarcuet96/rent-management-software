import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { LogOut, Moon, Monitor, Sun, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useUiStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">প্রোফাইল</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center">
              <User size={24} className="text-success" />
            </div>
            <div>
              <p className="font-medium text-text-primary">{user?.full_name}</p>
              <p className="text-sm text-text-secondary">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">থিম</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="light" id="theme-light" />
              <Label htmlFor="theme-light" className="flex items-center gap-2 cursor-pointer">
                <Sun size={16} />
                লাইট
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="dark" id="theme-dark" />
              <Label htmlFor="theme-dark" className="flex items-center gap-2 cursor-pointer">
                <Moon size={16} />
                ডার্ক
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="system" id="theme-system" />
              <Label htmlFor="theme-system" className="flex items-center gap-2 cursor-pointer">
                <Monitor size={16} />
                সিস্টেম
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-danger">লগআউট</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary mb-4">
            আপনি কি নিশ্চিত যে লগআউট করতে চান?
          </p>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="bg-destructive hover:bg-destructive/90"
          >
            <LogOut size={16} className="mr-1.5" />
            লগআউট করুন
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
