const chatContainer = document.querySelector(".chat-items-container");
const messageContainer = document.querySelector(".messages-area");
const profileContainer = document.querySelector(".column-profile")
const messageHeader = document.querySelector(".chat-header")

let allConverstaions =[];
let selectedChatId;
const currentUser = JSON.parse(window.localStorage.getItem("user"))
console.log("currentUser",currentUser._id);

const notifyMap = new Map();


const getAllConversations = async function(){
    try {
        const response = await axios.get("http://localhost:8000/api/v1/conversation",{ withCredentials: true });
        if (!(response.data.statusCode==200)) {
            console.error("Data not fetched:", error.response ? error.response.data : error.message);;
        }
        allConverstaions=response.data.data;
        console.log(allConverstaions);
        allConverstaions.forEach(c => {
            if (!notifyMap.has(c._id)) notifyMap.set(c._id, 0);
        });
        renderChatList(allConverstaions)
        
    } catch (error) {
        console.error("Data not fetched:", error.response ? error.response.data : error.message);
    }
}

function renderChatList(allChats) {
    chatContainer.innerHTML = ""; 

    allChats.forEach(chat => {
        
        let previewText = "";
        if (chat.lastMessage && chat.lastMessage.text) {
            previewText = chat.lastMessage.text.length > 25
                ? chat.lastMessage.text.substring(0, 25) + "..."
                : chat.lastMessage.text;
        }

        const isActive = selectedChatId && chat._id === selectedChatId._id ? 'active' : '';
        // const photo =chat.name==="One-to-One" ? chat.participants[1].photo ==null ? 'default-avtar.png': chat.participants[1].photo: 'default-avtar.png';
        // const chatName = chat.name == "One-to-One" ? chat.participants[1].name : chat.name;
        const targetUser = chat.name !== "One-to-One" ? {
            photo:'default-avtar.png',
            name:chat.name
        }:getTargetUser(chat);
        console.log(targetUser);
        
        
        const notification = notifyMap.get(chat._id);
        const chatHTML = notification===0? `
            <div class="chat-item ${isActive}" data-id="${chat._id}">
                <div class="avatar">
                    <img src="${targetUser.photo ?? `default-avtar.png`}" alt="${targetUser.name}">
                </div>
                <div class="chat-info">
                    <span class="name">${targetUser.name}</span>
                    <span class="preview">${previewText}</span>
                </div>
            </div>`:
            `<div class="chat-item ${isActive}" data-id="${chat._id}">
                <div class="avatar">
                    <img src="${targetUser.photo ?? `default-avtar.png`}" alt="${targetUser.name}">
                </div>
                <div class="chat-info">
                    <span class="name">${targetUser.name}</span>
                    <span class="preview">${previewText}</span>
                </div>
                <div class="chat-notify"><span class="c-notify">${notification}</span></div>
            </div>
        `;

        chatContainer.insertAdjacentHTML('beforeend', chatHTML);
    });

    attachClickListeners();
}

function getTargetUser(chat){
    console.log("header chat: ",chat);
    console.log("header currentUser",currentUser);
    
    
    const targetUser= chat.participants.filter((e)=>{
        return currentUser._id !== e.userId
        
    });
    return targetUser[0];
}



let clickListenerAttached = false;

function attachClickListeners() {
    if (clickListenerAttached) return; 
    clickListenerAttached = true;

    chatContainer.addEventListener("click", async function (e) {
        const item = e.target.closest(".chat-item");
        if (!item) return;

        chatContainer.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
        
        const convoId = item.getAttribute("data-id");
        item.classList.add("active");
        
        selectedChatId = allConverstaions.find(c => c._id === convoId);

        SetMessageHeader(selectedChatId);
        await loadMessages(convoId);
        markMessagesAsSeen(convoId);

        notifyMap.set(convoId, 0);

    });
}


function SetMessageHeader(chatData){
    const messageaImage = document.querySelector(".status-image img");
    const messageChatName = document.querySelector(".status-name");

    const targetUser = chatData.name !== "One-to-One" ? {
            photo:'default-avtar.png',
            name:chatData.name
        }:getTargetUser(chatData);
        console.log(targetUser);
    
    messageaImage.src=targetUser.photo ?? `default-avtar.png`
    messageChatName.innerHTML = targetUser.name ;
}

async function loadMessages(conversationId) {
    try {
        const response = await axios.get(`http://localhost:8000/api/v1/messages/${conversationId}`, {
            withCredentials: true
        });

        if (response.data.data.length>0) {
            console.log(response);
            
            renderMessages(response.data.data);
        } else {
            messageContainer.innerHTML = "<p>No messages available</p>";
        }
    } catch (err) {
        console.error("Failed to fetch messages:", err.response ? err.response.data : err.message);
    }
}

function markMessagesAsSeen(conversationId) {
    const messages = document.querySelectorAll(".incoming .message-wrapper");

    messages.forEach(msg => {
        const messageId = msg.dataset.id;
        if (messageId) {
            socket.emit("MESSAGE_SEEN", { conversationId, messageId });
        }
        
    });

    if(notifyMap.get(conversationId)>0){
        notifyMap.set(conversationId,0);
        updateConversationOnSend(conversationId,selectedChatId.lastMessage.text)
    }
}


function renderMessages(messages) {
    messageContainer.innerHTML = ""; 
    
    messages.forEach(msg => {
        const isOutgoing = msg.sender == currentUser._id; 
        const messageWrapper = document.createElement("div");
        messageWrapper.classList.add("message-wrapper");
        messageWrapper.classList.add(isOutgoing ? "outgoing" : "incoming");
        
        const bubble = document.createElement("div");
        bubble.classList.add("bubble");
        bubble.textContent = msg.text;
        
        const timestamp = document.createElement("span");
        timestamp.classList.add("timestamp");
        const date = new Date(msg.createdAt);
        timestamp.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageWrapper.appendChild(bubble);
        messageWrapper.appendChild(timestamp);
        messageContainer.appendChild(messageWrapper);
    });
    
    messageContainer.scrollTop = messageContainer.scrollHeight;
}



// on redering of the page 
document.addEventListener("DOMContentLoaded",getAllConversations);

messageHeader.addEventListener("click",(event)=>{
    event.preventDefault();
    
    profileContainer.style.display=profileContainer.style.display=="none"?"block":"none"
})