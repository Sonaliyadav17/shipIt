import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Globe, Users, Bell, CreditCard, Plug, Eye, EyeOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const navItems = [
  { label: "Profile", icon: User },
  { label: "Workspace", icon: Globe },
  { label: "Team Members", icon: Users },
  { label: "Notifications", icon: Bell },
  { label: "Billing", icon: CreditCard },
  { label: "Integrations", icon: Plug },
];

const teamMembers = [
  { name: "Arjun Patel", email: "arjun@shipit.io", role: "Admin", status: "Active" },
  { name: "Sneha Gupta", email: "sneha@shipit.io", role: "Member", status: "Active" },
  { name: "Riya Sharma", email: "riya@shipit.io", role: "Member", status: "Active" },
  { name: "Karan Singh", email: "karan@shipit.io", role: "Member", status: "Invited" },
];

const integrations = [
  { name: "GitHub", desc: "Sync repos and PRs", connected: true },
  { name: "Slack", desc: "Get notifications in channels", connected: false },
  { name: "Google Calendar", desc: "Sync deadlines and events", connected: false },
];

const Settings = () => {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Profile");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(false);
  const [appearance, setAppearance] = useState("dark");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", profile?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/settings/${profile?.uid}`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
    enabled: !!profile?.uid,
  });

  useEffect(() => {
    if (profile) {
      setNameInput(profile.name || "");
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setEmailNotif(settings.notifications?.emailNotif ?? true);
      setPushNotif(settings.notifications?.pushNotif ?? true);
      setInAppAlerts(settings.notifications?.inAppAlerts ?? false);
      setAppearance(settings.appearance || "dark");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch(`${API_BASE}/api/settings/${profile?.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", profile?.uid] });
      refreshProfile(); // sync auth context globally
    },
    onError: () => {
      toast.error("Failed to save settings");
    }
  });

  const handleSaveProfile = () => {
    updateSettingsMutation.mutate({ name: nameInput }, {
      onSuccess: () => toast.success("Profile updated successfully")
    });
  };

  const handleToggleNotification = (key: string, value: boolean) => {
    const updatedNotifications = {
      emailNotif: key === "emailNotif" ? value : emailNotif,
      pushNotif: key === "pushNotif" ? value : pushNotif,
      inAppAlerts: key === "inAppAlerts" ? value : inAppAlerts,
    };

    // immediate local update for snappy UI
    if (key === "emailNotif") setEmailNotif(value);
    if (key === "pushNotif") setPushNotif(value);
    if (key === "inAppAlerts") setInAppAlerts(value);

    updateSettingsMutation.mutate({ notifications: updatedNotifications }, {
      onSuccess: () => toast.success("Notification preferences saved")
    });
  };

  const handleAppearanceChange = (theme: string) => {
    setAppearance(theme);
    updateSettingsMutation.mutate({ appearance: theme }, {
      onSuccess: () => {
        toast.success(`Theme switched to ${theme}`);
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  };

  if (!profile || isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <p className="text-xs font-mono tracking-[0.2em] text-primary text-center mb-2">SETTINGS</p>

      <div className="flex gap-10 mt-6">
        {/* Sub-nav */}
        <div className="w-48 shrink-0 space-y-1">
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors ${activeTab === item.label
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "Profile" && (
            <div className="space-y-8">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-heading font-bold text-foreground">Profile Settings</h2>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-3 w-3 text-primary-foreground" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono tracking-[0.15em] text-muted-foreground mb-1.5 uppercase">Full Name</label>
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-[0.15em] text-muted-foreground mb-1.5 uppercase">Email Address</label>
                  <input defaultValue={profile.email} readOnly className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary opacity-50 cursor-not-allowed" />
                </div>
              </div>
              <div className="max-w-[calc(50%-0.5rem)]">
                <label className="block text-[10px] font-mono tracking-[0.15em] text-muted-foreground mb-1.5 uppercase">Role</label>
                <input defaultValue={profile.role || "User"} readOnly className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary opacity-50 cursor-not-allowed uppercase" />
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-semibold text-foreground mb-2">Appearance</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAppearanceChange('light')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${appearance === 'light' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-secondary'}`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => handleAppearanceChange('dark')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${appearance === 'dark' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-secondary'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={updateSettingsMutation.isPending}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null} Save Changes
              </button>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Change Password */}
              <div>
                <h3 className="text-lg font-heading font-bold text-foreground mb-4">Change Password</h3>
                <div className="space-y-3 max-w-md">
                  <div className="relative">
                    <input type={showCurrentPw ? "text" : "password"} placeholder="Current password" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary pr-10" />
                    <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showNewPw ? "text" : "password"} placeholder="New password" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary pr-10" />
                    <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showConfirmPw ? "text" : "password"} placeholder="Confirm new password" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary pr-10" />
                    <button onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button className="px-5 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">Update Password</button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Notifications inline */}
              <div>
                <h3 className="text-lg font-heading font-bold text-foreground mb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive summary reports via email</p>
                    </div>
                    <Switch checked={emailNotif} onCheckedChange={(val) => handleToggleNotification("emailNotif", val)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Directly to your mobile device</p>
                    </div>
                    <Switch checked={pushNotif} onCheckedChange={(val) => handleToggleNotification("pushNotif", val)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">In-App Alerts</p>
                      <p className="text-xs text-muted-foreground">Activity feed and desktop badges</p>
                    </div>
                    <Switch checked={inAppAlerts} onCheckedChange={(val) => handleToggleNotification("inAppAlerts", val)} />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Danger Zone */}
              <div>
                <h3 className="text-lg font-heading font-bold text-destructive mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back.</p>
                <button className="px-5 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">Delete Account</button>
              </div>
            </div>
          )}

          {activeTab === "Workspace" && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading font-bold text-foreground">Workspace Settings</h2>
              <div className="grid gap-4 max-w-md">
                <div>
                  <label className="block text-[10px] font-mono tracking-[0.15em] text-muted-foreground mb-1.5 uppercase">Workspace Name</label>
                  <input defaultValue="ShipIt HQ" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-[0.15em] text-muted-foreground mb-1.5 uppercase">Workspace URL</label>
                  <input defaultValue="shipit-hq" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <button className="w-fit px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading font-bold text-foreground">Notification Preferences</h2>
              <div className="space-y-4 max-w-lg">
                {[
                  { title: "Task assigned to you", desc: "When someone assigns a task to you" },
                  { title: "Mentioned in a comment", desc: "When you're @mentioned in comments" },
                  { title: "Deadline reminder", desc: "24 hours before a task is due" },
                  { title: "Weekly digest email", desc: "Summary of your weekly activity" },
                  { title: "Project status changes", desc: "When a project status is updated" },
                ].map(item => (
                  <div key={item.title} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Team Members" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-foreground">Team Members</h2>
                <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Invite Member</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Name</th>
                      <th className="pb-3 font-medium text-muted-foreground">Email</th>
                      <th className="pb-3 font-medium text-muted-foreground">Role</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(m => (
                      <tr key={m.email} className="border-b border-border/50 hover:bg-card">
                        <td className="py-3 text-foreground">{m.name}</td>
                        <td className="py-3 text-muted-foreground font-mono text-xs">{m.email}</td>
                        <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded ${m.role === "Admin" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{m.role}</span></td>
                        <td className="py-3"><span className={`text-xs ${m.status === "Active" ? "text-accent" : "text-muted-foreground"}`}>{m.status}</span></td>
                        <td className="py-3 text-right"><button className="text-xs text-destructive hover:underline">Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Billing" && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading font-bold text-foreground">Billing & Plans</h2>
              <div className="p-5 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Current Plan</p>
                    <p className="text-2xl font-heading font-bold text-primary">Pro</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">Change Plan</button>
                </div>
                <p className="text-xs text-muted-foreground">Your next billing date is March 15, 2026. You'll be charged $12/month.</p>
              </div>
              <div className="p-5 rounded-lg bg-card border border-border">
                <p className="text-sm font-medium text-foreground mb-2">Payment Method</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">•••• •••• •••• 4242</p>
                  <button className="text-xs text-primary hover:underline">Update</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Integrations" && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading font-bold text-foreground">Integrations</h2>
              <div className="grid gap-4 max-w-lg">
                {integrations.map(i => (
                  <div key={i.name} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-foreground">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{i.desc}</div>
                    </div>
                    <button className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${i.connected ? "bg-destructive/15 text-destructive hover:bg-destructive/25" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                      {i.connected ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
