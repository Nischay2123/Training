import { 
    chatContainer,
    messageInput,
    sendBtn,
    renderChatList, 
    renderMessages, 
    appendMessageToUI, 
    updateChatHeader,
    scrollToBottom
} from './ui.js';

const BASE_URL = "http://localhost:8000";
const socket = io(BASE_URL, { withCredentials: true });

let allConversations = [];
let selectedChatId = null; 
const notifyMap = new Map(); 
const currentUser = JSON.parse(window.localStorage.getItem("user"));

document.addEventListener("DOMContentLoaded", async () => {
    if (!currentUser) return console.error("User not found in localStorage");
    console.log("Logged in as:", currentUser.userName);
    await getAllConversations();
});

const getAllConversations = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/v1/conversation`, { withCredentials: true });
        
        if (response.data && response.data.data) {
            allConversations = response.data.data;
            
            allConversations.forEach(c => {
                notifyMap.set(c._id, c.unreadCount || 0);
            });

            renderChatList(allConversations, notifyMap, selectedChatId, currentUser);
        }
    } catch (error) {
        console.error("Error fetching conversations:", error);
    }
};

async function loadMessages(conversationId) {
    try {
        const response = await axios.get(`${BASE_URL}/api/v1/messages/${conversationId}`, {
            withCredentials: true
        });
        const messages = response.data.data || [];
        console.log(messages);
        
        renderMessages(messages, currentUser);
    } catch (err) {
        console.error("Error loading messages:", err);
    }
}


chatContainer.addEventListener("click", async (e) => {
    const item = e.target.closest(".chat-item");
    if (!item) return;

    const convoId = item.getAttribute("data-id");
    if (selectedChatId && selectedChatId._id === convoId) return;

    selectedChatId = allConversations.find(c => c._id === convoId);
    notifyMap.set(convoId, 0); 
    renderChatList(allConversations, notifyMap, selectedChatId, currentUser);
    updateChatHeader(selectedChatId, currentUser);

    socket.emit("JOIN_CONVERSATION", { conversationId: convoId });

    await loadMessages(convoId);

    try {
        await axios.put(`${BASE_URL}/api/v1/messages/seen/${convoId}`, {}, {
            withCredentials: true
        });
        
        allConversations.forEach(c => {
            if (c._id === convoId) {
                c.unreadCount = 0;
            }
        });
        
    } catch (err) {
        console.error("Failed to mark messages as seen:", err);
    }
});

sendBtn.addEventListener("click", handleSendMessage);

function handleSendMessage() {
    const text = messageInput.value.trim();
    if (!text || !selectedChatId) return;

    const members = selectedChatId.participants.map(e =>  e.userId);

    socket.emit("SEND_MESSAGE", {
        conversationId: selectedChatId._id,
        text,
        members,
        tempId: Date.now()
    });

    appendMessageToUI({
        text,
        sender: currentUser._id,
        createdAt: new Date().toISOString()
    }, currentUser);

    updateConversationList(selectedChatId._id, text, new Date());
    
    messageInput.value = "";
}

socket.on("NEW_MESSAGE", ({ conversationId, message }) => {
    const myMessage = message.sender._id === currentUser._id;

    if (myMessage) return; 

    const isChatOpen = selectedChatId && selectedChatId._id === conversationId;

    if (isChatOpen) {
        appendMessageToUI(message, currentUser);
        socket.emit("MESSAGE_SEEN", { conversationId, messageId: message._id });
    } else {
        const currentCount = notifyMap.get(conversationId) || 0;
        notifyMap.set(conversationId, currentCount + 1);
    }

    updateConversationList(conversationId, message.text, message.createdAt);
});

socket.on("MESSAGE_SEEN", ({ messageId, userId }) => {
    console.log(`User ${userId} saw message ${messageId}`);
});

function updateConversationList(conversationId, text, time) {
    let targetConvo = null;
    const otherConvos = [];

    allConversations.forEach(c => {
        if (c._id === conversationId) {
            c.lastMessage = { text, createdAt: time };
            targetConvo = c;
        } else {
            otherConvos.push(c);
        }
    });

    if (targetConvo) {
        allConversations = [targetConvo, ...otherConvos];
        
        renderChatList(allConversations, notifyMap, selectedChatId, currentUser);
    }
}