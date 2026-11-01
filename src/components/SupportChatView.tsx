import { useEffect, useRef, useState } from 'react';
import { Headset, SendHorizonal } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { PageContainer, PageHeader } from './ui/app-form';

type Message = { id: number; from: 'user' | 'support'; text: string; at: string };

const STORAGE_KEY = 'localfix-support-chat';

function loadMessages(): Message[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Message[];
  } catch {
    // ignore corrupted storage
  }
  return [];
}

/** LocalFix customer-care chat: instant automated answers, stored in this browser. */
export function SupportChatView() {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(Date.now());

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ id: nextId.current++, from: 'support', text: t('support.greeting'), at: new Date().toISOString() }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const replyFor = (text: string): string => {
    const q = text.toLowerCase();
    if (/track|status|where|ট্র্যাক|স্ট্যাটাস|কোথায়/.test(q)) return t('support.replyTrack');
    if (/cancel|change|reschedul|বাতিল|পরিবর্তন/.test(q)) return t('support.replyChange');
    if (/pay|price|refund|money|পেমেন্ট|টাকা|দাম/.test(q)) return t('support.replyPayment');
    if (/agent|human|person|call|মানুষ|এজেন্ট|ফোন/.test(q)) return t('support.replyAgent');
    return t('support.replyDefault');
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((prev) => [...prev, { id: nextId.current++, from: 'user', text: clean, at: new Date().toISOString() }]);
    setDraft('');
    setTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, from: 'support', text: replyFor(clean), at: new Date().toISOString() },
      ]);
      setTyping(false);
      inputRef.current?.focus();
    }, 900);
  };

  const quickReplies = [t('support.qTrack'), t('support.qChange'), t('support.qPayment'), t('support.qAgent')];

  return (
    <PageContainer>
      <PageHeader title={t('support.title')} subtitle={t('support.subtitle')} backTo="/chats" />

      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="flex items-center gap-3 border-b border-neutral-100 bg-primary-600 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
            <Headset className="h-5 w-5" />
          </span>
          <div>
            <p className={`text-sm font-semibold text-white ${bengali ? 'font-bengali' : ''}`}>{t('chats.support')}</p>
            <p className={`text-xs text-primary-100 ${bengali ? 'font-bengali' : ''}`}>{t('support.online')}</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 px-4 py-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.from === 'user'
                    ? 'rounded-br-md bg-primary-600 text-white'
                    : 'rounded-bl-md bg-white text-neutral-800 ring-1 ring-neutral-200'
                } ${bengali ? 'font-bengali' : ''}`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-neutral-400 ring-1 ring-neutral-200">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 border-t border-neutral-100 bg-white px-4 py-3">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className={`rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 ${bengali ? 'font-bengali' : ''}`}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="flex items-center gap-2 border-t border-neutral-100 bg-white px-3 py-3"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('support.placeholder')}
            autoFocus
            className={`flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 ${bengali ? 'font-bengali' : ''}`}
          />
          <button
            type="submit"
            aria-label={t('support.send')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition-transform active:scale-95"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </form>
      </div>
    </PageContainer>
  );
}
