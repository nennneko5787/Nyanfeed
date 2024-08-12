function getCookie(name, defaultValue = null, prefix = "") {
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return `${prefix}${match[2]}`;
    return defaultValue;
}

// WebSocket connection
let socket = new WebSocket(`//${window.location.hostname}/ws${getCookie("token", "", "/")}`);

socket.onclose = function(e) {
    console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
    setTimeout(function() {
        socket = new WebSocket(`//${window.location.hostname}/ws/${getCookie("token", "", "/")}`);
    }, 1000);
};

socket.onerror = function(err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    socket.close();
};

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

async function router(path, nyanner, pushState = true) {
    if (pushState) {
        window.history.pushState({}, "", path);
    }
    await initializeHomeScreen(nyanner);
}

async function firstPage(pushState = true) {
    if (window.location.pathname == "/home") {
        await router("/home", "timeline", pushState);
    }else if (window.location.pathname.match(/^\/@.*\/boards\/.*$/)){
        await router(window.location.pathname, "board", pushState);
    }else if (window.location.pathname.match(/^\/@.*$/)){
        await router(window.location.pathname, "profile", pushState);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const userCookie = getCookie("userid");
    const userFromLocalStorage = localStorage.getItem("user");
    const data = JSON.parse(userFromLocalStorage);

    if (data == null || data.id != userCookie) {
        const response = await fetch("/api/users/me", {
            headers: {
                "Authorization": `Bearer ${getCookie("token")}`
            }
        });
        const jsonData = await response.json();
        localStorage.setItem("user", JSON.stringify(jsonData));
    }

    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        document.getElementById("myProfileIcon").src = user.icon;
        document.getElementById("myProfileName").innerText = user.display_name;
        document.getElementById("myProfileUserName").innerText = `@${user.username}`;
        document.getElementById("smart-toggle-icon").src = user.icon;
        document.getElementById("smart-toggle-icon").className = "";
    }else{
        document.querySelector(".navbar-content-bottom").innerHTML = `
            <button class="button-primary" style="width: 100%;" role="button" onclick="window.location.href = '/';"><span class="text">ログイン・新規登録</span></button>
        `;
    }

    await firstPage(true);

    let before = window.location.pathname.toLowerCase();
    let after = window.location.pathname.toLowerCase();

    const pathLoop = setInterval(async () => {
        after = window.location.pathname.toLowerCase();
        if (after != before) {
            await firstPage(false);
        }
        before = window.location.pathname.toLowerCase();
    }, 100);

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

    document.querySelector(".postButton").onclick = () => {
        const blurElement = document.getElementById("blur");
        const postDialog = document.getElementById("postDialog");
        postDialog.style = "";
        blurElement.style = "";
        blurElement.onclick = () => {
            blurElement.style = "display: none;";
            postDialog.style = "display: none;";
            blurElement.onclick = null;
        }
    }

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
