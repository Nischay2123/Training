import { getAllConversations, allConversations, currentUser } from "./main.js";

const createNewChatBtn = document.querySelector('.add-user-btn');
const modal = document.getElementById('addUserModal');
const closeModalBtn = document.querySelector('.close-modal-btn');
const modalInput = document.getElementById('userSearchInput');
const searchResultsList = document.querySelector('.user-search-results');
const modalTitle = document.querySelector('.modal-header h3'); 
let newUsers = [];

createNewChatBtn.addEventListener("click", openSearchModal);

closeModalBtn.addEventListener("click", closeSearchModal);

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        closeSearchModal();
    }
});

function openSearchModal(e) {
    e.preventDefault();
    if(modalTitle) modalTitle.innerText = "New Chat";
    modal.style.display = "flex";
    modalInput.focus();
}

function closeSearchModal() {
    modal.style.display = "none";
    modalInput.value = ""; 
    searchResultsList.innerHTML = "";
}

modalInput.addEventListener('input', async (e) => {
    const query = e.target.value;
    if(query.length > 0){
        try {
            const response = await axios.get(`http://localhost:8000/api/v1/users/?userName=${query}`, { withCredentials: true });
            
            if (response.data && response.data.data) {
                let existingIds = [];
                
                allConversations.forEach(chat => {
                    if (chat.participants) {
                        chat.participants.forEach(user => {
                            existingIds.push(user._id);
                        });
                    }
                });
                
                newUsers = response.data.data.filter(user => {
                    return !existingIds.includes(user._id) && user._id!=currentUser._id;
                });
                console.log(newUsers);
                
                renderUserList(newUsers);
            }
        } catch (error) {
            console.error(error);
        }
    } else {
        searchResultsList.innerHTML = "";
    }
});

function renderUserList(users) {
    searchResultsList.innerHTML = '';

    users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'search-item';
        
        const fullName = `${user.firstName} ${user.lastName}`;
        const avatarSrc = user.photo ? user.photo : 'default-avtar.png';

        li.innerHTML = `
            <img src="${avatarSrc}" alt="${fullName}">
            <div class="search-details">
                <span class="search-name">${fullName}</span>
                <span class="search-email">@${user.userName}</span>
            </div>
        `;

        li.addEventListener('click', (e)=>{
            e.preventDefault();
            createConvo(user);
        });

        searchResultsList.appendChild(li);
    });
}

async function createConvo(user){
    try {
        const response = await axios.post(`http://localhost:8000/api/v1/conversation`, { "targetId": user._id }, { withCredentials: true })

        if (response.data.success) {
            await getAllConversations(response.data.data._id);
            closeSearchModal();
        }
    } catch (error) {
        console.log('Conversation is not created: ', error.message);
    }
}