import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  DoorOpen,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  LogIn,
  Receipt,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

/* ─────────────────────────────────────────── types ── */
interface FlowStep {
  id: number;
  icon: React.ElementType;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface FeatureSection {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  steps: { title: string; desc: string }[];
  tips?: string[];
}

/* ─────────────────────────────────────── constants ── */
const FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    icon: LogIn,
    label: "নিবন্ধন",
    sublabel: "অ্যাকাউন্ট তৈরি করুন",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
  },
  {
    id: 2,
    icon: Building2,
    label: "বিল্ডিং",
    sublabel: "বিল্ডিং যোগ করুন",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: 3,
    icon: DoorOpen,
    label: "অ্যাপার্টমেন্ট",
    sublabel: "ইউনিট তৈরি করুন",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
  },
  {
    id: 4,
    icon: Users,
    label: "ভাড়াটে",
    sublabel: "ভাড়াটে যোগ করুন",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    id: 5,
    icon: FileText,
    label: "চুক্তি",
    sublabel: "ভাড়ার পরিমাণ নির্ধারণ",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    id: 6,
    icon: Receipt,
    label: "মাসিক ডিউ",
    sublabel: "ডিউ তৈরি করুন",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    id: 7,
    icon: CreditCard,
    label: "পেমেন্ট",
    sublabel: "পেমেন্ট রেকর্ড করুন",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
];

