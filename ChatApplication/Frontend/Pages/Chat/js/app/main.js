import {
    chatContainer,
    messageInput,
    sendBtn,
    renderChatList,
    renderMessages,
    appendMessageToUI,
    updateChatHeader,
    scrollToBottom,
    messageContainer,
    prependMessagesToUI,
    syncReadReceipts
} from '../ui/ui.js';

import {
    getLocalConversations,
    saveConversations,
    getLocalMessages,
    saveMessages,
    deleteMessage,
    updateSingleConversation,
    updateMessageSeen
} from '../data/db.js';
import {
    targetUserProfileCleanUp,
    targetUserProfile,
} from '../features/profile.js';
import { refreshCurrentSeenModal } from '../features/seen.js';
import { openGroupModal } from '../features/createGroup.js';
import api from './axios.js';
import { startMessageLongPolling, startSeenPolling, stopAllPolling } from './socketFallback.js';


// GLOBAL STATE & SOCKET SETUP

export const currentUser = JSON.parse(window.localStorage.getItem("user"));
export const BASE_URL = "http://localhost:8000";

export const socket = io(BASE_URL, {
    auth: { user: currentUser },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
});

window.socket=socket;

const chatHeader = document.querySelector(".chat-header");
const profileBtn = document.querySelector(".profile-btn");

export let allConversations = [];
export let selectedChatId = null;
export let selecteChatObj = null;
export const notifyMap = new Map();


let hasMoreMessages = true;
let isLoadingHistory = false;
let isSyncing = false;


//  SAFE SYNC WRAPPER

async function safeGetAllConversations() {
    if (isSyncing) return;
    isSyncing = true;

    await getAllConversations();
    isSyncing = false;
}

// MAIN APP BOOTSTRAP (DOMContentLoaded)

document.addEventListener("DOMContentLoaded", async () => {
    if (!currentUser) return console.error("User not found in localStorage");

    console.log("Logged in as:", currentUser.userName);
    document.querySelector(".profile-btn .profile-image-btn").src = currentUser.photo ?? `default-avtar.png`;
    selectedChatId = null;

    const lastChatId = window.localStorage.getItem("selectedChatId");

    await safeGetAllConversations();
    // console.log(allConversations);
    
    if (lastChatId) {
        const foundChat = allConversations.find(c => c._id === lastChatId);

        if (foundChat) {
            selectedChatId = lastChatId;
            selecteChatObj = foundChat;
            targetUserProfileCleanUp();
            document.querySelector(".no-chat-placeholder").style.display = "none";
            document.querySelector(".column-active-chat").style.display = "flex";
            const isMobile = window.matchMedia("(max-width: 425px)").matches;

            if (isMobile) {
                document.querySelector(".column-active-chat").style.display = "flex";
                document.querySelector(".column-chat-list ").style.display = "none";
            }
            updateChatHeader(selecteChatObj, currentUser);
            renderChatList(allConversations, notifyMap, selecteChatObj, currentUser);

            await loadMessages(lastChatId);

            socket.emit("JOIN_CONVERSATION", { conversationId: lastChatId });
        }
    }
});

// SOCKET CONNECTION EVENTS

