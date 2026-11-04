
// MAN MODE - Main JavaScript

document.addEventListener("DOMContentLoaded", function () {

    console.log("MAN MODE Website Loaded!");

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", function (e) {
            const target = document.querySelector(
                this.getAttribute("href")
            );

            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    });

});
