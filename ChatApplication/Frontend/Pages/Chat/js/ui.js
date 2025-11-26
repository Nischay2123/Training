export const chatContainer = document.querySelector(".chat-items-container");
export const messageContainer = document.querySelector(".messages-area");
export const messageInput = document.querySelector(".message-input");
export const sendBtn = document.querySelector(".send-btn");
export const profileContainer = document.querySelector(".column-profile");
export const statusImage = document.querySelector(".status-image img");
export const statusName = document.querySelector(".status-name");

export function renderChatList(conversations, notifyMap, selectedChatId, currentUser) {
    chatContainer.innerHTML = "";

    conversations.forEach(chat => {
        const targetUser = getTargetUser(chat, currentUser);
        console.log(chat);
        
        
        const isActive = selectedChatId && chat._id === selectedChatId._id ? 'active' : '';
        
        const unreadCount = notifyMap.get(chat._id) || 0;

        let previewText = "Start a conversation";
        if (chat.lastMessage && chat.lastMessage.text) {
            previewText = chat.lastMessage.text.length > 25 
                ? chat.lastMessage.text.substring(0, 25) + "..." 
                : chat.lastMessage.text;
        }

        const chatHTML = `
            <div class="chat-item ${isActive}" data-id="${chat._id}">
                <div class="avatar">
                    <img src="${targetUser.photo || 'default-avtar.png'}" alt="${targetUser.name}">
                </div>
                <div class="chat-info">
                    <span class="name">${targetUser.name}</span>
                    <span class="preview">${previewText}</span>
                </div>
                ${unreadCount > 0 ? `<div class="chat-notify"><span class="c-notify">${unreadCount}</span></div>` : ''}
            </div>
        `;
        chatContainer.insertAdjacentHTML('beforeend', chatHTML);
    });
}

export function renderMessages(messages, currentUser) {
    messageContainer.innerHTML = ""; 
    
    if(!messages || messages.length === 0) {
        messageContainer.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.6'>No messages yet</p>";
        return;
    }

    messages.forEach(msg => appendMessageToUI(msg, currentUser));
    scrollToBottom();
}

export function appendMessageToUI(msg, currentUser) {
    const senderId = msg.sender._id || msg.sender; 
    const isOutgoing = senderId === currentUser._id;
    
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper", isOutgoing ? "outgoing" : "incoming");
    
    const timeVal = new Date(msg.createdAt) ;
    const timeString = timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageWrapper.innerHTML = `
        <div class="bubble">${msg.text}</div>
        <span class="timestamp">${timeString}</span>
    `;

    messageContainer.appendChild(messageWrapper);
    scrollToBottom();
}

export function updateChatHeader(chat, currentUser) {
    const targetUser = getTargetUser(chat, currentUser);
    statusImage.src = targetUser.photo || 'default-avtar.png';
    statusName.textContent = targetUser.name;
}

export function scrollToBottom() {
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

export function getTargetUser(chat, currentUser) {
    if (chat.name !== "One-to-One") {
        return { name: chat.name, photo: null };
    }
    
    const other = chat.participants.find(p => {
        const pId = p._id.toString() 
        return pId !== currentUser._id.toString();
    });

    if (!other) return { name: "Unknown", photo: null };

    return { 
        name: other.userName, 
        photo: other.photo 
    };
}