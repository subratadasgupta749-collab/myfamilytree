import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import {
  HardDrive,
  Upload,
  Search,
  Trash2,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  Check,
  Folder,
  Loader2,
  Lock,
  Globe,
  Plus,
  RefreshCw,
  Eye,
  ShieldCheck,
  FileType,
} from "lucide-react";
import {
  listBlobBuckets,
  listBlobFiles,
  uploadBlobFile,
  deleteBlobFile,
  generateSignedBlobUrl,
  getBlobStorageStats,
} from "@/lib/blob-storage.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/storage")({
  head: () => ({
    meta: [
      { title: "Blob Storage & Object Manager — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBlobStoragePage,
});

function AdminBlobStoragePage() {
  const queryClient = useQueryClient();
  const [selectedBucket, setSelectedBucket] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Form State
  const [uploadBucket, setUploadBucket] = useState("media");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: buckets = [] } = useQuery({
    queryKey: ["admin-blob-buckets"],
    queryFn: () => listBlobBuckets(),
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-blob-stats"],
    queryFn: () => getBlobStorageStats(),
  });

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-blob-files", selectedBucket, search],
    queryFn: () => listBlobFiles({ data: { bucketId: selectedBucket, search } }),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error("Please select a file to upload");
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const content_base64 = reader.result as string;
            await uploadBlobFile({
              data: {
                bucket_id: uploadBucket,
                filename: uploadFile.name,
                file_path: `${uploadBucket}/${Date.now()}_${uploadFile.name}`,
                mime_type: uploadFile.type || "application/octet-stream",
                file_size: uploadFile.size,
                content_base64,
                is_public: isPublic,
              },
            });
            resolve();
          } catch (e: any) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsDataURL(uploadFile);
      });
    },
    onSuccess: () => {
      toast.success("File uploaded to Blob storage successfully!");
      setIsUploadOpen(false);
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ["admin-blob-files"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blob-stats"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to upload blob file"),
  });

  const deleteMutation = useMutation({
    mutationFn: (f: any) =>
      deleteBlobFile({
        data: { id: f.id, bucket_id: f.bucket_id, file_path: f.file_path },
      }),
    onSuccess: () => {
      toast.success("File removed from Blob storage");
      queryClient.invalidateQueries({ queryKey: ["admin-blob-files"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blob-stats"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Blob URL copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateSignedUrl = async (f: any) => {
    try {
      const res = await generateSignedBlobUrl({
        data: { bucket_id: f.bucket_id, file_path: f.file_path, expiresInSeconds: 3600 },
      });
      navigator.clipboard.writeText(res.signedUrl);
      toast.success("1-Hour Signed URL copied to clipboard");
    } catch (e: any) {
      toast.error("Failed to generate signed URL: " + e.message);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const totalUsedMb = ((stats?.totalBytesUsed ?? 0) / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="Blob Storage & Object Manager"
        subtitle="Manage cloud storage buckets, file uploads, CDN media assets, PDF manuscripts, and signed access links."
      />

      {/* METRICS & OVERVIEW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 rounded-2xl bg-white border-border/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Storage Consumed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[color:var(--ink)]">{totalUsedMb} MB</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Across all storage buckets</div>
        </Card>

        <Card className="p-5 rounded-2xl bg-white border-border/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Stored Objects</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <FileType className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[color:var(--ink)]">{stats?.totalFiles ?? files.length}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Registered storage files</div>
        </Card>

        <Card className="p-5 rounded-2xl bg-white border-border/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Storage Buckets</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
              <Folder className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[color:var(--ink)]">{buckets.length}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Configured bucket containers</div>
        </Card>

        <Card className="p-5 rounded-2xl bg-white border-border/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">CDN & Security</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[color:var(--ink)]">Supabase S3</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Signed URLs & RLS protected</div>
        </Card>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-border/60 shadow-2xs">
        {/* Bucket Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <Button
            variant={selectedBucket === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedBucket("all")}
            className={`rounded-full text-xs ${selectedBucket === "all" ? "bg-[color:var(--primary)] text-white" : ""}`}
          >
            All Buckets
          </Button>
          {buckets.map((b) => (
            <Button
              key={b.id}
              variant={selectedBucket === b.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBucket(b.id)}
              className={`rounded-full capitalize text-xs ${
                selectedBucket === b.id ? "bg-[color:var(--primary)] text-white" : ""
              }`}
            >
              <Folder className="mr-1.5 h-3.5 w-3.5" />
              {b.id.replace("-", " ")}
            </Button>
          ))}
        </div>

        {/* Search & Upload Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename..."
              className="pl-8 h-9 text-xs w-48 sm:w-60"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="rounded-xl bg-[color:var(--primary)] text-white"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload File
          </Button>
        </div>
      </div>

      {/* BLOB FILES TABLE */}
      <Card className="rounded-2xl bg-white border-border/60 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground space-y-3">
            <HardDrive className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <div>No blob storage files found in this bucket.</div>
            <Button size="sm" variant="outline" onClick={() => setIsUploadOpen(true)} className="rounded-xl">
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload First File
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-muted-foreground font-medium">
                <tr>
                  <th className="p-3 pl-5">Object Name</th>
                  <th className="p-3">Bucket</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Access</th>
                  <th className="p-3">Uploaded Date</th>
                  <th className="p-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {files.map((f: any) => (
                  <tr key={f.id} className="hover:bg-muted/20 transition">
                    <td className="p-3 pl-5 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        {f.mime_type?.startsWith("image/") ? (
                          <div className="h-8 w-8 rounded-lg overflow-hidden border bg-slate-100 flex-shrink-0">
                            <img src={f.public_url} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0 font-mono text-[10px] font-bold">
                            {f.filename.split(".").pop()?.toUpperCase() ?? "FILE"}
                          </div>
                        )}
                        <span className="truncate max-w-[200px] sm:max-w-[300px]">{f.filename}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize text-[10px] bg-slate-50">
                        {f.bucket_id}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">{formatBytes(f.file_size)}</td>
                    <td className="p-3">
                      {f.is_public ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                          <Globe className="mr-1 h-3 w-3" /> Public CDN
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          <Lock className="mr-1 h-3 w-3" /> Private RLS
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground font-mono text-[11px]">
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyUrl(f.public_url, f.id)}
                          title="Copy Link"
                          className="h-7 w-7"
                        >
                          {copiedId === f.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        {!f.is_public && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => generateSignedUrl(f)}
                            title="Copy 1-Hour Signed URL"
                            className="h-7 w-7 text-amber-600"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => window.open(f.public_url, "_blank")}
                          title="View / Download"
                          className="h-7 w-7"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(f)}
                          disabled={deleteMutation.isPending}
                          title="Delete File"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* UPLOAD DIALOG */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-semibold">Upload File to Blob Storage</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Target Storage Bucket</Label>
              <select
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium"
                value={uploadBucket}
                onChange={(e) => setUploadBucket(e.target.value)}
              >
                {buckets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Select Local File</Label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition bg-slate-50"
              >
                {uploadFile ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-xs text-foreground">{uploadFile.name}</div>
                    <div className="text-[11px] text-muted-foreground">{formatBytes(uploadFile.size)}</div>
                  </div>
                ) : (
                  <div className="space-y-1 text-muted-foreground">
                    <Upload className="mx-auto h-6 w-6 text-primary" />
                    <div className="text-xs font-medium text-foreground">Click to browse or drop file here</div>
                    <div className="text-[10px]">Images, PDFs, Word DOCX, Zip files supported</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_public_cb"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="is_public_cb" className="text-xs cursor-pointer">
                Make file publicly accessible via CDN URL
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => uploadMutation.mutate()}
              disabled={!uploadFile || uploadMutation.isPending}
              className="rounded-xl bg-[color:var(--primary)] text-white"
            >
              {uploadMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              Upload to Bucket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
