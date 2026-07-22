import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HelpCircle, Search, MessageSquare, Bug, Sparkles, Send, Mail, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/help")({
  head: () => ({
    meta: [
      { title: "Help Center — My Family History Book" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HelpCenterPage,
});

function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Form states
  const [tab, setTab] = useState("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: "How do I conduct an AI-guided family history interview?",
      a: "Our AI interviewer asks warm, structured questions about childhood, family lineage, careers, and life lessons. Simply click 'Resume Interview' on your book, speak or type your answers, and the system turns them into polished chapters.",
    },
    {
      q: "Can I add photos to my family history book?",
      a: "Yes! Navigate to your book's Photos section to upload up to 200 high-resolution photos. You can add captions, dates, and assign photos to specific chapters.",
    },
    {
      q: "What export formats are available for printing?",
      a: "You can download a print-ready PDF with professional margins and typesetting, a standard PDF for digital sharing, or a Word (.docx) file for custom editing.",
    },
    {
      q: "Can multiple family members contribute to one book?",
      a: "Yes. You can share your referral or account login with family members so they can answer interview questions or upload heirloom photos.",
    },
    {
      q: "Is my family's private data secure?",
      a: "We use enterprise-grade encryption. Your personal stories and photos are private to your account and are never shared or sold.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill out all fields");
      return;
    }
    setSubmitted(true);
    toast.success("Thank you! Your message has been sent to our support team.");
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-4xl">
          Help Center & Support Hub
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Find quick answers, contact our dedicated support team, or request new features.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQs (e.g. photos, printing, interview)..."
          className="pl-11 h-12 rounded-2xl border-border/60 bg-white text-sm shadow-2xs"
        />
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-[color:var(--ink)]">Frequently Asked Questions</h2>

        <div className="divide-y divide-border/50 rounded-2xl border border-border/60 bg-white overflow-hidden shadow-2xs">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-muted/30"
                >
                  <span className="font-serif font-medium text-base text-[color:var(--ink)]">{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-primary" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed animate-fade-up">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact & Feedback Forms */}
      <div className="space-y-4 pt-4">
        <h2 className="font-serif text-xl font-semibold text-[color:var(--ink)]">Get in Touch</h2>

        <Card className="p-6 rounded-2xl bg-white border-border/60 shadow-2xs">
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="inline-flex h-10 bg-muted/40 p-1 rounded-xl">
              <TabsTrigger value="support" className="rounded-lg text-xs font-medium">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Contact Support
              </TabsTrigger>
              <TabsTrigger value="bug" className="rounded-lg text-xs font-medium">
                <Bug className="mr-1.5 h-3.5 w-3.5" /> Report an Issue
              </TabsTrigger>
              <TabsTrigger value="feature" className="rounded-lg text-xs font-medium">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Request a Feature
              </TabsTrigger>
            </TabsList>

            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Message Received!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Our team typically responds within 24 hours. We appreciate your feedback.
                </p>
                <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); }} className="mt-4 rounded-xl">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={
                      tab === "bug"
                        ? "e.g. Issue uploading photos..."
                        : tab === "feature"
                        ? "e.g. Add audio narration feature..."
                        : "e.g. Question about printing..."
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your request or issue in detail..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" className="rounded-xl bg-[color:var(--primary)] text-white">
                    <Send className="mr-1.5 h-4 w-4" /> Submit Request
                  </Button>
                </div>
              </form>
            )}
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
