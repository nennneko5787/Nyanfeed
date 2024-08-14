function getCookie(name) {
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
}

let turnstile = "";

function openRegisterDialog() {
    document.getElementById("blur").style = "";
    document.getElementById("registerDialog").style = "";
    document.getElementById("blur").onclick = () => {
        document.getElementById("registerDialog").style = "display: none;";
        document.getElementById("blur").style = "display: none;";
        turnstile = "";
    };
    return;
}

function openLoginDialog() {
    document.getElementById("blur").style = "";
    document.getElementById("loginDialog").style = "";
    document.getElementById("blur").onclick = () => {
        document.getElementById("loginDialog").style = "display: none;";
        document.getElementById("blur").style = "display: none;";
        turnstile = "";
    };
    return;
}

function javascriptCallback(token) {
    turnstile = token;
}
function setCookie(name, value, days) {
    let date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    let expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
}

async function register() {
    let username = document.getElementById('registerForm').username.value;
    let password = document.getElementById('registerForm').password.value;
    let jsonData = JSON.stringify({
        username, password, turnstile
    });
    let response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: jsonData
    });

    let responsedData = await response.json();

    if (response.status != 200) {
        document.getElementById("registerError").innerHTML = responsedData.detail;
        return;
    }

    setCookie("token", responsedData.token, 3650); // 10 years
    setCookie("userid", responsedData.user_id_str, 3650); // 10 years
    window.location.href = "/home";
}

async function login() {
    let username = document.getElementById('loginForm').username.value;
    let password = document.getElementById('loginForm').password.value;
    let jsonData = JSON.stringify({
        username, password
    });
    let response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: jsonData
    });

    let responsedData = await response.json();

    if (response.status != 200) {
        document.getElementById("loginError").innerHTML = responsedData.detail;
        return;
    }

    setCookie("token", responsedData.token, 3650); // 10 years
    setCookie("userid", responsedData.user_id_str, 3650); // 10 years
    window.location.href = "/home";
}

document.addEventListener("DOMContentLoaded", () => {
    const userCookie = getCookie("userid");
    const userFromLocalStorage = getCookie("user");
    const data = JSON.parse(userFromLocalStorage);

    if (userFromLocalStorage != null && data.id == userCookie) {
        window.location.href = "/home";
    }

    document.getElementById("openRegisterButton").onclick = openRegisterDialog;
    document.getElementById("openLoginButton").onclick = openLoginDialog;

    document.getElementById("registerForm").onsubmit = async (event) => {
        event.preventDefault()
        await register();
    };

    document.getElementById("loginForm").onsubmit = async (event) => {
        event.preventDefault()
        await login();
    };
});
