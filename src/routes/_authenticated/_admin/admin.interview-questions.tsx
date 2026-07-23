import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Loader2,
  ListOrdered,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  getAdminInterviewTopics,
  saveAdminInterviewTopics,
  resetAdminInterviewTopics,
  type MasterInterviewTopic,
} from "@/lib/interview.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin/interview-questions")({
  head: () => ({
    meta: [{ title: "Interview Questions Manager — Admin" }],
  }),
  component: AdminInterviewQuestionsPage,
});

function AdminInterviewQuestionsPage() {
  const queryClient = useQueryClient();
  const getTopicsFn = useServerFn(getAdminInterviewTopics);
  const saveTopicsFn = useServerFn(saveAdminInterviewTopics);
  const resetTopicsFn = useServerFn(resetAdminInterviewTopics);

  const topicsQuery = useQuery({
    queryKey: ["admin_interview_topics"],
    queryFn: () => getTopicsFn(),
  });

  const [topics, setTopics] = useState<MasterInterviewTopic[]>([]);
  const [editingTopic, setEditingTopic] = useState<MasterInterviewTopic | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [newTopicQs, setNewTopicQs] = useState("");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  useEffect(() => {
    if (topicsQuery.data) {
      setTopics(topicsQuery.data);
    }
  }, [topicsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (updated: MasterInterviewTopic[]) => saveTopicsFn({ data: { topics: updated } }),
    onSuccess: () => {
      toast.success("Interview topics & questions saved!");
      queryClient.invalidateQueries({ queryKey: ["admin_interview_topics"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetTopicsFn(),
    onSuccess: (res) => {
      toast.success("Reset to default topics");
      setTopics(res.topics);
      queryClient.invalidateQueries({ queryKey: ["admin_interview_topics"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleToggleEnable = (id: string) => {
    const updated = topics.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
    setTopics(updated);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= topics.length) return;
    const clone = [...topics];
    const temp = clone[index];
    clone[index] = clone[targetIdx];
    clone[targetIdx] = temp;
    // update position
    const reordered = clone.map((t, i) => ({ ...t, position: i + 1 }));
    setTopics(reordered);
  };

  const handleDeleteTopic = (id: string) => {
    if (confirm("Are you sure you want to delete this interview topic?")) {
      const updated = topics.filter((t) => t.id !== id).map((t, i) => ({ ...t, position: i + 1 }));
      setTopics(updated);
    }
  };

  const handleAddQuestion = (topicId: string, text: string) => {
    if (!text.trim()) return;
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, defaultQuestions: [...t.defaultQuestions, text.trim()] } : t,
      ),
    );
  };

  const handleDeleteQuestion = (topicId: string, qIndex: number) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId
          ? { ...t, defaultQuestions: t.defaultQuestions.filter((_, i) => i !== qIndex) }
          : t,
      ),
    );
  };

  const handleEditQuestion = (topicId: string, qIndex: number, newText: string) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        const copy = [...t.defaultQuestions];
        copy[qIndex] = newText;
        return { ...t, defaultQuestions: copy };
      }),
    );
  };

  const handleCreateTopic = () => {
    if (!newTopicTitle.trim()) {
      toast.error("Topic title is required");
      return;
    }
    const qList = newTopicQs
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    const newTopic: MasterInterviewTopic = {
      id: newTopicTitle.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now(),
      topic: newTopicTitle.trim(),
      description: newTopicDesc.trim(),
      position: topics.length + 1,
      enabled: true,
      defaultQuestions: qList,
    };

    setTopics([...topics, newTopic]);
    setNewTopicTitle("");
    setNewTopicDesc("");
    setNewTopicQs("");
    setIsAddOpen(false);
    toast.success("Topic added! Click 'Save All Changes' to apply.");
  };

  if (topicsQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading Interview Questions Manager...</span>
      </div>
    );
  }

  const enabledCount = topics.filter((t) => t.enabled).length;
  const totalQuestionsCount = topics.reduce((acc, t) => acc + t.defaultQuestions.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-amber-600" /> Dynamic Interview Questions Manager
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Add, edit, reorder, or disable interview topics and pre-defined master questions for users.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            className="text-xs text-neutral-700"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Defaults
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add New Topic
          </Button>

          <Button
            size="sm"
            onClick={() => saveMutation.mutate(topics)}
            disabled={saveMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Total Topics</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{topics.length}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Active (Enabled) Topics</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{enabledCount}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Master Questions Pool</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{totalQuestionsCount}</div>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {topics.map((t, idx) => {
          const isExpanded = expandedTopicId === t.id;
          return (
            <div
              key={t.id}
              className={`rounded-2xl border transition-all ${
                t.enabled ? "border-neutral-200 bg-white" : "border-neutral-200 bg-neutral-50 opacity-75"
              }`}
            >
              {/* Topic Main Header Row */}
              <div className="flex flex-wrap items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-700 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-neutral-900">{t.topic}</h3>
                      {t.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-200 text-neutral-700">
                          <XCircle className="h-3 w-3" /> Disabled
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400 font-mono">
                        ({t.defaultQuestions.length} Questions)
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{t.description}</p>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(idx, "up")}
                    disabled={idx === 0}
                    title="Move Up"
                    className="h-8 w-8 p-0"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(idx, "down")}
                    disabled={idx === topics.length - 1}
                    title="Move Down"
                    className="h-8 w-8 p-0"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleEnable(t.id)}
                    className="text-xs h-8 px-2.5"
                  >
                    {t.enabled ? "Disable" : "Enable"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedTopicId(isExpanded ? null : t.id)}
                    className="text-xs h-8 px-2.5 flex items-center gap-1"
                  >
                    <span>Questions</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTopic(t.id)}
                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    title="Delete Topic"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Questions Expandable Drawer */}
              {isExpanded && (
                <div className="border-t border-neutral-100 bg-neutral-50/50 p-4 space-y-3 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                      <ListOrdered className="h-3.5 w-3.5 text-amber-600" /> Pre-Defined Questions ({t.defaultQuestions.length})
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      When a user opens this topic, questions are drawn from this list first before calling AI.
                    </span>
                  </div>

                  <div className="space-y-2">
                    {t.defaultQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="flex items-center gap-2 bg-white rounded-lg border border-neutral-200 p-2 text-xs">
                        <span className="text-neutral-400 font-mono text-[11px] w-5 text-center shrink-0">
                          {qIdx + 1}.
                        </span>
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => handleEditQuestion(t.id, qIdx, e.target.value)}
                          className="flex-1 bg-transparent border-none text-xs focus:ring-0 focus:outline-none text-neutral-800 font-medium"
                        />
                        <button
                          onClick={() => handleDeleteQuestion(t.id, qIdx)}
                          className="text-neutral-400 hover:text-red-600 p-1 shrink-0"
                          title="Delete Question"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {t.defaultQuestions.length === 0 && (
                      <div className="text-center py-4 text-xs text-neutral-400 italic bg-white rounded-lg border border-dashed">
                        No pre-defined questions. The AI will generate custom questions automatically for this topic.
                      </div>
                    )}
                  </div>

                  {/* Add New Question Input */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add a new pre-defined question for this topic..."
                      className="text-xs bg-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddQuestion(t.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      id={`new-q-input-${t.id}`}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById(`new-q-input-${t.id}`) as HTMLInputElement;
                        if (input && input.value) {
                          handleAddQuestion(t.id, input.value);
                          input.value = "";
                        }
                      }}
                      className="text-xs shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Dialog: Add New Topic */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-5 w-5 text-amber-600" /> Create New Interview Topic
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs pt-2">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Topic Title</label>
              <Input
                placeholder="e.g. Higher Education, Military Service, Travel & Adventure"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Description / Guidelines</label>
              <Textarea
                placeholder="Short description guiding what memories this chapter covers..."
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Pre-Defined Questions (One per line)
              </label>
              <Textarea
                placeholder="Where did you study?&#10;What was your favorite memory from this era?&#10;Who was your best friend?"
                value={newTopicQs}
                onChange={(e) => setNewTopicQs(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateTopic}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Create Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