socket.on("connect", async () => {
    console.log("Socket restored → stop polling");
    stopAllPolling();
    
    sendBtn.removeEventListener("click", handleSendMessagePolling);
    sendBtn.addEventListener("click", handleSendMessage);

    messageInput.removeEventListener("keypress", handleInputSendPolling );
    messageInput.addEventListener("keypress",handleInputSendSocket );

    console.log("✅ Connection restored! Starting Background Sync...");
    await safeGetAllConversations();

    if (!selectedChatId) return;
    socket.emit("JOIN_CONVERSATION", { conversationId: selectedChatId });
    const currentChat = allConversations.find(c => c._id === selectedChatId);
    if (!currentChat) return;
    selecteChatObj = currentChat;
    const localMsgs = await getLocalMessages(currentChat._id);

    const pendingMsgs = localMsgs.filter(m => m._id && m._id.startsWith("temp_"));

    if (pendingMsgs.length > 0) {
        console.log(`Resending ${pendingMsgs.length} pending messages...`);
        pendingMsgs.forEach(msg => emitMessageWithAck(msg));
    }

    const realLocalMsgs = localMsgs
        .filter(m => !m._id.toString().startsWith("temp_"))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const lastLocalMsg = realLocalMsgs[realLocalMsgs.length - 1];

    const serverUpdatedAt = currentChat.lastMessage?.updatedAt 
    || currentChat.lastMessage?.createdAt 
    || null;

    const localUpdatedAt = lastLocalMsg?.updatedAt 
        || lastLocalMsg?.createdAt 
        || null;

    // console.log("server:",serverUpdatedAt);
    // console.log("local:",localUpdatedAt);
    
    if (serverUpdatedAt && localUpdatedAt) {
        const serverTime = new Date(serverUpdatedAt).getTime();
        const localTime = new Date(localUpdatedAt).getTime();

        const DIFF_THRESHOLD = 1000;

        if (Math.abs(serverTime - localTime) > DIFF_THRESHOLD) {
            console.log(`Syncing active chat (Server is newer by time)...`);
            await loadMessages(currentChat._id);
        } else {
            console.log("Active chat is already up to date.");
        }
    } else if (serverUpdatedAt && !localUpdatedAt) {
        console.log("Syncing active chat (Local empty, server has data)...");
        await loadMessages(currentChat._id);
    }


    if (selecteChatObj?.participants?.length) {
        syncReadReceipts(currentChat._id);
    }

});

socket.on("connect_error", () => {
    console.log("Socket error → Polling fallback");

    sendBtn.removeEventListener("click", handleSendMessage);
    sendBtn.addEventListener("click", handleSendMessagePolling);

    messageInput.removeEventListener("keypress", handleInputSendSocket);
    messageInput.addEventListener("keypress", handleInputSendPolling);

    startMessageLongPolling(allConversations);
    startSeenPolling(allConversations);
});


socket.on("disconnect", () => {
    console.log("Socket disconnected → Polling fallback");

    sendBtn.removeEventListener("click", handleSendMessage);
    sendBtn.addEventListener("click", handleSendMessagePolling);

    messageInput.removeEventListener("keypress", handleInputSendSocket);
    messageInput.addEventListener("keypress", handleInputSendPolling);

    startSeenPolling(allConversations);
    startMessageLongPolling(allConversations);
});



// SOCKET MESSAGE EVENTS

socket.on("NEW_MESSAGE", ({ message }) => {
    
    const senderId = message.sender.toString();
    if (senderId === currentUser._id.toString()) return;
    
    const msgConvoId = String(message.conversationId);
    
    
    // console.log(message);
    
    const isChatOpen =
        selecteChatObj &&
        String(selecteChatObj._id) === String(message.conversationId);


    if (isChatOpen) {
        const chatObj = allConversations.find(c => c._id === message.conversationId);
        const participants = chatObj ? chatObj.participants : [];
        appendMessageToUI(message, currentUser, participants);
        socket.emit("MESSAGE_SEEN", { conversationId: message.conversationId, messageId: message._id });
    } else {
        console.log("new message");
        const currentCount = notifyMap.get(msgConvoId) || 0;
        const newCount = currentCount + 1;
        notifyMap.set(msgConvoId, newCount);

    }

    saveMessages([message]);
    updateConversationList(message.conversationId, message.text, message.createdAt, senderId);
});

socket.on("MESSAGE_SEEN", async ({ messageId, userId, name, seenAt }) => {
    let msgEl = document.querySelector(`.message-wrapper[data-id="${messageId}"]`);

    // console.log("frontend", msgEl);

    if (msgEl) {
        let seenList = JSON.parse(msgEl.getAttribute("data-seen") || "[]");

        const exists = seenList.find(u => String(u.userId) === String(userId));

        if (!exists) {
            seenList.push({ userId, name, seenAt });
            if (seenList.length == selecteChatObj.participants.length) {
                const icon = msgEl.querySelector(".msg-status-icon");
                if (icon) icon.innerHTML = "✔✔";
            }
            msgEl.setAttribute("data-seen", JSON.stringify(seenList));
            await updateMessageSeen(messageId, userId, name, seenAt);
            const modal = document.getElementById('seen-modal');
            if (modal && modal.style.display === "flex") {
                refreshCurrentSeenModal();
            }
        }
    }
});