const FEATURES: FeatureSection[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "ড্যাশবোর্ড",
    subtitle: "মাসিক সারাংশ ও বকেয়া তালিকা",
    color: "text-violet-600",
    steps: [
      {
        title: "মাস ও বছর নির্বাচন",
        desc: "পৃষ্ঠার উপরে মাস ও বছর সিলেক্ট করুন যে মাসের তথ্য দেখতে চান।",
      },
      {
        title: "স্ট্যাটাস কার্ড দেখুন",
        desc: "মোট সংগৃহীত অর্থ, বকেয়া, খালি অ্যাপার্টমেন্ট ও সক্রিয় ভাড়াটের সংখ্যা এক নজরে দেখুন।",
      },
      {
        title: "বকেয়া তালিকা",
        desc: "পৃষ্ঠার নিচে বকেয়া ভাড়াটেদের তালিকা থেকে সরাসরি 'পরিশোধ' বাটনে ক্লিক করে পেমেন্ট নিন।",
      },
    ],
    tips: [
      "ড্যাশবোর্ড থেকেই বকেয়া পেমেন্ট রেকর্ড করা যায় — তালিকার ডানে 'পরিশোধ' বাটন আছে।",
      "বার চার্টে প্রতি মাসের সংগ্রহ দেখে ট্রেন্ড বুঝুন।",
    ],
  },
  {
    id: "buildings",
    icon: Building2,
    title: "বিল্ডিং ও অ্যাপার্টমেন্ট",
    subtitle: "সম্পত্তির কাঠামো তৈরি করুন",
    color: "text-blue-600",
    steps: [
      {
        title: "নতুন বিল্ডিং যোগ করুন",
        desc: "বিল্ডিং পৃষ্ঠায় 'নতুন বিল্ডিং' বাটনে ক্লিক করুন। নাম, ঠিকানা ও মোট তলা দিন।",
      },
      {
        title: "বিল্ডিংয়ে প্রবেশ করুন",
        desc: "বিল্ডিং কার্ডে ক্লিক করুন — ভেতরে সব অ্যাপার্টমেন্ট দেখবেন। খালি / ভর্তি ফিল্টার করুন।",
      },
      {
        title: "নতুন অ্যাপার্টমেন্ট যোগ করুন",
        desc: "বিল্ডিং ডিটেইলে 'নতুন অ্যাপার্টমেন্ট' বাটনে ক্লিক করুন। ইউনিট নম্বর ও তলা দিন।",
      },
      {
        title: "অ্যাপার্টমেন্টে প্রবেশ করুন",
        desc: "অ্যাপার্টমেন্ট কার্ডে ক্লিক করে ভাড়াটে যোগ করুন, ডিউ দেখুন, পেমেন্ট নিন।",
      },
    ],
    tips: [
      "একটি বিল্ডিংয়ে যত খুশি অ্যাপার্টমেন্ট যোগ করা যায়।",
      "ইউনিট নম্বর প্রতি বিল্ডিংয়ে ইউনিক হতে হবে।",
    ],
  },
  {
    id: "tenants",
    icon: Users,
    title: "ভাড়াটে ব্যবস্থাপনা",
    subtitle: "ভাড়াটে যোগ, চুক্তি ও লেজার",
    color: "text-emerald-600",
    steps: [
      {
        title: "ভাড়াটে যোগ করুন",
        desc: "যেকোনো খালি অ্যাপার্টমেন্টে গিয়ে 'ভাড়াটে যোগ করুন' বাটনে ক্লিক করুন। নাম, ফোন, NID, ঠিকানা ও প্রবেশের তারিখ দিন।",
      },
      {
        title: "চুক্তি তৈরি করুন",
        desc: "ভাড়াটের প্রোফাইলে 'নতুন চুক্তি' বাটনে ক্লিক করুন। শুরুর তারিখ ও মাসিক ভাড়ার পরিমাণ দিন — এটিই মাসিক ডিউর ভিত্তি।",
      },
      {
        title: "ভাড়াটের তথ্য সম্পাদনা",
        desc: "অ্যাপার্টমেন্ট পৃষ্ঠায় 'সম্পাদনা' বাটনে ক্লিক করে ভাড়াটের তথ্য আপডেট করুন।",
      },
      {
        title: "মুভ আউট করুন",
        desc: "'চলে গেছে' বাটনে ক্লিক করুন — ভাড়াটে নিষ্ক্রিয় হবে ও অ্যাপার্টমেন্ট খালি হবে।",
      },
      {
        title: "লেজার দেখুন",
        desc: "ভাড়াটের প্রোফাইলে নিচে লেজার টেবিলে প্রতি মাসের দেয়, পরিশোধিত ও বাকি দেখুন।",
      },
    ],
    tips: [
      "একজন ভাড়াটের একাধিক চুক্তি থাকতে পারে (ভাড়া পরিবর্তনের ক্ষেত্রে)।",
      "'ভাড়াটেদের তালিকা' মেনু থেকে সব ভাড়াটে একসাথে দেখা যায়।",
      "চলে যাওয়া ভাড়াটেদের 'চলে গেছে' ট্যাবে দেখা যায়।",
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "পেমেন্ট",
    subtitle: "একক ও বাল্ক পেমেন্ট রেকর্ড",
    color: "text-rose-600",
    steps: [
      {
        title: "মাসিক ডিউ তৈরি করুন",
        desc: "অ্যাপার্টমেন্ট পৃষ্ঠায় 'ডিউ তৈরি' বাটনে ক্লিক করুন। মাস ও বছর নির্বাচন করুন।",
      },
      {
        title: "একক পেমেন্ট রেকর্ড",
        desc: "অ্যাপার্টমেন্ট বা ভাড়াটের লেজার থেকে নির্দিষ্ট ডিউ সারিতে ক্লিক করুন, তারপর পেমেন্ট রেকর্ড করুন।",
      },
      {
        title: "বাল্ক পেমেন্ট (একসাথে একাধিক মাস)",
        desc: "পেমেন্ট মেনু → 'বাল্ক পেমেন্ট' ট্যাব। ভাড়াটে বেছে মোট পরিমাণ দিন — সিস্টেম পুরাতন ডিউ থেকে স্বয়ংক্রিয়ভাবে বিতরণ করবে।",
      },
      {
        title: "পেমেন্ট ইতিহাস দেখুন",
        desc: "পেমেন্ট মেনু → 'পেমেন্ট ইতিহাস' ট্যাবে ভাড়াটে নির্বাচন করুন — সব পেমেন্ট রেকর্ড দেখবেন।",
      },
    ],
    tips: [
      "আংশিক পেমেন্ট নেওয়া যায় — স্ট্যাটাস 'আংশিক' হবে।",
      "বাল্ক পেমেন্টে প্রিভিউ দেখে নিশ্চিত হন — কোন মাসে কত যাচ্ছে তা দেখাবে।",
      "পেমেন্ট রেকর্ডে নোট যোগ করা যায় (নগদ/bKash ইত্যাদি)।",
    ],
  },
  {
    id: "expenses",
    icon: Receipt,
    title: "খরচ ব্যবস্থাপনা",
    subtitle: "মালিকের খরচ ও ভাড়াটে-চার্জ ট্র্যাক",
    color: "text-amber-600",
    steps: [
      {
        title: "খরচের ক্যাটাগরি তৈরি করুন",
        desc: "খরচ মেনু → 'ক্যাটাগরি' ট্যাব → 'নতুন ক্যাটাগরি' বাটন। ক্যাটাগরির নাম দিন।",
      },
      {
        title: "নতুন খরচ যোগ করুন",
        desc: "খরচ মেনু → 'খরচ' ট্যাব → 'নতুন খরচ' বাটন। বিবরণ, পরিমাণ, তারিখ ও ক্যাটাগরি দিন।",
      },
      {
        title: "ভাড়াটে-চার্জ করুন",
        desc: "খরচ তৈরির সময় 'ভাড়াটে চার্জ করুন' চালু করুন এবং কোন অ্যাপার্টমেন্টের জন্য তা নির্ধারণ করুন।",
      },
    ],
    tips: [
      "ডিফল্ট ক্যাটাগরি ডিলিট করা যায় না।",
      "বিল্ডিং-লেভেল খরচ নির্দিষ্ট বিল্ডিংয়ের সাথে যুক্ত করুন।",
    ],
  },
  {
    id: "reports",
    icon: BarChart3,
    title: "রিপোর্ট",
    subtitle: "বকেয়া, সংগ্রহ ও বার্ষিক হিসাব",
    color: "text-indigo-600",
    steps: [
      {
        title: "বকেয়া রিপোর্ট",
        desc: "সব বকেয়া ভাড়াটের তালিকা দেখুন — কত দিন ধরে বকেয়া, কতটুকু বাকি।",
      },
      {
        title: "মাসিক সংগ্রহ",
        desc: "একটি বছরের প্রতি মাসে কত টাকা সংগৃহীত হয়েছে তার তালিকা দেখুন।",
      },
      {
        title: "বার্ষিক সারসংক্ষেপ",
        desc: "মোট সংগ্রহ, মোট খরচ, নিট লাভ ও বকেয়া — বছরের সামগ্রিক চিত্র দেখুন।",
      },
      {
        title: "পেমেন্ট ইতিহাস",
        desc: "নির্দিষ্ট ভাড়াটে বেছে তার সব পেমেন্ট রেকর্ড দেখুন ও প্রিন্ট করুন।",
      },
    ],
    tips: [
      "যেকোনো রিপোর্ট 'প্রিন্ট করুন' বাটনে ক্লিক করে প্রিন্ট বা PDF করা যায়।",
    ],
  },
];

