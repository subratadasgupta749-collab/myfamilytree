import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listUsers, setUserRole, createUser, deleteUser } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdminPageHeader, FiltersBar, Pager, useDebounced } from "@/components/admin/table-controls";
import { toCsv, downloadCsv } from "@/lib/csv";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }, { name: "robots", content: "noindex" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { user: currentUser } = useAuth();
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 300);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [data, setData] = useState<Awaited<ReturnType<typeof listUsers>>>({ rows: [], total: 0 });
  const [busy, setBusy] = useState(false);

  // Add User State
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  const load = () => {
    setBusy(true);
    listUsers({ data: { page, pageSize, q: dq, status: "" } })
      .then(setData).catch((e) => toast.error(e.message)).finally(() => setBusy(false));
  };
  useEffect(() => { load(); }, [dq, page]);
  useEffect(() => { setPage(1); }, [dq]);

  const toggleRole = async (userId: string, has: boolean) => {
    try {
      await setUserRole({ data: { userId, role: "admin", grant: !has } });
      toast.success(has ? "Admin removed" : "Admin granted");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      toast.error("Name and Email are required");
      return;
    }
    setAddingUser(true);
    try {
      await createUser({ data: { name: newName, email: newEmail, password: newPassword || undefined } });
      toast.success("User created successfully");
      setOpenAddDialog(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser({ data: { userId } });
      toast.success("User deleted successfully");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const exportCsv = () => {
    downloadCsv("users.csv", toCsv(data.rows.map((r: any) => ({
      id: r.id, email: r.email, full_name: r.full_name, roles: (r.roles || []).join("|"),
      created_at: r.created_at,
    }))));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AdminPageHeader 
        title="Users" 
        subtitle={`${data.total.toLocaleString()} total`} 
        actions={
          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. They will be able to log in immediately with their credentials.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Full Name</Label>
                  <Input
                    id="new-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email Address</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password (Optional)</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave empty for auto-generated password"
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)} disabled={addingUser}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addingUser}>
                    {addingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <FiltersBar q={q} onQ={setQ} placeholder="Search by email or name…" onExport={exportCsv} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Admin</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {busy && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>}
            {!busy && data.rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No users</TableCell></TableRow>}
            {data.rows.map((u: any) => {
              const isAdmin = (u.roles || []).includes("admin");
              const isSelf = u.id === currentUser?.id;
              return (
                <TableRow key={u.id}>
                  <TableCell>{u.full_name || "—"}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    {(u.roles || []).map((r: string) => (
                      <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="mr-1">{r}</Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch checked={isAdmin} onCheckedChange={() => toggleRole(u.id, isAdmin)} />
                  </TableCell>
                  <TableCell className="text-right">
                    {!isSelf ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {u.full_name || u.email}? This action is permanent and cannot be undone. All associated books and data will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(u.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <span className="text-xs text-muted-foreground italic pr-2.5">You</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="px-4 py-3"><Pager page={page} pageSize={pageSize} total={data.total} onPage={setPage} /></div>
      </Card>
    </div>
  );
}
