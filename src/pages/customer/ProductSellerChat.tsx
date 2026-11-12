import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { CustomerProduct } from '../../types';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { money } from '../../components/shared/useCatalog';
import './product-seller-chat.css';

const questions = [
  'Hàng còn bao nhiêu kg?',
  'Độ chín hiện tại thế nào?',
  'Có thể giao khi nào?',
];
const maxMessageLength = 1000;

interface ChatState {
  draft: string;
  messages: { text: string; sentAt: number }[];
}

function readChat(key: string): ChatState {
  try {
    const saved = sessionStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {
    // The chat can still work in memory if browser storage is unavailable.
  }
  return { draft: '', messages: [] };
}

export function ProductSellerChat({ product, customerId }: {
  product: CustomerProduct;
  customerId: string;
}) {
  const storageKey = 'farmgo-product-chat:' + JSON.stringify([customerId, product.supplierId, product.id]);
  const [chat, setChat] = useState(() => readChat(storageKey));
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const noticeId = useId();

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(chat));
    } catch {
      // Keep the current conversation available in memory.
    }
  }, [chat, storageKey]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = overflow; };
  }, [open]);

  useEffect(() => {
    const panel = history.current;
    if (open && panel) panel.scrollTop = panel.scrollHeight;
  }, [open, chat.messages]);

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = chat.draft.trim();
    if (!text) return;
    const sentAt = Date.now();
    setChat(current => ({
      draft: '',
      messages: [...current.messages, { text, sentAt }],
    }));
    composer.current?.focus();
  }

  return (
    <>
      <button ref={trigger} type="button" className="seller-chat-trigger" aria-haspopup="dialog"
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 11.5a8 8 0 0 1-8 8H4l1.8-3.4A8 8 0 1 1 20 11.5Z" />
          <path d="M8 10h8M8 14h5" />
        </svg>
        Chat với người bán
      </button>

      <dialog ref={dialog} className="seller-chat-dialog" aria-labelledby={titleId} aria-describedby={noticeId}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus({ preventScroll: true });
        }}
        onClick={event => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}>
        <div className="seller-chat-shell">
          <header className="seller-chat-header">
            <div><span>Chat với người bán</span><h2 id={titleId}>{product.supplier.name}</h2></div>
            <button type="button" className="seller-chat-close" aria-label="Đóng chat" autoFocus
              onClick={() => dialog.current?.close()}>×</button>
          </header>

          <div className="seller-chat-product">
            <FruitPhoto id={product.commodityId} name={product.name} imageUrl={product.imageUrl} />
            <div>
              <strong>{product.name}</strong>
              <div>{money(product.publicPricePerKg)}/kg · {product.availableKg > 0
                ? 'Còn ' + product.availableKg.toLocaleString('vi-VN') + ' kg'
                : 'Hết hàng'}</div>
            </div>
          </div>

          <p id={noticeId} className="seller-chat-notice">Tin nhắn chưa được gửi tới nhà cung cấp.</p>
          <div className="seller-chat-history" ref={history} role="log" aria-label="Tin nhắn" tabIndex={0}>
            {chat.messages.map((message, index) => (
              <div className="seller-chat-message" key={message.sentAt + '-' + index}>
                <div>{message.text}</div>
                <time dateTime={new Date(message.sentAt).toISOString()}>
                  {new Date(message.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            ))}
          </div>
          <div className="seller-chat-questions" role="group" aria-label="Câu hỏi gợi ý">
            {questions.map(question => (
              <button type="button" key={question} onClick={() => {
                setChat(current => ({ ...current, draft: question }));
                composer.current?.focus();
              }}>{question}</button>
            ))}
          </div>
          <form className="seller-chat-composer" onSubmit={send}>
            <textarea ref={composer} aria-label="Tin nhắn cho người bán" placeholder="Nhập tin nhắn…" rows={2}
              maxLength={maxMessageLength} value={chat.draft}
              onChange={event => setChat(current => ({ ...current, draft: event.target.value }))}
              onKeyDown={event => {
                if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }} />
            <button type="submit" className="btn-primary" disabled={!chat.draft.trim()}>Gửi</button>
          </form>
        </div>
      </dialog>
    </>
  );
}