const QUICK_TIPS = [
  {
    icon: Zap,
    text: "ভাড়াটের প্রোফাইলে গিয়ে 'বাল্ক ভাড়া' বাটনে ক্লিক করলে একসাথে সব পুরাতন বকেয়া পরিশোধ করা যায়।",
  },
  {
    icon: Lightbulb,
    text: "ড্যাশবোর্ডের বকেয়া তালিকা থেকেই সরাসরি পেমেন্ট নিতে পারবেন — আলাদা পেজে যেতে হবে না।",
  },
  {
    icon: Lightbulb,
    text: "সাইডবারে থিম বাটনে ক্লিক করে লাইট/ডার্ক/সিস্টেম থিম পরিবর্তন করুন।",
  },
  {
    icon: Zap,
    text: "ভাড়াটের লেজারে কোনো মাসের সারিতে ক্লিক করলে সেই মাসের পেমেন্ট বিস্তারিত দেখা যায়।",
  },
  {
    icon: Lightbulb,
    text: "বিল্ডিং পৃষ্ঠায় ফিল্টার ট্যাব ব্যবহার করে খালি বা ভর্তি অ্যাপার্টমেন্ট আলাদা দেখুন।",
  },
];

/* ─────────────────────────────────── sub-components ── */

function FlowChart({
  activeStep,
  setActiveStep,
}: {
  activeStep: number | null;
  setActiveStep: (id: number | null) => void;
}) {
  return (
    <div className="relative">
      {/* Mobile: vertical stack */}
      <div className="flex flex-col gap-2 md:hidden">
        {FLOW_STEPS.map((step, i) => {
          const Icon = step.icon;
          const active = activeStep === step.id;
          return (
            <div key={step.id}>
              <Button
                variant="ghost"
                onClick={() => setActiveStep(active ? null : step.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left h-auto justify-start",
                  active
                    ? `${step.bgColor} ${step.borderColor} shadow-md`
                    : "bg-surface border-border hover:border-primary/30",
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    step.bgColor,
                  )}
                >
                  <Icon size={18} className={step.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    <span
                      className={cn("mr-1.5 text-xs font-bold", step.color)}
                    >
                      {step.id}.
                    </span>
                    {step.label}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {step.sublabel}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={cn(
                    "shrink-0 text-text-muted transition-transform",
                    active && "rotate-180",
                  )}
                />
              </Button>
              {active && (
                <div
                  className={cn(
                    "ml-4 mt-1 mb-1 p-3 rounded-lg border",
                    step.bgColor,
                    step.borderColor,
                  )}
                >
                  <StepDetail step={step} />
                </div>
              )}
              {i < FLOW_STEPS.length - 1 && (
                <div className="flex items-center justify-center h-5">
                  <div className="w-0.5 h-full bg-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: horizontal flow */}
      <div className="hidden md:block">
        {/* Outer wrapper clips horizontal scroll but NOT vertical, so shadows/rings aren't cut */}
        <div className="overflow-x-auto">
          <div className="flex items-center gap-1 py-3 px-2 min-w-max">
            {FLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              const active = activeStep === step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveStep(active ? null : step.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all w-[6.5rem] shrink-0 h-auto",
                      active
                        ? `${step.bgColor} ${step.borderColor} shadow-md ring-2 ring-offset-2 ring-offset-background`
                        : "bg-surface border-border hover:border-primary/40 hover:shadow-md",
                    )}
                    style={
                      active
                        ? {
                            ["--tw-ring-color" as string]:
                              "var(--color-primary, #0D4A38)",
                          }
                        : undefined
                    }
                  >
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                        active ? "bg-white/60" : "bg-neutral-bg",
                      )}
                    >
                      <Icon size={20} className={step.color} />
                    </div>
                    <div className="text-center">
                      <p className={cn("text-xs font-bold mb-0.5", step.color)}>
                        {step.id}
                      </p>
                      <p className="text-xs font-semibold text-text-primary leading-tight">
                        {step.label}
                      </p>
                      <p className="text-[10px] text-text-secondary mt-0.5 leading-tight">
                        {step.sublabel}
                      </p>
                    </div>
                  </Button>

                  {i < FLOW_STEPS.length - 1 && (
                    <div className="flex items-center mx-0.5 shrink-0">
                      <div className="w-3 h-px bg-border" />
                      <ChevronRight size={13} className="text-text-muted" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel below flowchart */}
        {activeStep && (
          <div className="mt-2">
            {FLOW_STEPS.filter((s) => s.id === activeStep).map((step) => (
              <div
                key={step.id}
                className={cn(
                  "p-5 rounded-2xl border-2",
                  step.bgColor,
                  step.borderColor,
                )}
              >
                <StepDetail step={step} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepDetail({ step }: { step: FlowStep }) {
  const details: Record<
    number,
    { what: string; how: string[]; next?: string }
  > = {
    1: {
      what: "RentFlow ব্যবহার শুরু করতে প্রথমে একটি অ্যাকাউন্ট তৈরি করুন।",
      how: [
        "/register পেজে যান",
        "নাম, ইমেইল ও পাসওয়ার্ড দিন",
        "'নিবন্ধন করুন' বাটনে ক্লিক করুন",
        "সফল হলে স্বয়ংক্রিয়ভাবে ড্যাশবোর্ডে চলে যাবেন",
      ],
      next: "এখন বিল্ডিং যোগ করুন",
    },
    2: {
      what: "আপনার বাড়ি বা ভবন সিস্টেমে যোগ করুন। একটি অ্যাকাউন্টে অনেকগুলো বিল্ডিং থাকতে পারে।",
      how: [
        "সাইডবারে 'বিল্ডিং' মেনুতে যান",
        "'নতুন বিল্ডিং' বাটনে ক্লিক করুন",
        "বিল্ডিংয়ের নাম, ঠিকানা ও মোট তলা দিন",
        "'সংরক্ষণ করুন' বাটনে ক্লিক করুন",
      ],
      next: "এখন অ্যাপার্টমেন্ট যোগ করুন",
    },
    3: {
      what: "প্রতিটি বিল্ডিংয়ের অধীনে অ্যাপার্টমেন্ট বা ফ্ল্যাট তৈরি করুন।",
      how: [
        "বিল্ডিং কার্ডে ক্লিক করে ভেতরে যান",
        "'নতুন অ্যাপার্টমেন্ট' বাটনে ক্লিক করুন",
        "ইউনিট নম্বর (যেমন: A101) ও তলা দিন",
        "সংরক্ষণ করুন — স্ট্যাটাস 'খালি' হবে",
      ],
      next: "এখন ভাড়াটে যোগ করুন",
    },
    4: {
      what: "খালি অ্যাপার্টমেন্টে ভাড়াটের তথ্য নথিভুক্ত করুন।",
      how: [
        "অ্যাপার্টমেন্ট কার্ডে ক্লিক করুন",
        "'ভাড়াটে যোগ করুন' বাটনে ক্লিক করুন",
        "নাম, ফোন, NID, ঠিকানা, সদস্য সংখ্যা ও প্রবেশের তারিখ দিন",
        "সংরক্ষণ করলে অ্যাপার্টমেন্ট 'ভর্তি' হবে",
      ],
      next: "এখন চুক্তি তৈরি করুন",
    },
    5: {
      what: "চুক্তিতে মাসিক ভাড়ার পরিমাণ নির্ধারণ করুন — এটি মাসিক ডিউর ভিত্তি।",
      how: [
        "ভাড়াটের প্রোফাইলে যান (অ্যাপার্টমেন্ট পৃষ্ঠা বা ভাড়াটে তালিকা থেকে)",
        "'নতুন চুক্তি' বাটনে ক্লিক করুন",
        "চুক্তির শুরুর তারিখ ও মাসিক ভাড়া লিখুন",
        "সংরক্ষণ করুন",
      ],
      next: "এখন মাসিক ডিউ তৈরি করুন",
    },
    6: {
      what: "প্রতি মাসে ভাড়াটের জন্য একটি ডিউ তৈরি করুন — এটি পেমেন্টের ভিত্তি।",
      how: [
        "অ্যাপার্টমেন্ট পৃষ্ঠায় যান",
        "মাসিক ডিউ বিভাগে 'ডিউ তৈরি' বাটনে ক্লিক করুন",
        "মাস ও বছর নির্বাচন করুন",
        "সংরক্ষণ করুন — স্ট্যাটাস 'বেকায়া' হবে",
      ],
      next: "এখন পেমেন্ট রেকর্ড করুন",
    },
    7: {
      what: "ভাড়াটে পেমেন্ট দিলে রেকর্ড করুন — আংশিক বা পূর্ণ যেকোনো পরিমাণে।",
      how: [
        "অ্যাপার্টমেন্ট বা ভাড়াটে পৃষ্ঠায় ডিউ সারিতে ক্লিক করুন",
        "'পেমেন্ট' বাটনে ক্লিক করুন",
        "পরিমাণ, তারিখ ও ঐচ্ছিক নোট দিন",
        "সংরক্ষণ করুন — ডিউর স্ট্যাটাস আপডেট হবে",
      ],
    },
  };

  const detail = details[step.id];
  if (!detail) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-primary font-medium">{detail.what}</p>
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
          কিভাবে করবেন:
        </p>
        <ol className="space-y-1">
          {detail.how.map((h, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-text-primary"
            >
              <span
                className={cn(
                  "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5",
                  step.color.replace("text-", "bg-"),
                )}
              >
                {i + 1}
              </span>
              {h}
            </li>
          ))}
        </ol>
      </div>
      {detail.next && (
        <div className="flex items-center gap-1.5 text-xs text-text-secondary pt-1">
          <ChevronRight size={12} className={step.color} />
          <span className="font-medium">পরবর্তী ধাপ:</span>
          <span>{detail.next}</span>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ feature }: { feature: FeatureSection }) {
  const [open, setOpen] = useState(false);
  const Icon = feature.icon;

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-neutral-bg h-auto justify-start rounded-none"
      >
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-neutral-bg",
          )}
        >
          <Icon size={22} className={feature.color} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary">{feature.title}</h3>
          <p className="text-sm text-text-secondary mt-0.5 truncate">
            {feature.subtitle}
          </p>
        </div>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </Button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {/* Steps */}
          <div className="space-y-3">
            {feature.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className={cn(
                    "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5",
                    feature.color.replace("text-", "bg-"),
                  )}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {step.title}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {feature.tips && feature.tips.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Lightbulb size={13} />
                দরকারী টিপস
              </p>
              {feature.tips.map((tip, i) => (
                <p
                  key={i}
                  className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2"
                >
                  <CheckCircle2
                    size={14}
                    className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
                  />
                  {tip}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────── main component ── */

export default function UserManualPage() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0D4A38] px-8 py-10 text-white">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-sm font-medium text-white/70 uppercase tracking-wider">
              ব্যবহারকারী গাইড
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            RentFlow শিখুন সহজে
          </h1>
          <p className="text-white/70 text-base max-w-xl leading-relaxed">
            বিল্ডিং যোগ থেকে শুরু করে পেমেন্ট রেকর্ড পর্যন্ত — এই গাইডে সব কিছু
            ধাপে ধাপে দেখানো হয়েছে। নিচের প্রবাহ চিত্রের যেকোনো ধাপে ক্লিক করুন
            বিস্তারিত জানতে।
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { label: "মোট ফিচার", value: "৭টি" },
              { label: "ধাপে ধাপে গাইড", value: "৬টি বিভাগ" },
              { label: "দরকারী টিপস", value: "১০+" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 rounded-xl px-4 py-2 text-center"
              >
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Setup Flow ── */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              ১
            </span>
            শুরু করার প্রবাহ
          </h2>
          <p className="text-sm text-text-secondary mt-1.5">
            প্রথমবার ব্যবহার করলে এই ৭টি ধাপ অনুসরণ করুন। যেকোনো ধাপে ক্লিক করুন
            বিস্তারিত দেখতে।
          </p>
        </div>
        <FlowChart activeStep={activeStep} setActiveStep={setActiveStep} />
      </section>

      {/* ── Data hierarchy visual ── */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              ২
            </span>
            তথ্যের কাঠামো
          </h2>
          <p className="text-sm text-text-secondary mt-1.5">
            RentFlow-এ তথ্য এই ক্রমে সংগঠিত — উপর থেকে নিচে।
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 overflow-x-auto">
          <div className="flex flex-col items-center gap-0 min-w-[280px]">
            {[
              {
                icon: Building2,
                label: "বিল্ডিং",
                desc: "সর্বোচ্চ স্তর",
                color: "bg-blue-500",
                relation: "একটিতে অনেক অ্যাপার্টমেন্ট",
              },
              {
                icon: DoorOpen,
                label: "অ্যাপার্টমেন্ট",
                desc: "ইউনিট / ফ্ল্যাট",
                color: "bg-cyan-500",
                relation: "একটিতে একজন সক্রিয় ভাড়াটে",
              },
              {
                icon: Users,
                label: "ভাড়াটে",
                desc: "বাসিন্দার তথ্য",
                color: "bg-emerald-500",
                relation: "একটিতে অনেক চুক্তি",
              },
              {
                icon: FileText,
                label: "চুক্তি",
                desc: "ভাড়ার পরিমাণ ও মেয়াদ",
                color: "bg-amber-500",
                relation: "একটিতে অনেক মাসিক ডিউ",
              },
              {
                icon: Receipt,
                label: "মাসিক ডিউ",
                desc: "প্রতি মাসের দেয় পরিমাণ",
                color: "bg-orange-500",
                relation: "একটিতে অনেক পেমেন্ট রেকর্ড",
              },
              {
                icon: CreditCard,
                label: "পেমেন্ট রেকর্ড",
                desc: "সংগৃহীত অর্থের হিসাব",
                color: "bg-rose-500",
                relation: "",
              },
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center w-full"
                >
                  <div className="flex items-center gap-4 w-full max-w-sm">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        item.color,
                      )}
                    >
                      <Icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">
                        {item.label}
                      </p>
                      <p className="text-xs text-text-secondary">{item.desc}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex flex-col items-center my-1 ml-5">
                      <div className="w-px h-4 bg-border" />
                      <p className="text-[10px] text-text-muted italic">
                        {item.relation}
                      </p>
                      <div className="w-px h-2 bg-border" />
                      <ChevronDown size={12} className="text-text-muted" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Feature sections ── */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              ৩
            </span>
            ফিচার ভিত্তিক গাইড
          </h2>
          <p className="text-sm text-text-secondary mt-1.5">
            প্রতিটি বিভাগে ক্লিক করুন বিস্তারিত ধাপ ও টিপস দেখতে।
          </p>
        </div>
        <div className="space-y-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      </section>

      {/* ── Quick tips ── */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              ৪
            </span>
            দ্রুত টিপস
          </h2>
          <p className="text-sm text-text-secondary mt-1.5">
            অভিজ্ঞ ব্যবহারকারীদের পছন্দের শর্টকাট ও কৌশল।
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_TIPS.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <div
                key={i}
                className="bg-surface rounded-xl border border-border p-4 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon
                    size={15}
                    className="text-amber-600 dark:text-amber-400"
                  />
                </div>
                <p className="text-sm text-text-primary leading-relaxed">
                  {tip.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Status legend ── */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              ৫
            </span>
            স্ট্যাটাস বোঝার গাইড
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface rounded-2xl border border-border p-5">
            <p className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <DoorOpen size={15} />
              অ্যাপার্টমেন্ট স্ট্যাটাস
            </p>
            <div className="space-y-2.5">
              {[
                {
                  label: "খালি",
                  color: "bg-success text-white",
                  desc: "কোনো ভাড়াটে নেই — যোগ করা যাবে",
                },
                {
                  label: "ভর্তি",
                  color: "bg-warning text-white",
                  desc: "সক্রিয় ভাড়াটে আছে",
                },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                      s.color,
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="text-sm text-text-secondary">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-5">
            <p className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Receipt size={15} />
              মাসিক ডিউ স্ট্যাটাস
            </p>
            <div className="space-y-2.5">
              {[
                {
                  label: "বেকায়া",
                  color: "bg-danger text-white",
                  desc: "কোনো পেমেন্ট হয়নি",
                },
                {
                  label: "আংশিক",
                  color: "bg-warning text-white",
                  desc: "আংশিক পেমেন্ট হয়েছে",
                },
                {
                  label: "পরিশোধিত",
                  color: "bg-success text-white",
                  desc: "সম্পূর্ণ পেমেন্ট হয়েছে",
                },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                      s.color,
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="text-sm text-text-secondary">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Help footer ── */}
      <div className="bg-surface rounded-2xl border border-border p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <HelpCircle size={20} className="text-primary" />
        </div>
        <div>
          <p className="font-semibold text-text-primary">আরও সাহায্য দরকার?</p>
          <p className="text-sm text-text-secondary mt-1">
            কোনো ফিচার নিয়ে প্রশ্ন থাকলে প্রথমে সংশ্লিষ্ট পৃষ্ঠায় যান। প্রতিটি
            খালি অবস্থায় বর্ণনামূলক বার্তা দেখাবে। পেমেন্টে সমস্যা হলে 'বাল্ক
            পেমেন্ট' প্রিভিউ দেখে নিশ্চিত হন।
          </p>
        </div>
      </div>
    </div>
  );
}
