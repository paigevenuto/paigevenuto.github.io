window.addEventListener("DOMContentLoaded", () => {
    const topnav = document.querySelector(".topnav");
    const menubtn = document.querySelector(".menubtn");
    menubtn.addEventListener("click", dropdown);
    function dropdown() {
        if (topnav.className === "topnav") {
            topnav.className += " responsive";
        } else {
            topnav.className = "topnav";
        }
    }
});