socket.on("NEW_CONVERSATION_CREATED", (payload) => {
    console.log(payload);

    allConversations.unshift(payload);
    notifyMap.set(payload._id, 0);
    renderChatList(allConversations, notifyMap, selecteChatObj, currentUser);
})

// UI EVENT LISTENERS

chatContainer.addEventListener("click", (e) => handleOpenMessage(e));

sendBtn.addEventListener("click", handleSendMessage);

messageInput.addEventListener("keypress", handleInputSendSocket);



chatHeader.addEventListener("click", (e) => {
    // console.log(chatHeader);
    // console.log("inside chat header",selectedChatId);

    if (selecteChatObj?.name == "One-to-One") targetUserProfile(e, selecteChatObj)
    else openGroupModal(e, selecteChatObj);
});

profileBtn.addEventListener("click", e => targetUserProfile(e, currentUser));

if (messageContainer) {
    messageContainer.addEventListener("scroll", () => {
        if (messageContainer.scrollTop === 0 && hasMoreMessages) {
            fetchOlderMessages();
        }
    });
}



// CONVERSATION NETWORK FUNCTIONS

export const getAllConversations = async (conversationId) => {
    try {
        const localData = await getLocalConversations();
        if (localData.length > 0) {
            console.log(" Rendering from IndexedDB (Offline Cache)");
            allConversations = localData;
            allConversations.forEach(c => notifyMap.set(c._id, c.unreadCount || 0));
            renderChatList(allConversations, notifyMap, selecteChatObj, currentUser);
        }
    } catch (e) {
        console.error("IDB Read Error:", e);
    }

    try {
        const response = await api.get(`${BASE_URL}/api/v1/conversation`, { withCredentials: true });

        if (response.data && response.data.data) {
            const serverData = response.data.data;
            console.log("Network Data Received. Updating Cache.");
            allConversations = serverData;
            await saveConversations(serverData);
            allConversations.forEach(c => {
                notifyMap.set(c._id, c.unreadCount || 0);
            });
            // console.log(allConversations);

            if (conversationId) {
                const foundChat = allConversations.find(c => c._id === conversationId);
                if (foundChat) {
                    selecteChatObj = foundChat;
                    updateChatHeader(selecteChatObj, currentUser);
                    loadMessages(conversationId);
                }
            }

            renderChatList(allConversations, notifyMap, selecteChatObj, currentUser);
        }
    } catch (error) {
        console.error("Error fetching conversations:", error.response ? error.response.data : error.message);
    }
};

// MESSAGE LOAD + HISTORY

async function loadMessages(conversationId) {
    console.log(conversationId, "load");

    const chatObj = allConversations.find(c => c._id === conversationId);
    const participants = chatObj ? chatObj.participants : [];

    const isChatOpen = selecteChatObj && selecteChatObj._id === conversationId;
    if (isChatOpen) {
        hasMoreMessages = true;
        isLoadingHistory = false;
    }

    const localMsgs = await getLocalMessages(conversationId);

    if (localMsgs.length > 0 && isChatOpen) {
        // console.log("laod loacla",localMsgs);

        renderMessages(localMsgs, currentUser, participants);
    }
    try {
        const response = await api.get(`${BASE_URL}/api/v1/messages/${conversationId}?limit=20`, {
            withCredentials: true
        });

        let messages = response.data.data || [];

        const isStillSelected = selecteChatObj && selecteChatObj._id === conversationId;

        if (isStillSelected) {

            renderMessages(messages, currentUser, participants);


            socket.emit("MESSAGES_SEEN", { conversationId });
        }
        // console.log("network load", messages);


        if (messages.length > 0) await saveMessages(messages);

    } catch (error) {
        console.error("Error loading messages:", error.response ? error.response.data : error.message);
    }
}


