"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import {
  Plus,
  Calendar,
  Clock,
  Send,
  Bot,
  BarChart3,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  TrendingUp,
  Zap,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Globe,
  MoreVertical,
  ArrowUpRight,
  Loader2,
  CalendarClock,
  Play,
  Pause,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Settings,
  Megaphone,
  Wand2,
  Rocket,
  Shield,
  LogOut,
  FolderOpen,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useSocialHubData } from "@/hooks/use-social-hub";
import type { AutomationRule, ScheduledPost } from "@/types/social";
import {
  PLATFORM_CONFIG,
  STATUS_CONFIG,
  TRIGGER_LABELS,
  ACTION_LABELS,
  TRIGGER_TYPES,
  ACTION_TYPES,
} from "@/lib/platforms";
import { formatNumber, formatDate, formatDateTime, timeAgo, parseJsonArray } from "@/lib/format";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { MarketingGuide } from "@/components/marketing/marketing-guide";
import { MarketingHub } from "@/components/marketing/marketing-hub";
import { AiStudio } from "@/components/marketing/ai-studio";
import { DeployGuide } from "@/components/deploy/deploy-guide";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { CreativeStudio, StudioAssetPicker } from "@/components/studio/creative-studio";
import { ConnectNetworksPanel } from "@/components/accounts/connect-networks-panel";

