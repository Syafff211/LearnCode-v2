"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { TutorChat } from "@/components/ai/tutor-chat";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function TutorDrawer({
  lessonId,
  lessonTitle,
  defaultLanguage,
  initialUsed,
  dailyLimit,
  aiConfigured,
}: {
  lessonId: string;
  lessonTitle: string;
  defaultLanguage: "id" | "en";
  initialUsed: number;
  dailyLimit: number;
  aiConfigured: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Sparkles aria-hidden="true" />
          AI Tutor
        </Button>
      </DialogTrigger>
      <DialogContent
        className="left-auto right-0 top-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-r-0 p-0 sm:w-[26rem] lg:w-[30rem]"
        hideClose
      >
        <DialogTitle className="sr-only">AI Tutor untuk lesson {lessonTitle}</DialogTitle>
        <div className="h-full pt-1">
          <TutorChat
            embedded
            fixedLesson={{ id: lessonId, title: lessonTitle }}
            defaultLanguage={defaultLanguage}
            initialUsed={initialUsed}
            dailyLimit={dailyLimit}
            aiConfigured={aiConfigured}
            autoFocus
            onClose={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