async function fetchOlderMessages() {
    if (isLoadingHistory || !hasMoreMessages || !selectedChatId) return;

    const topMsg = messageContainer.firstElementChild;
    if (!topMsg) return;

    const lastTime = topMsg.getAttribute("data-time");
    if (!lastTime) return;

    isLoadingHistory = true;

    try {
        const response = await api.get(
            `${BASE_URL}/api/v1/messages/${selectedChatId}?limit=20&before=${lastTime}`,
            { withCredentials: true }
        );

        const olderMessages = response.data.data || [];

        if (olderMessages.length > 0) {
            prependMessagesToUI(olderMessages, currentUser, selecteChatObj.participants);
        } else {
            hasMoreMessages = false;
        }

        if (olderMessages.length < 20) hasMoreMessages = false;

    } catch (error) {
        console.error("History error:", error.response ? error.response.data : error.message);
    } finally {
        isLoadingHistory = false;
    }
}

// MESSAGE SEND (SOCKET + POLLING)


export const handleOpenMessage = async (e) => {
    console.log("opening messages");
    stopAllPolling();

    if (!socket?.connected) {
        startMessageLongPolling(allConversations);
    }

    targetUserProfileCleanUp();
    document.querySelector(".no-chat-placeholder").style.display = "none";
    document.querySelector(".column-active-chat").style.display = "flex";
    const isMobile = window.matchMedia("(max-width: 425px)").matches;

    if (isMobile) {
        document.querySelector(".column-active-chat").style.display = "flex";
        document.querySelector(".column-chat-list ").style.display = "none";
    }
    const item = e.target.closest(".chat-item");
    if (!item) return;
    // console.log(item);

    const convoId = item.getAttribute("data-id");
    if (selecteChatObj && selecteChatObj._id === convoId) return;

    selectedChatId = convoId;
    selecteChatObj = allConversations.find(c => c._id === convoId);
    window.localStorage.setItem("selectedChatId", convoId);
    // console.log("Chat container, ",window.localStorage.getItem("selectedChatId"));

    notifyMap.set(convoId, 0);

    renderChatList(allConversations, notifyMap, selecteChatObj, currentUser);
    updateChatHeader(selecteChatObj, currentUser);
    renderMessages([], currentUser, []);

    socket.emit("JOIN_CONVERSATION", { conversationId: convoId });
    // console.log("before emmit");

    await loadMessages(convoId);

    // socket.emit("MESSAGES_SEEN", { conversationId:convoId });
    // console.log("after emmit");

    // console.log("done");


    allConversations.forEach(c => {
        if (c._id === convoId) {
            c.unreadCount = 0;
        }
    })
}

function handleInputSendSocket(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        handleSendMessage();
    }
}

function handleInputSendPolling(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        handleSendMessagePolling();
    }
}

async function handleSendMessage() {
    console.log("sending messages");

    const text = messageInput.value.trim();
    if (!text || !selectedChatId || !selecteChatObj) return;

    const members = selecteChatObj.participants.map(e => (e._id || e.userId).toString());
    const tempId = "temp_" + Date.now();
    const frozenTime = new Date().toISOString();

    const messagePayload = {
        _id: tempId,
        conversationId: selecteChatObj._id,
        text,
        members,
        sender: currentUser._id,
        tempId: tempId,
        createdAt: frozenTime,
        seen: [{
            userId: currentUser._id,
            name: currentUser.userName || currentUser.firstName,
            seenAt: new Date().toISOString()
        }],
    };
    updateConversationList(selecteChatObj._id, text, frozenTime, currentUser._id);
    appendMessageToUI(messagePayload, currentUser, selecteChatObj.participants);
    await saveMessages([messagePayload]);

    messageInput.value = "";
    scrollToBottom();

    emitMessageWithAck(messagePayload);
}

