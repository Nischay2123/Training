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

import { 
    getLocalConversations, 
    saveConversations, 
    getLocalMessages, 
    saveMessages ,
    deleteMessage
} from './db.js';

const BASE_URL = "http://localhost:8000";
const socket = io(BASE_URL, { withCredentials: true });

export let allConversations = [];
let selectedChatId = null; 
const notifyMap = new Map(); 
export const currentUser = JSON.parse(window.localStorage.getItem("user"));

document.addEventListener("DOMContentLoaded", async () => {
    if (!currentUser) return console.error("User not found in localStorage");
    console.log("Logged in as:", currentUser.userName);
    await getAllConversations();
});

export const getAllConversations = async (conversationId) => {

    try {
        const localData = await getLocalConversations();
        if (localData.length > 0) {
            console.log(" Rendering from IndexedDB (Offline Cache)");
            allConversations = localData;
            allConversations.forEach(c => notifyMap.set(c._id, c.unreadCount || 0));
            renderChatList(allConversations, notifyMap, selectedChatId, currentUser);
        }
    } catch (e) {
        console.error("IDB Read Error:", e);
    }

    try {
        const response = await axios.get(`${BASE_URL}/api/v1/conversation`, { withCredentials: true });
        
        if (response.data && response.data.data) {
            const serverData = response.data.data;
            console.log("Network Data Received. Updating Cache.");
            allConversations = serverData;
            await saveConversations(serverData);
            allConversations.forEach(c => {
                notifyMap.set(c._id, c.unreadCount || 0);
            });
            console.log(allConversations);
            
            if(conversationId){
                const foundChat = allConversations.find(c => c._id === conversationId);
                if (foundChat) {
                    selectedChatId = foundChat;
                    updateChatHeader(selectedChatId, currentUser);
                    loadMessages(conversationId); 
                }
            }

            renderChatList(allConversations, notifyMap, selectedChatId, currentUser);
        }
    } catch (error) {
        console.error("Error fetching conversations:", error);
    }
};

async function loadMessages(conversationId) {
    const localMsgs = await getLocalMessages(conversationId);
    if (localMsgs.length > 0) {
        // console.log("test",localMsgs);
        
        renderMessages(localMsgs, currentUser);
    }
    try {
        const response = await axios.get(`${BASE_URL}/api/v1/messages/${conversationId}`, {
            withCredentials: true
        });
        const Servermessages = response.data.data || [];
        // console.log(Servermessages);
        
        renderMessages(Servermessages, currentUser);
        if (Servermessages.length > 0) {
            await saveMessages(Servermessages);
        }
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
    console.log("Chat container, ",selectedChatId._id);
    
    notifyMap.set(convoId, 0); 
    
    renderChatList(allConversations, notifyMap, selectedChatId, currentUser);
    updateChatHeader(selectedChatId, currentUser);

    socket.emit("JOIN_CONVERSATION", { conversationId: convoId });

    await loadMessages(convoId);
    // console.log("done");
    

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
messageInput.addEventListener("keypress",(e)=>{
    if (e.key === "Enter") {
        e.preventDefault(); 
        handleSendMessage();
    }
})

function handleSendMessage() {
    const text = messageInput.value.trim();
    if (!text || !selectedChatId) return;

    const members = selectedChatId.participants.map(e => e._id.toString()); 
    const timestamp = Date.now();

    socket.emit("SEND_MESSAGE", {
        conversationId: selectedChatId._id,
        text,
        members,
        tempId: timestamp
    });


    updateConversationList(selectedChatId._id, text, new Date());
    
    messageInput.value = "";
}

socket.on("NEW_MESSAGE", ({ conversationId, message }) => {

    const isChatOpen = selectedChatId && selectedChatId._id === conversationId;

    if (isChatOpen) {
        appendMessageToUI(message, currentUser);
        socket.emit("MESSAGE_SEEN", { conversationId, messageId: message._id });
    } else {
        const currentCount = notifyMap.get(conversationId) || 0;
        notifyMap.set(conversationId, currentCount + 1);
    }
    saveMessages([message]); 
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

document.querySelector(".chat-header").addEventListener("click",(e)=>{
    e.preventDefault();
    const profile =document.querySelector(".column-profile");
    profile.style.display=profile.style.display == "flex"?"none":"flex";
})

socket.on("MESSAGE_CONFIRMED", async ({ tempId, savedMessage }) => {
    await saveMessages([savedMessage]);
    
    await deleteMessage("temp_" + tempId); 
});