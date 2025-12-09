import api from "../Chat/js/app/axios.js"
const loginForm = document.querySelector('.login-form'); 
const emailInput = document.querySelector('.login-email-input');
const passwordInput = document.querySelector('.login-password-input');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    const apiEndpoint = "http://localhost:8000/api/v1/users/login";

    try {
        const response = await api.post(apiEndpoint, { email, password },{
            withCredentials: true
        });
        console.log("Login successful:", response.data.data);
        window.localStorage.setItem("user",response.data.data);
        window.location.href = 'http://localhost:5500/ChatApplication/Frontend/Pages/Chat/chat.html';
    } catch (error) {
        console.error("Login failed:", error.response ? error.response.data : error.message);
        alert("Login failed");
    }
});





const registerForm = document.getElementById('registerForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const userNameInput = document.getElementById('registerName');
const emailInputRegister = document.getElementById('registerEmail');
const passwordInputRegister = document.getElementById('registerPassword');
const registerFileInput = document.getElementById('registerFile');
const registerBtn = document.querySelector(".register-btn")

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData();
    
    const passwordR = passwordInputRegister.value;

    const hasUpper = [...passwordR].some(ch => ch >= 'A' && ch <= 'Z');
    const hasLower = [...passwordR].some(ch => ch >= 'a' && ch <= 'z');
    const hasNumber = [...passwordR].some(ch => ch >= '0' && ch <= '9');

    const specialChars = ['@', '$', '!', '%', '*', '?', '&'];
    const hasSpecial = [...passwordR].some(ch => specialChars.includes(ch));

    if (!(hasUpper && hasLower && hasNumber && hasSpecial && passwordR.length >= 8)) {
        alert("Password must contain:\n• 1 uppercase\n• 1 lowercase\n• 1 number\n• 1 special character\n• Minimum 8 characters");
        return;
    }

    formData.append('firstName', firstNameInput.value);
    formData.append('lastName', lastNameInput.value);
    formData.append('userName', userNameInput.value);
    formData.append('email', emailInputRegister.value);
    formData.append('password', passwordR);

    if (registerFileInput.files.length > 0) {
        formData.append('file', registerFileInput.files[0]);
    }
    const orginalText = registerBtn.innerHTML;
    registerBtn.disabled = true;
    registerBtn.innerHTML ="Registering...";
    const apiEndpoint = "http://localhost:8000/api/v1/users/register";

    try {
        const response = await api.post(apiEndpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            withCredentials: true,
        });

        console.log("Registration successful:", response.data);
        alert("Registration successful!");

        window.location.href = 'http://localhost:5500/ChatApplication/Frontend/Pages/Login/login.html';
    } catch (error) {
        console.error("Registration failed:", error.response ? error.response.data : error.message);
        alert("Registration failed: " + (error.response?.data?.message || error.message));
    }finally{
        registerBtn.disabled = false;
        registerBtn.innerHTML =orginalText;
    }
});



const switchToLogin = document.querySelector(".switch-to-login");
const switchToRegister = document.querySelector(".switch-to-register");

const login =document.querySelector(".login-container ")
const register =document.querySelector(".register-container ")

switchToLogin.addEventListener("click",(e)=>{
    e.preventDefault();
    register.style.display= "none";
    login.style.display="";
})
switchToRegister.addEventListener("click",(e)=>{
    e.preventDefault();
    register.style.display= "";
    login.style.display="none";
})