async function handleSendMessagePolling() {
    const text = messageInput.value.trim();
    if (!text || !selectedChatId || !selecteChatObj) return;

    const members = selecteChatObj.participants.map(e => (e._id || e.userId).toString());
    const tempId = "temp_" + Date.now();
    const frozenTime = new Date().toISOString();

    const messagePayload = {
        _id: tempId,
        conversationId: selecteChatObj._id,
        text,
        members,
        sender: currentUser._id,
        tempId: tempId,
        createdAt: frozenTime,
        seen: [{
            userId: currentUser._id,
            name: currentUser.userName || currentUser.firstName,
            seenAt: new Date().toISOString()
        }],
    };
    updateConversationList(selecteChatObj._id, text, frozenTime, currentUser._id);
    appendMessageToUI(messagePayload, currentUser, selecteChatObj.participants);
    await saveMessages([messagePayload]);

    messageInput.value = "";
    scrollToBottom();

    sendMessageViaPolling(messagePayload);
}

async function sendMessageViaPolling(payload) {
    try {
        const res = await fetch(`${BASE_URL}/api/v1/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!data.success) throw new Error("Send failed");

        await swapTempForReal(payload._id, data.savedMessage);

    } catch (err) {
        console.error("Polling send failed:", err.message);
        markMessageFailed(payload);
    }
}


// CONVERSATION LIST UPDATE

export function updateConversationList(conversationId, text, time, sender) {
    let targetConvo = null;
    const otherConvos = [];
    const currentBadge = notifyMap.get(conversationId) || 0;

    allConversations.forEach(c => {
        if (c._id === conversationId) {
            targetConvo = {
                ...c,
                lastMessage: {
                    ...c.lastMessage,
                    text,
                    sender,
                    createdAt: time,
                    updatedAt: time
                },
                unreadCount: currentBadge,
                updatedAt: time
            };
        } else {
            otherConvos.push(c);
        }
    });

    if (targetConvo) {
        allConversations = [targetConvo, ...otherConvos];

        renderChatList(allConversations, notifyMap, selecteChatObj, currentUser);

        updateSingleConversation(targetConvo)
            .catch(err => console.error("Failed to save convo update", err));
    }
}



// MESSAGE RELIABILITY HELPERS

async function emitMessageWithAck(payload) {
    if (canSendNow()) {
        const { _id, ...serverPayload } = payload;

        socket.timeout(5000).emit("SEND_MESSAGE", serverPayload, async (err, response) => {
            if (err) {
                console.warn(`Timeout: Server did not ACK ${payload.tempId}`);
                markMessageFailed(payload);
                return;
            }

            if (!response || !response.success) {
                console.error(`Server Error: ${response?.error}`);
                markMessageFailed(payload);
                return;
            }
            console.log("messages emmited, swaping with real id");

            await swapTempForReal(payload._id, response.savedMessage);
        });
    }
}

function canSendNow() {
    return socket.connected && navigator.onLine;
}



async function swapTempForReal(tempId, realMessage) {
    await deleteMessage(tempId);
    await saveMessages([realMessage]);

    const msgElement = document.querySelector(`[data-id="${tempId}"]`);

    if (msgElement) {
        console.log(`Swapping ${tempId} -> ${realMessage._id}`);

        msgElement.setAttribute("data-id", realMessage._id);

        const serverSeenData = JSON.stringify(realMessage.seen || []);
        msgElement.setAttribute("data-seen", serverSeenData);

        const icon = msgElement.querySelector(".msg-status-icon");
        if (icon) icon.innerHTML = "✔";
    }
}

function markMessageFailed(payload) {
    const msgEl = document.querySelector(`[data-id="${payload._id}"]`);
    if (!msgEl) return;

    msgEl.classList.add("failed");

    const iconEl = msgEl.querySelector(".msg-status-icon");
    if (iconEl) {
        iconEl.innerText = "❗";

        iconEl.addEventListener("click", (e) => {
            e.stopPropagation();

            msgEl.classList.remove("failed");
            iconEl.innerText = "🕒";

            emitMessageWithAck(payload);
        }, { once: true });
    }
}