// ─────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────
export default function SocialDashboard() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const { accounts, posts, rules, analytics, settings, loading, fetchAllData, saveSettings } = useSocialHubData();
  const enabledPlatforms = settings.enabledPlatforms;
  const [activeTab, setActiveTab] = useState("dashboard");
  const [contentFilter, setContentFilter] = useState("all");
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  // New post dialog
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostPlatforms, setNewPostPlatforms] = useState<string[]>([]);
  const [newPostStatus, setNewPostStatus] = useState("draft");
  const [newPostScheduledAt, setNewPostScheduledAt] = useState("");
  const [newPostMediaUrls, setNewPostMediaUrls] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // New account dialog
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [newAccountPlatform, setNewAccountPlatform] = useState("facebook");
  const [newAccountName, setNewAccountName] = useState("");

  // New automation dialog
  const [newAutomationOpen, setNewAutomationOpen] = useState(false);
  const [newAutoName, setNewAutoName] = useState("");
  const [newAutoDesc, setNewAutoDesc] = useState("");
  const [newAutoTrigger, setNewAutoTrigger] = useState("time_based");
  const [newAutoAction, setNewAutoAction] = useState("post");
  const [newAutoPlatforms, setNewAutoPlatforms] = useState<string[]>([]);

  // Handle OAuth return ?tab=accounts&oauth=success
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get("oauth");
    const tab = params.get("tab");
    const platform = params.get("platform");
    if (tab) setActiveTab(tab);
    if (oauth === "success") {
      toast({
        title: `Conectado: ${platform || "red social"}`,
        description: "Ya puedes publicar contenido directo a esta red",
      });
      fetchAllData();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (oauth === "denied" || oauth === "error" || oauth === "invalid") {
      toast({
        title: "OAuth no completado",
        description: `Resultado: ${oauth}${platform ? ` (${platform})` : ""}`,
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create new post — publish to one or many connected networks at once
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast({ title: "Error", description: "El contenido es requerido", variant: "destructive" });
      return;
    }
    if (newPostPlatforms.length === 0) {
      toast({ title: "Error", description: "Selecciona al menos una plataforma", variant: "destructive" });
      return;
    }

    const connectedForTargets = accounts.filter(
      (a) =>
        a.isActive &&
        newPostPlatforms.includes(a.platform) &&
        a.isConnected === true
    );
    if (newPostStatus === "published" && connectedForTargets.length === 0) {
      toast({
        title: "Conecta tus redes primero",
        description: "Ve a Cuentas → Login OAuth, luego publica a una o varias redes.",
        variant: "destructive",
      });
      setActiveTab("accounts");
      return;
    }

    setIsPublishing(true);
    try {
      const account =
        connectedForTargets[0] ||
        accounts.find((a) => a.platform === newPostPlatforms[0]);
      if (!account) {
        toast({
          title: "Error",
          description: "No se encontró cuenta para la plataforma seleccionada",
          variant: "destructive",
        });
        setIsPublishing(false);
        return;
      }

      if (newPostStatus === "published") {
        const res = await fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newPostContent,
            platforms: newPostPlatforms,
            mediaUrls: newPostMediaUrls.length ? newPostMediaUrls : undefined,
            accountIds: connectedForTargets.map((a) => a.id),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "publish failed");

        const allSuccess = Boolean(data.summary?.allSuccess);
        const publishedCount = data.summary?.published ?? 0;

        await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newPostContent,
            platforms: newPostPlatforms,
            status: publishedCount > 0 ? "published" : "failed",
            accountId: account.id,
            mediaUrls: newPostMediaUrls.length ? newPostMediaUrls : undefined,
          }),
        });

        const detail = (data.results || [])
          .map(
            (r: { platform: string; status: string; mode?: string; error?: string }) =>
              `${r.platform}: ${r.status}${r.mode ? ` (${r.mode})` : ""}${r.error ? ` — ${r.error}` : ""}`
          )
          .join(" · ");

        toast({
          title: allSuccess
            ? `¡Publicado en ${publishedCount} red${publishedCount === 1 ? "" : "es"}!`
            : publishedCount > 0
              ? `Parcial (${publishedCount}/${newPostPlatforms.length})`
              : "Publicación fallida",
          description: detail || "Revisa conexiones OAuth",
          variant: publishedCount > 0 ? "default" : "destructive",
        });
      } else {
        await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newPostContent,
            platforms: newPostPlatforms,
            status: newPostStatus,
            scheduledAt: newPostStatus === "scheduled" ? newPostScheduledAt : null,
            accountId: account.id,
            mediaUrls: newPostMediaUrls.length ? newPostMediaUrls : undefined,
          }),
        });
        toast({
          title: newPostStatus === "scheduled" ? "¡Programado!" : "¡Borrador guardado!",
          description:
            newPostStatus === "scheduled"
              ? "Tu post ha sido programado"
              : "Tu borrador ha sido guardado",
        });
      }

      setNewPostOpen(false);
      setNewPostContent("");
      setNewPostPlatforms([]);
      setNewPostStatus("draft");
      setNewPostScheduledAt("");
      setNewPostMediaUrls([]);
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el post",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Create new account
  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      toast({ title: "Error", description: "El nombre de cuenta es requerido", variant: "destructive" });
      return;
    }
    try {
      const avatarBg = PLATFORM_CONFIG[newAccountPlatform]?.avatarBg || "666666";
      await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: newAccountPlatform,
          accountName: newAccountName,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newAccountName)}&background=${avatarBg}&color=fff&size=128`,
          followers: 0,
          engagement: 0,
        }),
      });
      toast({ title: "¡Cuenta conectada!", description: `@${newAccountName} en ${PLATFORM_CONFIG[newAccountPlatform].label}` });
      setNewAccountOpen(false);
      setNewAccountName("");
      fetchAllData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo conectar la cuenta", variant: "destructive" });
    }
  };

  // Create automation rule
  const handleCreateAutomation = async () => {
    if (!newAutoName.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (newAutoPlatforms.length === 0) {
      toast({ title: "Error", description: "Selecciona al menos una plataforma", variant: "destructive" });
      return;
    }
    try {
      await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAutoName,
          description: newAutoDesc,
          triggerType: newAutoTrigger,
          actionType: newAutoAction,
          platforms: newAutoPlatforms,
        }),
      });
      toast({ title: "¡Regla creada!", description: `"${newAutoName}" ha sido creada exitosamente` });
      setNewAutomationOpen(false);
      setNewAutoName("");
      setNewAutoDesc("");
      setNewAutoPlatforms([]);
      fetchAllData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo crear la regla", variant: "destructive" });
    }
  };

  // Toggle automation rule
  const toggleRule = async (rule: AutomationRule) => {
    try {
      await fetch("/api/automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rule.id,
          isActive: !rule.isActive,
        }),
      });
      toast({
        title: rule.isActive ? "Regla desactivada" : "Regla activada",
        description: `"${rule.name}" ${rule.isActive ? "desactivada" : "activada"}`,
      });
      fetchAllData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar la regla", variant: "destructive" });
    }
  };

  // Delete automation rule
  const deleteRule = async (ruleId: string) => {
    try {
      await fetch(`/api/automation?id=${ruleId}`, { method: "DELETE" });
      toast({ title: "Regla eliminada", description: "La regla ha sido eliminada" });
      fetchAllData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar la regla", variant: "destructive" });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts?id=${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      toast({ title: "Post eliminado", description: "La publicación ha sido eliminada" });
      fetchAllData();
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el post", variant: "destructive" });
    }
  };

  const openEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setNewPostContent(post.content);
    setNewPostPlatforms(parseJsonArray(post.platforms));
    setNewPostStatus(post.status === "published" ? "draft" : post.status);
    setNewPostScheduledAt(
      post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ""
    );
    setNewPostMediaUrls(parseJsonArray(post.mediaUrls));
    setNewPostOpen(true);
  };

  const deleteAccount = async (accountId: string) => {
    try {
      const res = await fetch(`/api/accounts?id=${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      toast({ title: "Cuenta desconectada", description: "La cuenta ha sido eliminada" });
      fetchAllData();
    } catch {
      toast({ title: "Error", description: "No se pudo desconectar la cuenta", variant: "destructive" });
    }
  };

  const handleSavePost = async () => {
    if (editingPost) {
      if (!newPostContent.trim() || newPostPlatforms.length === 0) {
        toast({ title: "Error", description: "Contenido y plataforma son requeridos", variant: "destructive" });
        return;
      }
      setIsPublishing(true);
      try {
        const res = await fetch("/api/posts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingPost.id,
            content: newPostContent,
            platforms: newPostPlatforms,
            status: newPostStatus,
            scheduledAt: newPostStatus === "scheduled" ? newPostScheduledAt : null,
            mediaUrls: newPostMediaUrls,
          }),
        });
        if (!res.ok) throw new Error("update failed");
        toast({ title: "Post actualizado", description: "Los cambios se guardaron correctamente" });
        setNewPostOpen(false);
        setEditingPost(null);
        setNewPostContent("");
        setNewPostPlatforms([]);
        setNewPostStatus("draft");
        setNewPostScheduledAt("");
        setNewPostMediaUrls([]);
        fetchAllData();
      } catch {
        toast({ title: "Error", description: "No se pudo actualizar el post", variant: "destructive" });
      } finally {
        setIsPublishing(false);
      }
      return;
    }
    await handleCreatePost();
  };

  // Compute stats
  const totalFollowers = accounts.reduce((sum, a) => sum + a.followers, 0);
  const totalEngagement = accounts.length > 0
    ? (accounts.reduce((sum, a) => sum + a.engagement, 0) / accounts.length).toFixed(1)
    : "0";
  const publishedPosts = posts.filter((p) => p.status === "published");
  const scheduledPosts = posts.filter((p) => p.status === "scheduled");
  const totalReach = publishedPosts.reduce((sum, p) => sum + p.reaches, 0);
  const totalLikes = publishedPosts.reduce((sum, p) => sum + p.likes, 0);
  const marketingGuideCompleted = {
    accounts: accounts.length > 0,
    connect: accounts.some((a) => a.isActive),
    ai: false,
    campaign: false,
    auto: rules.some((r) => r.isActive),
  };
  const filteredPosts =
    contentFilter === "all" ? posts : posts.filter((p) => p.status === contentFilter);

  const followerTrend = (() => {
    if (analytics.length < 2) return null;
    const byDate = new Map<string, number>();
    for (const row of analytics) {
      const key = row.date.slice(0, 10);
      byDate.set(key, (byDate.get(key) || 0) + row.followers);
    }
    const keys = [...byDate.keys()].sort();
    if (keys.length < 2) return null;
    const first = byDate.get(keys[0]) || 0;
    const last = byDate.get(keys[keys.length - 1]) || 0;
    if (first === 0) return null;
    const pct = ((last - first) / first) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  })();

  const platformToggle = (platform: string, selectedArr: string[], setArr: (v: string[]) => void) => {
    if (selectedArr.includes(platform)) {
      setArr(selectedArr.filter((p) => p !== platform));
    } else {
      setArr([...selectedArr, platform]);
    }
  };

  // ─────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-primary" />
        </motion.div>
        <p className="mt-4 text-muted-foreground">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* HEADER */}
        <div className="brand-top-line" />
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 dark:border-white/10 dark:bg-black/70 dark:supports-[backdrop-filter]:bg-black/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/socialhub_logo.png"
                  alt="SocialHub"
                  className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/10"
                />
                <div>
                  <h1 className="brand-gradient-text text-lg font-bold tracking-tight">{settings.brandName}</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">{settings.brandTagline}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {session?.user && (
                  <Badge variant="outline" className="hidden sm:inline-flex gap-1 max-w-[180px] truncate">
                    {isAdmin ? <Shield className="h-3 w-3 shrink-0" /> : <Users className="h-3 w-3 shrink-0" />}
                    <span className="truncate">{session.user.email}</span>
                  </Badge>
                )}
                <ThemeToggle />
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
                <Dialog open={newPostOpen} onOpenChange={(open) => {
                  setNewPostOpen(open);
                  if (!open) {
                    setEditingPost(null);
                    setNewPostContent("");
                    setNewPostPlatforms([]);
                    setNewPostStatus("draft");
                    setNewPostScheduledAt("");
                    setNewPostMediaUrls([]);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="brand-gradient-btn gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Nuevo Post</span>
                    </Button>
                  </DialogTrigger>
                </Dialog>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => fetchAllData()}>
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 sm:grid-cols-5 lg:grid-cols-11 h-auto gap-1 p-1">
              <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="marketing" className="gap-1.5 text-xs sm:text-sm">
                <Megaphone className="h-4 w-4" />
                <span className="hidden sm:inline">Marketing</span>
              </TabsTrigger>
              <TabsTrigger value="studio" className="gap-1.5 text-xs sm:text-sm">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Studio</span>
              </TabsTrigger>
              <TabsTrigger value="ai-studio" className="gap-1.5 text-xs sm:text-sm">
                <Wand2 className="h-4 w-4" />
                <span className="hidden sm:inline">IA Studio</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="gap-1.5 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Cuentas</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1.5 text-xs sm:text-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Contenido</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5 text-xs sm:text-sm">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Agenda</span>
              </TabsTrigger>
              <TabsTrigger value="automation" className="gap-1.5 text-xs sm:text-sm">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Auto</span>
              </TabsTrigger>
              <TabsTrigger value="deploy" className="gap-1.5 text-xs sm:text-sm">
                <Rocket className="h-4 w-4" />
                <span className="hidden sm:inline">Despliegue</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="gap-1.5 text-xs sm:text-sm">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* ── DASHBOARD TAB ──────────────────────── */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Seguidores Totales", value: formatNumber(totalFollowers), icon: Users, trend: followerTrend || "—", up: !followerTrend || !followerTrend.startsWith("-"), color: "text-emerald-600" },
                  { label: "Engagement Rate", value: `${totalEngagement}%`, icon: TrendingUp, trend: `${accounts.length} cuentas`, up: true, color: "text-emerald-600" },
                  { label: "Alcance Total", value: formatNumber(totalReach), icon: Eye, trend: `${formatNumber(totalLikes)} likes`, up: true, color: "text-emerald-600" },
                  { label: "Posts Programados", value: scheduledPosts.length.toString(), icon: CalendarClock, trend: `${publishedPosts.length} pub.`, up: true, color: "text-amber-600" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-muted">
                              <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          <Badge variant="secondary" className={`text-xs ${stat.color}`}>
                            {stat.up ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowUpRight className="h-3 w-3 mr-0.5 rotate-90" />}
                            {stat.trend}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <MarketingGuide
                completed={marketingGuideCompleted}
                onGo={(tab) => setActiveTab(tab)}
              />

              {/* Platform Overview + Recent Posts */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Platform Overview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Resumen por Plataforma
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {accounts.map((account) => {
                      const config = PLATFORM_CONFIG[account.platform];
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <div key={account.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className={`p-2 rounded-lg ${config.bg}`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{account.accountName}</p>
                              <Badge variant="secondary" className="text-xs">{formatNumber(account.followers)} seg.</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">{account.posts} posts</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{account.engagement}% eng.</span>
                            </div>
                            <Progress value={account.engagement * 10} className="mt-2 h-1.5" />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Actividad Reciente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-80">
                      <div className="space-y-3">
                        {posts.slice(0, 6).map((post) => {
                          const statusConf = STATUS_CONFIG[post.status];
                          if (!statusConf) return null;
                          const StatusIcon = statusConf.icon;
                          const platformList: string[] = parseJsonArray(post.platforms);
                          return (
                            <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <div className={`p-1.5 rounded-md ${statusConf.bg} mt-0.5`}>
                                <StatusIcon className={`h-3.5 w-3.5 ${statusConf.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{post.content}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {platformList.map((p) => {
                                    const pConf = PLATFORM_CONFIG[p];
                                    if (!pConf) return null;
                                    const PIcon = pConf.icon;
                                    return <PIcon key={p} className={`h-3.5 w-3.5 ${pConf.color}`} />;
                                  })}
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                                </div>
                                {post.status === "published" && (
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                      <Heart className="h-3 w-3" /> {formatNumber(post.likes)}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                      <MessageCircle className="h-3 w-3" /> {formatNumber(post.comments)}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                      <Share2 className="h-3 w-3" /> {formatNumber(post.shares)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {posts.length === 0 && (
                          <p className="text-center text-sm text-muted-foreground py-8">No hay posts aún. ¡Crea tu primer post!</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Chart placeholder */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Engagement de los Últimos 7 Días
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.length > 0 ? (
                    <div className="space-y-3">
                      {enabledPlatforms.map((platform) => {
                        const config = PLATFORM_CONFIG[platform];
                        if (!config) return null;
                        const Icon = config.icon;
                        const platformData = analytics.filter((a) => a.platform === platform);
                        if (platformData.length === 0) return null;
                        const avgEngagement = (platformData.reduce((s, a) => s + a.engagement, 0) / platformData.length).toFixed(1);
                        const totalLikes = platformData.reduce((s, a) => s + a.likes, 0);
                        const totalReaches = platformData.reduce((s, a) => s + a.reaches, 0);
                        return (
                          <div key={platform} className="flex items-center gap-4 p-3 rounded-lg border">
                            <div className={`p-2 rounded-lg ${config.bg}`}>
                              <Icon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{config.label}</span>
                                <span className="text-sm font-bold">{avgEngagement}%</span>
                              </div>
                              <Progress value={parseFloat(avgEngagement) * 10} className="h-2" />
                              <div className="flex items-center gap-4 mt-1.5">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Heart className="h-3 w-3" /> {formatNumber(totalLikes)}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> {formatNumber(totalReaches)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
                      <p className="text-sm">Sin datos de analytics disponibles</p>
                      <p className="text-xs mt-1">Los datos aparecerán cuando conectes cuentas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── MARKETING TAB ──────────────────────── */}
            <TabsContent value="marketing" className="space-y-6">
              <MarketingHub
                enabledPlatforms={enabledPlatforms}
                brandName={settings.brandName}
                toast={toast}
                onOpenAiStudio={() => setActiveTab("ai-studio")}
              />
            </TabsContent>

            {/* ── STUDIO CREATIVO ─────────────────────── */}
            <TabsContent value="studio" className="space-y-6">
              <CreativeStudio toast={toast} />
            </TabsContent>

            {/* ── IA STUDIO TAB ──────────────────────── */}
            <TabsContent value="ai-studio" className="space-y-6">
              <AiStudio
                enabledPlatforms={enabledPlatforms}
                toast={toast}
                onUseAsPost={(content) => {
                  setNewPostContent(content);
                  setNewPostStatus("draft");
                  setNewPostOpen(true);
                  setActiveTab("content");
                }}
              />
            </TabsContent>

            {/* ── ACCOUNTS TAB ──────────────────────── */}
            <TabsContent value="accounts" className="space-y-6">
              <ConnectNetworksPanel
                accounts={accounts}
                enabledPlatforms={enabledPlatforms}
                onRefresh={fetchAllData}
                toast={toast}
              />

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Cuentas Conectadas</h2>
                  <p className="text-sm text-muted-foreground">
                    Gestiona perfiles y publica a una o varias redes a la vez
                  </p>
                </div>
                <Dialog open={newAccountOpen} onOpenChange={setNewAccountOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Cuenta manual
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {accounts.map((account) => {
                  const config = PLATFORM_CONFIG[account.platform];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card className="hover:shadow-md transition-all">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-xl ${config.bg}`}>
                              <Icon className={`h-6 w-6 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{account.accountName}</p>
                              <Badge variant="outline" className="text-xs mt-0.5">{config.label}</Badge>
                            </div>
                            <div className={`h-2.5 w-2.5 rounded-full ${account.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                          </div>
                          <Separator className="mb-4" />
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xl font-bold">{formatNumber(account.followers)}</p>
                              <p className="text-xs text-muted-foreground">Seguidores</p>
                            </div>
                            <div>
                              <p className="text-xl font-bold">{account.engagement}%</p>
                              <p className="text-xs text-muted-foreground">Engagement</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{formatNumber(account.following)}</p>
                              <p className="text-xs text-muted-foreground">Siguiendo</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{account.posts}</p>
                              <p className="text-xs text-muted-foreground">Posts</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-4 text-destructive hover:text-destructive"
                            onClick={() => deleteAccount(account.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Desconectar
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {accounts.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Users className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Sin cuentas conectadas</p>
                    <p className="text-sm mt-1">Conecta tu primera red social para empezar</p>
                    <Button size="sm" className="mt-4 gap-2" onClick={() => setNewAccountOpen(true)}>
                      <Plus className="h-4 w-4" /> Conectar Cuenta
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── CONTENT TAB ──────────────────────── */}
            <TabsContent value="content" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Gestión de Contenido</h2>
                  <p className="text-sm text-muted-foreground">Crea, edita y gestiona tus publicaciones</p>
                </div>
                <Button size="sm" className="gap-2" onClick={() => setNewPostOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nuevo Post
                </Button>
              </div>

              {/* Content filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {["all", "draft", "scheduled", "published", "failed"].map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    className="text-xs"
                    variant={contentFilter === filter ? "default" : "outline"}
                    onClick={() => setContentFilter(filter)}
                  >
                    {filter === "all" ? "Todos" : STATUS_CONFIG[filter]?.label || filter}
                    {filter === "all" && ` (${posts.length})`}
                    {filter === "draft" && ` (${posts.filter((p) => p.status === "draft").length})`}
                    {filter === "scheduled" && ` (${posts.filter((p) => p.status === "scheduled").length})`}
                    {filter === "published" && ` (${posts.filter((p) => p.status === "published").length})`}
                    {filter === "failed" && ` (${posts.filter((p) => p.status === "failed").length})`}
                  </Button>
                ))}
              </div>

              {/* Posts grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredPosts.map((post) => {
                    const statusConf = STATUS_CONFIG[post.status];
                    if (!statusConf) return null;
                    const StatusIcon = statusConf.icon;
                    const platformList = parseJsonArray(post.platforms);
                    return (
                      <motion.div
                        key={post.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <Card className="hover:shadow-md transition-all group">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge className={`${statusConf.bg} ${statusConf.color} gap-1 text-xs`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConf.label}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2 text-xs" onClick={() => openEditPost(post)}>
                                    <Edit3 className="h-3.5 w-3.5" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => deletePost(post.id)}>
                                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <p className="text-sm line-clamp-3 min-h-[3.75rem]">{post.content}</p>

                            {(() => {
                              const media = parseJsonArray(post.mediaUrls);
                              if (!media.length) return null;
                              return (
                                <div className="mt-3 flex gap-1.5 overflow-x-auto">
                                  {media.slice(0, 4).map((url) => (
                                    <div
                                      key={url}
                                      className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt="" className="h-full w-full object-cover" />
                                    </div>
                                  ))}
                                  {media.length > 4 && (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border text-xs text-muted-foreground">
                                      +{media.length - 4}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="flex items-center gap-1.5 mt-3">
                              {platformList.map((p) => {
                                const pConf = PLATFORM_CONFIG[p];
                                if (!pConf) return null;
                                const PIcon = pConf.icon;
                                return (
                                  <Tooltip key={p}>
                                    <TooltipTrigger>
                                      <div className={`p-1 rounded ${pConf.bg}`}>
                                        <PIcon className={`h-3.5 w-3.5 ${pConf.color}`} />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>{pConf.label}</TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>

                            <Separator className="my-3" />

                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                {post.scheduledAt ? (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDateTime(post.scheduledAt)}
                                  </span>
                                ) : (
                                  <span>{formatDate(post.createdAt)}</span>
                                )}
                              </div>
                              {post.status === "published" && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                    <Heart className="h-3 w-3" /> {post.likes}
                                  </span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                    <MessageCircle className="h-3 w-3" /> {post.comments}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {filteredPosts.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <FileText className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">{posts.length === 0 ? "Sin contenido" : "Sin resultados"}</p>
                    <p className="text-sm mt-1">{posts.length === 0 ? "Crea tu primera publicación" : "Prueba otro filtro"}</p>
                    <Button size="sm" className="mt-4 gap-2" onClick={() => setNewPostOpen(true)}>
                      <Sparkles className="h-4 w-4" /> Crear Post
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── CALENDAR TAB ──────────────────────── */}
            <TabsContent value="calendar" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Agenda de Publicaciones</h2>
                  <p className="text-sm text-muted-foreground">Vista calendario de tus posts programados</p>
                </div>
                <Button size="sm" className="gap-2" onClick={() => setNewPostOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Agendar Post
                </Button>
              </div>

              {/* Calendar view */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                    {/* Calendar cells - show current month */}
                    {(() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = now.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
                      const daysInMonth = lastDay.getDate();
                      const today = now.getDate();

                      const cells: React.ReactNode[] = [];
                      // Empty cells before first day
                      for (let i = 0; i < startDay; i++) {
                        cells.push(<div key={`empty-${i}`} className="h-16 sm:h-20" />);
                      }
                      // Day cells
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const dayPosts = posts.filter((p) => {
                          if (!p.scheduledAt) return false;
                          const pDate = new Date(p.scheduledAt);
                          return pDate.getFullYear() === year && pDate.getMonth() === month && pDate.getDate() === day;
                        });
                        const isToday = day === today;

                        cells.push(
                          <div
                            key={day}
                            className={`h-16 sm:h-20 p-1 rounded-lg border transition-colors ${
                              isToday ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
                            }`}
                          >
                            <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                              {day}
                            </span>
                            <div className="mt-0.5 space-y-0.5">
                              {dayPosts.slice(0, 2).map((post) => {
                                const statusConf = STATUS_CONFIG[post.status];
                                return (
                                  <div
                                    key={post.id}
                                    className={`text-[10px] px-1 py-0.5 rounded truncate ${statusConf?.bg || "bg-muted"} ${statusConf?.color || ""}`}
                                  >
                                    {post.content.substring(0, 12)}...
                                  </div>
                                );
                              })}
                              {dayPosts.length > 2 && (
                                <p className="text-[10px] text-muted-foreground">+{dayPosts.length - 2} más</p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming scheduled posts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Próximos Posts Programados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scheduledPosts
                      .sort((a, b) => new Date(a.scheduledAt || "").getTime() - new Date(b.scheduledAt || "").getTime())
                      .map((post) => {
                        const platformList: string[] = parseJsonArray(post.platforms);
                        return (
                          <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg border">
                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700">
                              <span className="text-lg font-bold">{post.scheduledAt ? new Date(post.scheduledAt).getDate() : "—"}</span>
                              <span className="text-[10px] uppercase">
                                {post.scheduledAt
                                  ? new Date(post.scheduledAt).toLocaleDateString("es-ES", { month: "short" })
                                  : ""}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{post.content}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {platformList.map((p) => {
                                  const pConf = PLATFORM_CONFIG[p];
                                  if (!pConf) return null;
                                  const PIcon = pConf.icon;
                                  return <PIcon key={p} className={`h-3.5 w-3.5 ${pConf.color}`} />;
                                })}
                                <span className="text-xs text-muted-foreground">
                                  {post.scheduledAt
                                    ? new Date(post.scheduledAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                                    : ""}
                                </span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="gap-1 text-xs shrink-0">
                              <Send className="h-3 w-3" /> Publicar
                            </Button>
                          </div>
                        );
                      })}
                    {scheduledPosts.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No hay posts programados</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── AUTOMATION TAB ──────────────────────── */}
            <TabsContent value="automation" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Automatización</h2>
                  <p className="text-sm text-muted-foreground">Configura reglas para automatizar tus redes</p>
                </div>
                <Dialog open={newAutomationOpen} onOpenChange={setNewAutomationOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nueva Regla
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Bot className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold">{rules.length}</p>
                    <p className="text-xs text-muted-foreground">Reglas Totales</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Zap className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                    <p className="text-2xl font-bold">{rules.filter((r) => r.isActive).length}</p>
                    <p className="text-xs text-muted-foreground">Reglas Activas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Play className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                    <p className="text-2xl font-bold">{rules.reduce((s, r) => s + r.runCount, 0)}</p>
                    <p className="text-xs text-muted-foreground">Ejecuciones</p>
                  </CardContent>
                </Card>
              </div>

              {/* Rules list */}
              <div className="space-y-4">
                <AnimatePresence>
                  {rules.map((rule) => {
                    const platformList: string[] = parseJsonArray(rule.platforms);
                    return (
                      <motion.div
                        key={rule.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <Card className={`transition-all ${!rule.isActive ? "opacity-60" : "hover:shadow-md"}`}>
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`p-2 rounded-lg ${rule.isActive ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                                  <Bot className={`h-5 w-5 ${rule.isActive ? "text-emerald-600" : "text-gray-400"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-sm">{rule.name}</h3>
                                    <Badge variant={rule.isActive ? "default" : "secondary"} className="text-xs">
                                      {rule.isActive ? "Activa" : "Inactiva"}
                                    </Badge>
                                  </div>
                                  {rule.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Zap className="h-3 w-3" />
                                      {TRIGGER_LABELS[rule.triggerType] || rule.triggerType}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Play className="h-3 w-3" />
                                      {ACTION_LABELS[rule.actionType] || rule.actionType}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                      {platformList.map((p) => {
                                        const pConf = PLATFORM_CONFIG[p];
                                        if (!pConf) return null;
                                        const PIcon = pConf.icon;
                                        return <PIcon key={p} className={`h-3.5 w-3.5 ${pConf.color}`} />;
                                      })}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <RefreshCw className="h-3 w-3" />
                                      {rule.runCount} ejecuciones
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Última: {timeAgo(rule.lastRunAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => toggleRule(rule)}
                                    >
                                      {rule.isActive ? (
                                        <ToggleRight className="h-5 w-5 text-emerald-600" />
                                      ) : (
                                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{rule.isActive ? "Desactivar" : "Activar"}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => deleteRule(rule.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Eliminar</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {rules.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Bot className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Sin automatizaciones</p>
                    <p className="text-sm mt-1">Crea tu primera regla de automatización</p>
                    <Button size="sm" className="mt-4 gap-2" onClick={() => setNewAutomationOpen(true)}>
                      <Bot className="h-4 w-4" /> Crear Regla
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <SettingsPanel
                settings={settings}
                accounts={accounts}
                posts={posts}
                rules={rules}
                onSaveSettings={saveSettings}
                onRefresh={fetchAllData}
                onEditPost={openEditPost}
                onDeletePost={deletePost}
                onToggleRule={toggleRule}
                onDeleteRule={deleteRule}
                onCreateRule={async (payload) => {
                  const res = await fetch("/api/automation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) throw new Error("create rule failed");
                }}
                onUpdateAccount={async (payload) => {
                  const res = await fetch("/api/accounts", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) throw new Error("update account failed");
                  await fetchAllData();
                }}
                onDeleteAccount={deleteAccount}
                toast={toast}
              />
            </TabsContent>

            <TabsContent value="deploy" className="space-y-6">
              <DeployGuide />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="space-y-6">
                <AdminUsersPanel />
              </TabsContent>
            )}
          </Tabs>
        </main>

        {/* FOOTER */}
        <footer className="mt-auto border-t bg-background/80 dark:border-white/10 dark:bg-black/40">
          <div className="brand-bottom-line" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/socialhub_favicon.png" alt="" className="h-4 w-4 rounded-sm object-cover" />
                <span className="brand-gradient-text font-semibold">{settings.brandName}</span>
                <span>— {settings.brandTagline}</span>
              </p>
              <p>{accounts.length} cuentas · {enabledPlatforms.length} plataformas activas</p>
            </div>
          </div>
        </footer>

        {/* ── DIALOGS ────────────────────────────── */}

        {/* New Post Dialog */}
        <Dialog open={newPostOpen} onOpenChange={(open) => {
          setNewPostOpen(open);
          if (!open) {
            setEditingPost(null);
            setNewPostContent("");
            setNewPostPlatforms([]);
            setNewPostStatus("draft");
            setNewPostScheduledAt("");
            setNewPostMediaUrls([]);
          }
        }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {editingPost ? "Editar Publicación" : "Crear Publicación"}
              </DialogTitle>
              <DialogDescription>
                {editingPost
                  ? "Actualiza el contenido y el estado de tu publicación"
                  : "Crea y programa contenido para tus redes sociales"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Contenido</Label>
                <Textarea
                  placeholder="¿Qué quieres compartir con tu audiencia?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{newPostContent.length}/280 caracteres</p>
              </div>

              <StudioAssetPicker
                selected={newPostMediaUrls}
                onChange={setNewPostMediaUrls}
              />

              <div className="space-y-2">
                <Label>Plataformas (una o varias a la vez)</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {enabledPlatforms.map((platform) => {
                    const config = PLATFORM_CONFIG[platform];
                    if (!config) return null;
                    const Icon = config.icon;
                    const isSelected = newPostPlatforms.includes(platform);
                    const connected = accounts.some(
                      (a) =>
                        a.platform === platform &&
                        a.isActive &&
                        (a.isConnected || Boolean(a.accessToken))
                    );
                    return (
                      <Button
                        key={platform}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => platformToggle(platform, newPostPlatforms, setNewPostPlatforms)}
                      >
                        <Icon className={`h-4 w-4 ${isSelected ? "" : config.color}`} />
                        {config.label}
                        <span
                          className={`ml-0.5 h-1.5 w-1.5 rounded-full ${
                            connected ? "bg-emerald-400" : "bg-muted-foreground/40"
                          }`}
                          title={connected ? "Conectada" : "Sin conectar"}
                        />
                      </Button>
                    );
                  })}
                </div>
                {newPostStatus === "published" && (
                  <p className="text-xs text-muted-foreground">
                    {newPostPlatforms.length > 1
                      ? `Se publicará en paralelo a ${newPostPlatforms.length} redes.`
                      : "Punto verde = red conectada con OAuth."}{" "}
                    Sin conexión: ve a Cuentas.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={newPostStatus} onValueChange={setNewPostStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 Borrador</SelectItem>
                    <SelectItem value="scheduled">⏰ Programado</SelectItem>
                    <SelectItem value="published">🚀 Publicar Ahora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPostStatus === "scheduled" && (
                <div className="space-y-2">
                  <Label>Fecha y Hora de Publicación</Label>
                  <Input
                    type="datetime-local"
                    value={newPostScheduledAt}
                    onChange={(e) => setNewPostScheduledAt(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewPostOpen(false)}>Cancelar</Button>
              <Button onClick={handleSavePost} disabled={isPublishing} className="gap-2">
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingPost ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Guardar cambios
                  </>
                ) : newPostStatus === "published" ? (
                  <>
                    <Send className="h-4 w-4" />
                    Publicar Ahora
                  </>
                ) : newPostStatus === "scheduled" ? (
                  <>
                    <Clock className="h-4 w-4" />
                    Programar
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Guardar Borrador
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Account Dialog */}
        <Dialog open={newAccountOpen} onOpenChange={setNewAccountOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Conectar Cuenta
              </DialogTitle>
              <DialogDescription>Conecta una nueva red social a tu dashboard</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <div className="grid grid-cols-2 gap-2">
                  {enabledPlatforms.map((platform) => {
                    const config = PLATFORM_CONFIG[platform];
                    if (!config) return null;
                    const Icon = config.icon;
                    const isSelected = newAccountPlatform === platform;
                    return (
                      <Button
                        key={platform}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="gap-2 justify-start"
                        onClick={() => setNewAccountPlatform(platform)}
                      >
                        <Icon className={`h-4 w-4 ${isSelected ? "" : config.color}`} />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombre de Cuenta</Label>
                <Input
                  placeholder="@tu_usuario"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    En producción, aquí se conectaría con la API oficial de {PLATFORM_CONFIG[newAccountPlatform]?.label} para autenticación OAuth.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewAccountOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateAccount} className="gap-2">
                <Plus className="h-4 w-4" />
                Conectar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Automation Dialog */}
        <Dialog open={newAutomationOpen} onOpenChange={setNewAutomationOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Nueva Regla de Automatización
              </DialogTitle>
              <DialogDescription>Configura una regla para automatizar acciones en tus redes</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre de la Regla</Label>
                <Input
                  placeholder="Ej: Auto-responder mensajes"
                  value={newAutoName}
                  onChange={(e) => setNewAutoName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Describe qué hace esta automatización"
                  value={newAutoDesc}
                  onChange={(e) => setNewAutoDesc(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Disparador</Label>
                  <Select value={newAutoTrigger} onValueChange={setNewAutoTrigger}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TRIGGER_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Acción</Label>
                  <Select value={newAutoAction} onValueChange={setNewAutoAction}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((a) => (
                        <SelectItem key={a} value={a}>
                          {ACTION_LABELS[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Plataformas</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {enabledPlatforms.map((platform) => {
                    const config = PLATFORM_CONFIG[platform];
                    if (!config) return null;
                    const Icon = config.icon;
                    const isSelected = newAutoPlatforms.includes(platform);
                    return (
                      <Button
                        key={platform}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => platformToggle(platform, newAutoPlatforms, setNewAutoPlatforms)}
                      >
                        <Icon className={`h-4 w-4 ${isSelected ? "" : config.color}`} />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewAutomationOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateAutomation} className="gap-2">
                <Bot className="h-4 w-4" />
                Crear Regla
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
