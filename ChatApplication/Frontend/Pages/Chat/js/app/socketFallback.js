import { getLocalMessages, saveMessages, updateMessageSeen } from "../data/db.js";
import { appendMessageToUI } from "../ui/ui.js";
import api from './axios.js';

let messagePolling = false;
let seenPolling = false;
const BASE_URL = "http://localhost:8000";
let msgAbort = null;
let seenAbort = null;
let selectedChatObj;
let selectedChatId;

let currentUser = JSON.parse(window.localStorage.getItem("user"));

export async function startMessageLongPolling(allConversations) {
  if (messagePolling) return;
  messagePolling = true;

  selectedChatId = window.localStorage.getItem("selectedChatId");
  selectedChatObj = allConversations.find(
    (convo) => convo._id.toString() === selectedChatId
  );

  if (!selectedChatObj) {
    console.warn("⚠️ No selected chat found for polling");
    messagePolling = false;
    return;
  }

  while (messagePolling) {
    try {
      const newMsgs = await longPollSelectedChat(selectedChatObj);

      if (newMsgs.length > 0) {
        const participants = selectedChatObj.participants;

        const existing = await getLocalMessages(selectedChatObj._id);
        const existingIds = new Set(existing.map(m => String(m._id)));

        const fresh = newMsgs.filter(m =>
          !existingIds.has(String(m._id)) &&
          String(m.sender) !== String(currentUser._id)
        );

        if (!fresh.length) continue;

        fresh.forEach(msg => appendMessageToUI(msg, currentUser, participants));
        await saveMessages(fresh);

        const unseenIds = fresh
          .filter(m => !m.seen?.some(
            s => String(s.userId) === String(currentUser._id)
          ))
          .map(m => m._id);

        if (unseenIds.length > 0) {
          await api.post(
            `${BASE_URL}/api/v1/messages/seen`,
            {
              conversationId: selectedChatObj._id,
              messageIds: unseenIds
            },
            { withCredentials: true }
          );

          for (const id of unseenIds) {
            await updateMessageSeen(
              id,
              currentUser._id,
              currentUser.userName,
              new Date()
            );
          }
        }
      }

    } catch (err) {
      if (err.name !== "CanceledError") {
        console.error("Long poll error:", err.message);
        await wait(1500);
      }
    }
  }
}

export async function startSeenPolling(allConversations) {
  if (seenPolling) return;
  seenPolling = true;

  const selectedChatId = localStorage.getItem("selectedChatId");
  const selectedChatObj = allConversations.find(
    c => String(c._id) === String(selectedChatId)
  );

  if (!selectedChatObj) {
    console.warn("No selected chat for seen polling");
    seenPolling = false;
    return;
  }

  while (seenPolling) {
    try {
      const seenPayload = await longPollSelectedSeen(selectedChatObj);

      if (!seenPayload || !seenPayload.messageIds?.length) continue;

      const { messageIds, userId, name, seenAt } = seenPayload;

      for (const msgId of messageIds) {
        await updateMessageSeen(
          msgId,
          userId,
          name,
          new Date(seenAt)
        );
      }

      for (const messageId of messageIds) {
        let msgEl = document.querySelector(`.message-wrapper[data-id="${messageId}"]`);
        if (msgEl) {
          let seenList = JSON.parse(msgEl.getAttribute("data-seen") || "[]");

          const exists = seenList.find(u => String(u.userId) === String(userId));

          if (!exists) {
            seenList.push({ userId, name, seenAt });

            if (seenList.length == selectedChatObj.participants.length) {
              const icon = msgEl.querySelector(".msg-status-icon");
              if (icon) icon.innerHTML = "✔✔";
            }

            msgEl.setAttribute("data-seen", JSON.stringify(seenList));
            await updateMessageSeen(messageId, userId, name, seenAt);
          }
        }
      }

    } catch (err) {
      if (err.name !== "CanceledError") {
        console.error("SEEN poll error:", err.message);
        await wait(1500);
      }
    }
  }
}

async function longPollSelectedSeen(selectedChat) {
  seenAbort = new AbortController();

  const res = await api.get(
    `${BASE_URL}/api/v1/poll/seen-poll`,
    {
      params: { conversationId: selectedChat._id },
      withCredentials: true,
      signal: seenAbort.signal
    }
  );

  return res.data.seen || null;
}

async function longPollSelectedChat(selectedChat) {
  msgAbort = new AbortController();

  const local = await getLocalMessages(selectedChat._id);
  const last = local.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )[local.length - 1];

  const after = last ? last.createdAt : "1970-01-01";

  const res = await api.get(
    `${BASE_URL}/api/v1/poll/messages`,
    {
      params: {
        conversationId: selectedChat._id,
        after
      },
      withCredentials: true,
      signal: msgAbort.signal
    }
  );

  return res.data.messages || [];
}

export function stopAllPolling() {
  messagePolling = false;
  seenPolling = false;

  if (msgAbort) {
    msgAbort.abort();
    msgAbort = null;
  }

  if (seenAbort) {
    seenAbort.abort();
    seenAbort = null;
  }

  console.log("🛑 Stopped all polling");
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
