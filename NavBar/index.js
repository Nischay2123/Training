const navbarToggle = document.querySelector(".navbar-toggle");
const navbarMenu = document.querySelector(".navbar-menu");

navbarToggle.addEventListener("click",()=>{
    
    navbarToggle.classList.toggle("active");
    navbarMenu.classList.toggle("active");
})

navbarMenu.addEventListener("click",()=>{
    
    navbarToggle.classList.toggle("active");
    navbarMenu.classList.toggle("active");
})
