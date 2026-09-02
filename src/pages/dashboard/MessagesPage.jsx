import { useEffect, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { IconMessage } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";

const STAFF_ROLES = ["directeur", "secretaire", "enseignant"];

export default function MessagesPage() {
  const { profile } = useAuth();
  if (STAFF_ROLES.includes(profile?.role)) return <StaffInbox />;
  return <ParentThread />;
}

/* ---------- Vue parent : un seul fil avec l'école ---------- */

function ParentThread() {
  const { profile, firebaseUser } = useAuth();
  const schoolId = profile?.schoolId;
  const conversationId = firebaseUser?.uid;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!schoolId || !conversationId) return;
    const q = query(
      collection(db, "schools", schoolId, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [schoolId, conversationId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await setDoc(
        doc(db, "schools", schoolId, "conversations", conversationId),
        {
          parentUid: conversationId,
          parentName: profile?.name || "Parent",
          lastMessage: text.trim(),
          lastMessageAt: serverTimestamp(),
        },
        { merge: true }
      );
      await addDoc(collection(db, "schools", schoolId, "conversations", conversationId, "messages"), {
        senderUid: conversationId,
        senderName: profile?.name || "Parent",
        senderRole: "parent",
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface flex flex-col h-[65vh]">
      <div className="px-6 py-4 border-b border-line">
        <h2 className="font-display text-base text-ink">Échanger avec l'établissement</h2>
      </div>
      <MessageList messages={messages} selfRole="parent" />
      <MessageComposer text={text} setText={setText} onSend={handleSend} sending={sending} />
    </div>
  );
}

/* ---------- Vue personnel : liste des conversations ---------- */

function StaffInbox() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "conversations"), orderBy("lastMessageAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setConversations(list);
      if (!selectedId && list.length > 0) setSelectedId(list[0].id);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !selectedId) return;
    const q = query(
      collection(db, "schools", schoolId, "conversations", selectedId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [schoolId, selectedId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !selectedId) return;
    setSending(true);
    try {
      await setDoc(
        doc(db, "schools", schoolId, "conversations", selectedId),
        { lastMessage: text.trim(), lastMessageAt: serverTimestamp() },
        { merge: true }
      );
      await addDoc(collection(db, "schools", schoolId, "conversations", selectedId, "messages"), {
        senderUid: "staff",
        senderName: profile?.name || "École",
        senderRole: profile?.role || "staff",
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={IconMessage}
          title="Aucune conversation pour le moment"
          text="Les messages envoyés par les parents apparaîtront ici."
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface flex flex-col sm:flex-row h-[65vh] overflow-hidden">
      <div className="sm:w-64 shrink-0 border-b sm:border-b-0 sm:border-r border-line overflow-y-auto">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`w-full text-left px-4 py-3 border-b border-line ${selectedId === c.id ? "bg-indigo-50" : ""}`}
          >
            <p className="text-sm font-medium text-ink truncate">{c.parentName}</p>
            <p className="text-xs text-ink-soft truncate mt-0.5">{c.lastMessage}</p>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <MessageList messages={messages} selfRole="staff" />
        <MessageComposer text={text} setText={setText} onSend={handleSend} sending={sending} />
      </div>
    </div>
  );
}

/* ---------- Composants partagés ---------- */

function MessageList({ messages, selfRole }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      {messages.length === 0 && (
        <p className="text-sm text-ink-soft text-center mt-6">Aucun message pour le moment.</p>
      )}
      {messages.map((m) => {
        const isSelf = m.senderRole === selfRole || (selfRole === "staff" && m.senderRole !== "parent");
        return (
          <div key={m.id} className={`max-w-[80%] rounded-lg px-3.5 py-2.5 ${isSelf ? "self-end bg-indigo-500 text-white" : "self-start bg-surface-tint text-ink"}`}>
            <p className="text-sm">{m.text}</p>
            <p className={`text-[11px] mt-1 ${isSelf ? "text-indigo-100" : "text-ink-soft"}`}>{m.senderName}</p>
          </div>
        );
      })}
    </div>
  );
}

function MessageComposer({ text, setText, onSend, sending }) {
  return (
    <form onSubmit={onSend} className="border-t border-line p-3 flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Écrire un message..."
        className="flex-1 rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-indigo-500"
      />
      <button
        type="submit"
        disabled={sending || !text.trim()}
        className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
      >
        Envoyer
      </button>
    </form>
  );
}
