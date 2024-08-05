// WebSocket connection
const socket = new WebSocket(`//${window.location.hostname}/ws`);

function getCookie(name) {
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
}

async function initializeHomeScreen(path) {
    const navbar = document.querySelector(".navbar");
    navbar.classList.remove("navbar-show");
    document.getElementById("blur").style = "display: none;";
    document.getElementById("blur").onclick = null;

    let response = await fetch(`/static/nyanners/${path}.nyn`);
    let page = await response.text();
    document.getElementById("content").innerHTML = page;
    const scripts = document.getElementById("content").getElementsByTagName('content');
    for (let i = 0; i < scripts.length; i++) {
        eval(scripts[i].innerText);
    }

    const srcScripts = document.getElementById("content").querySelectorAll('script[src]');
    srcScripts.forEach(script => {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        document.head.appendChild(newScript);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const userCookie = getCookie("userid");
    const userFromLocalStorage = localStorage.getItem("user");

    if (userFromLocalStorage == null || JSON.parse(userFromLocalStorage).id != userCookie) {
        const response = await fetch("/api/users/me", {
            headers: {
                "Authorization": `Bearer ${getCookie("token")}`
            }
        });
        const jsonData = await response.json();
        localStorage.setItem("user", JSON.stringify(jsonData));
    }

    const user = JSON.parse(localStorage.getItem("user"));

    document.getElementById("myProfileIcon").src = user.icon;
    document.getElementById("myProfileName").innerText = user.display_name;
    document.getElementById("myProfileUserName").innerText = `@${user.username}`;

    if (window.location.pathname == "/home") {
        await initializeHomeScreen("timeline");
    }

    document.getElementById("postDialog").onsubmit = (event) => {
        event.stopPropagation(); // Prevent the default form submission
        event.preventDefault()
        event.submitter.disabled = true;

        const formData = new FormData(event.target); // Create a FormData object from the form
        console.log(formData.get("files[]"));

        fetch('/api/boards', {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${getCookie("token")}`
            },
            body: formData,
        })
        .then(response => response.json()) // Assuming the server responds with JSON
        .then(data => {
            // Handle success
            const blurElement = document.getElementById("blur");
            const postDialog = document.getElementById("postDialog");
            blurElement.style = "display: none;";
            postDialog.style = "display: none;";
            event.target.reset();
            event.submitter.disabled = false;
        })
        .catch(error => {
            // Handle error
            console.error('Error:', error);
            document.getElementById('postError').textContent = 'An error occurred. Please try again.';
            event.submitter.disabled = false;
        });
    }

    document.querySelector(".postContent").oninput = () => {
        const textarea = document.querySelector(".postContent");
        const overlay = document.querySelector(".overlay");
        const text = textarea.value;

        // Display the content in the overlay
        overlay.innerHTML = text.replace(/\n/g, '<br>'); // Handle line breaks

        // Detect the selection
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const start = range.startOffset;
            const end = range.endOffset;
            const selectedText = text.substring(start, end);

            // Highlight selected text
            const before = text.substring(0, start);
            const after = text.substring(end);

            overlay.innerHTML = `${before}<span class="highlighted">${selectedText}</span>${after}`;
        }
    };

    document.querySelector(".postContent").oninput = () => {
        const textarea = document.querySelector(".postContent");
        const overlay = document.querySelector(".overlay");
        const text = textarea.value;

        // Display the content in the overlay
        overlay.innerHTML = text.replace(/\n/g, '<br>'); // Handle line breaks

        // Detect the selection
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const start = range.startOffset;
            const end = range.endOffset;
            const selectedText = text.substring(start, end);

            // Highlight selected text
            const before = text.substring(0, start);
            const after = text.substring(end);

            overlay.innerHTML = `${before}<span class="highlighted">${selectedText}</span>${after}`;
        }
    };

    // Handle selection change and update overlay
    document.querySelector(".postContent").addEventListener('mouseup', () => {
        const textarea = document.querySelector(".postContent");
        const overlay = document.querySelector(".overlay");
        const text = textarea.value;

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const start = range.startOffset;
            const end = range.endOffset;
            const selectedText = text.substring(start, end);

            // Highlight selected text
            const before = text.substring(0, start);
            const after = text.substring(end);

            overlay.innerHTML = `${before}<span class="highlighted">${selectedText}</span>${after}`;
        } else {
            overlay.innerHTML = text;
        }
    });

    const navbarToggle = document.querySelector(".navbar-toggle");
    const navbar = document.querySelector(".navbar");

    if (navbarToggle && navbar) {
        navbarToggle.addEventListener("click", () => {
            navbar.classList.toggle("navbar-show");
            const blurElement = document.getElementById("blur");
            blurElement.style = "";
            blurElement.onclick = () => {
                blurElement.style = "display: none;";
                navbar.classList.toggle("navbar-show");
                blurElement.onclick = null;
            }
        });
    }
});
