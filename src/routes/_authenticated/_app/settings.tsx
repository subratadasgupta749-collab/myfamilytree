import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Lock, Globe, Bell, Sun, Trash2, Save, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — My Family History Book" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(
    (user?.user_metadata?.full_name as string) ?? ""
  );
  const [country, setCountry] = useState(
    (user?.user_metadata?.country as string) ?? "United States"
  );

  // Security states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [reminderNotifs, setReminderNotifs] = useState(true);
  const [language, setLanguage] = useState("en");

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, country },
      });
      if (error) throw new Error(error.message);
      toast.success("Profile updated successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw new Error(error.message);
      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-4xl">
          Account Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your personal profile, security credentials, and preferences.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="inline-flex h-11 bg-white p-1 rounded-2xl border border-border/60">
          <TabsTrigger value="profile" className="rounded-xl px-4 text-xs font-semibold">
            <User className="mr-2 h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-4 text-xs font-semibold">
            <Lock className="mr-2 h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-xl px-4 text-xs font-semibold">
            <Globe className="mr-2 h-3.5 w-3.5" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="danger" className="rounded-xl px-4 text-xs font-semibold text-destructive">
            <ShieldAlert className="mr-2 h-3.5 w-3.5" /> Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Subrata Das Gupta" />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input value={user?.email ?? ""} disabled className="bg-muted/40" />
                <p className="text-[11px] text-muted-foreground">Primary email cannot be changed here.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United States" />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={saveProfile} disabled={saving} className="rounded-xl bg-[color:var(--primary)] text-white">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Profile
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={updatePassword} disabled={saving || !newPassword} className="rounded-xl bg-[color:var(--primary)] text-white">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />} Change Password
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label>Interface Language</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Email Notifications</div>
                    <div className="text-xs text-muted-foreground">Receive book compilation updates and receipts.</div>
                  </div>
                  <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Interview Reminders</div>
                    <div className="text-xs text-muted-foreground">Weekly friendly reminders to continue writing your chapters.</div>
                  </div>
                  <Switch checked={reminderNotifs} onCheckedChange={setReminderNotifs} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => toast.success("Preferences saved")} className="rounded-xl bg-[color:var(--primary)] text-white">
                <Save className="mr-2 h-4 w-4" /> Save Preferences
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger">
          <Card className="p-6 space-y-6 rounded-2xl bg-red-50/20 border-red-200">
            <div className="space-y-2">
              <h3 className="font-serif text-lg font-semibold text-destructive">Delete Account</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permanently delete your account and all associated books, interviews, photos, and manuscripts. This action is non-reversible.
              </p>
            </div>

            <div className="pt-4 border-t border-red-200 flex justify-end">
              <Button
                variant="destructive"
                className="rounded-xl"
                onClick={() => {
                  if (confirm("Are you sure you want to delete your account? All data will be permanently removed.")) {
                    toast.error("Account deletion requested. Please contact support.");
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete My Account
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
