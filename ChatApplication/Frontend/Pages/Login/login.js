const loginForm = document.querySelector('.loginForm'); 
const emailInput = document.querySelector('.emailInput');
const passwordInput = document.querySelector('.passwordInput');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    const apiEndpoint = "http://localhost:8000/api/v1/users/login";

    try {
        const response = await axios.post(apiEndpoint, { email, password });
        console.log("Login successful:", response.data);
        alert("Login successful!");
    } catch (error) {
        console.error("Login failed:", error.response ? error.response.data : error.message);
        alert("Login failed");
    }
});
