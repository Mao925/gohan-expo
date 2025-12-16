'use client';

import { FormEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

type ChatInputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSending?: boolean;
  disabled?: boolean;
};

export function ChatInputBar({ value, onChange, onSubmit, isSending = false, disabled = false }: ChatInputBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending || disabled) return;
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (isSending || disabled) return;
      onSubmit();
    }
  };

  const isInputDisabled = isSending || disabled;
  const isButtonDisabled = isInputDisabled || value.trim().length === 0;

  return (
    <div className="sticky bottom-0 left-0 right-0 border-t border-slate-200 bg-white/90 px-4 py-3 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Textarea
          className="flex-1 min-h-[56px] resize-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力"
          rows={2}
          disabled={isInputDisabled}
        />
        <Button type="submit" size="sm" disabled={isButtonDisabled}>
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              送信中
            </>
          ) : (
            '送信'
          )}
        </Button>
      </form>
    </div>
  );
}
