import { allConversations, currentUser, getAllConversations } from "./main.js";

const createGroupBtn = document.querySelector(".create-group-btn");
const modal = document.getElementById('addNewGroup');
const closeModalBtn = document.getElementById("close-modal-btn");
const modalInput = document.getElementById('newGroupInput');
const modalTitle = document.getElementById('modal-title');
const searchResultsList = document.getElementById('user-search-results');
const finalizeGroupBtn = document.getElementById('finalize-group-btn');

let selectedParticipants = [];

createGroupBtn.addEventListener("click", openSearchModal);

closeModalBtn.addEventListener("click", closeSearchModal);

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        closeSearchModal();
    }
});

finalizeGroupBtn.addEventListener("click", async () => {
    const groupName = modalInput.value.trim();

    if (!groupName) {
        alert("Please enter a Group Name");
        modalInput.focus();
        return;
    }

    const memberIds = selectedParticipants.map(user => user._id);
    
    const payload = {
        name: groupName,
        participants: memberIds 
    };

    console.log("Payload:", payload);

    try {
        const response = await axios.post(`http://localhost:8000/api/v1/conversation/group`, payload, { withCredentials: true });
        
        if(response.data.success) {
           closeSearchModal();
           await getAllConversations();
        }
    } catch (error) {
        console.error(error);
    }
});

function openSearchModal(e) {
    e.preventDefault();
    
    modalTitle.innerHTML = "Create New Group";
    modalInput.placeholder = "Enter Group Name...";
    modal.style.display = "flex";
    
    selectedParticipants = []; 
    
    let data = [];
    allConversations.forEach((e) => {
        if (e.name === "One-to-One") {
            e.participants.forEach((c) => {
                if (c._id != currentUser._id) {
                    data.push({
                        firstName: c.firstName,
                        lastName: c.lastName,
                        _id: c._id,
                        userName: c.userName,
                        photo: c.photo
                    });
                }
            })
        }
    })
    
    renderUserList(data);
    modalInput.focus();
}

function closeSearchModal() {
    modal.style.display = "none";
    modalInput.value = ""; 
    searchResultsList.innerHTML = "";
    selectedParticipants = [];
}

function renderUserList(users) {
    searchResultsList.innerHTML = '';
    
    users.forEach(participant => {
        const li = document.createElement("li");
        li.className = 'search-item'; 

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = participant._id;
        checkbox.value = JSON.stringify(participant);
        
        checkbox.addEventListener("change", (e) => {
            const payload = JSON.parse(e.target.value);
            
            if (e.target.checked) {
                selectedParticipants.push(payload);
            } else {
                selectedParticipants = selectedParticipants.filter(p => p._id !== payload._id);
            }
        });

        const avatarSrc = participant.photo ? participant.photo : 'default-avtar.png';
        const img = document.createElement('img');
        img.src = avatarSrc;
        img.alt = participant.userName;

        const div = document.createElement('div');
        div.className = 'search-details';
        
        const fullName = `${participant.firstName} ${participant.lastName}`;
        
        div.innerHTML = `
            <span class="search-name">${fullName}</span>
            <span class="search-email">@${participant.userName}</span>
        `;

        li.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        li.appendChild(checkbox);
        li.appendChild(img);
        li.appendChild(div);

        searchResultsList.appendChild(li);
    });
}