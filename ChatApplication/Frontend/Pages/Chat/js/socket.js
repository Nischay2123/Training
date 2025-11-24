const socket = io("http://localhost:8000", {
      withCredentials: true // important so cookies are sent
});


socket.on("connect_error", (err) => {
        console.error("Connect Error:", err.message, err);
    });

socket.on("connect_failed", (err) => {
    console.error("Connect Failed:", err);
});

socket.on("disconnect", (reason) => {
    console.log("Disconnected:", reason);
});


socket.on("connect",()=>{
    console.log("Connected with user: ", currentUser._id);
})

socket.on("NEW_MESSAGE", ({ message }) => {
    console.log(message);
    
    if(selectedChatId._id==message.conversationId)appendMessage(message);

    const convoId  = selectedChatId._id;

    const old = notifyMap.get(convoId) || 0;
    notifyMap.set(convoId, old + 1);

    updateConversationOnNewMessage(message);
});

function updateConversationOnNewMessage(message) {
    const convo = allConverstaions.find(c => c._id === message.conversationId);
    if (!convo) return;

    convo.lastMessage = {
        text: message.text,
        sender: message.sender._id,
        createdAt: message.createdAt
    };

    allConverstaions = [
        convo,
        ...allConverstaions.filter(c => c._id !== message.conversationId)
    ];

    renderChatList(allConverstaions);
}


socket.on("MESSAGE_CONFIRMED", ({ tempId, savedMessage }) => {
    console.log("Message confirmed:", tempId, savedMessage);
});


socket.on("NEW_MESSAGE_ALERT", async(obj) => {
    if (selectedChatId && selectedChatId._id === obj.conversationId) return;

    const currentCount = notifyMap.get(obj.conversationId) || 0;
    notifyMap.set(obj.conversationId, currentCount + 1);

    updateConversationOnSend(obj.conversationId, obj.lastMessage.text, obj.lastMessage.sender._id);
});


document.querySelector(".send-btn").addEventListener("click",async(e) => {
    const messageInput = document.querySelector(".message-input")
    console.log("messageInpute: ",messageInput);
    
    const text = messageInput.value.trim();
    if (!text) return;
    console.log(selectedChatId.participants);
    
    const members = selectedChatId.participants.map((e)=>  e.userId);
    console.log("members: ",members);
    
    const tempId = new Date().now;
    console.log();
    
    socket.emit("SEND_MESSAGE", {
        conversationId:selectedChatId._id,
        text,
        members,
        tempId
    });

    updateConversationOnSend(selectedChatId._id,text,currentUser._id);
    updateConversationOnNewMessage({
        conversationId:selectedChatId._id,
        text,
        members,
        tempId
    });
    console.log("done, ",selectedChatId._id);
    

    messageInput.value = "";

})


function updateConversationOnSend(conversationId, text, senderId) { 
    const convo = allConverstaions.find(c => c._id === conversationId);
    if (!convo) return;

    convo.lastMessage = {
        text,
        createdAt: new Date().toISOString(),
        sender: senderId 
    };

    allConverstaions = [
        convo,
        ...allConverstaions.filter(c => c._id !== conversationId)
    ];
    renderChatList(allConverstaions);
}

function appendMessage(msg) {
    const isOutgoing = msg.sender._id == currentUser._id; 
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
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

