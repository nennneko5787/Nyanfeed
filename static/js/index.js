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

async function register() {
    let username = document.getElementById('registerForm').username.value;
    let password = document.getElementById('registerForm').password.value;
    let jsonData = JSON.stringify({
        username, password, turnstile
    });
    response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: jsonData
    });

    responsedData = await response.json();

    if (response.status != 200) {
        document.getElementById("registerError").innerHTML = responsedData.detail;
        return;
    }

    var CookieDate = new Date;
    CookieDate.setFullYear(CookieDate.getFullYear() +10);
    document.cookie = `token=${responsedData.token}; expires=${CookieDate.toUTCString()};`;
    document.cookie = `userid=${responsedData.user_id_str}; expires=${CookieDate.toUTCString()};`;
    window.location.href = "/home";
}

async function login() {
    let username = document.getElementById('loginForm').username.value;
    let password = document.getElementById('loginForm').password.value;
    let jsonData = JSON.stringify({
        username, password
    });
    response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: jsonData
    });

    responsedData = await response.json();

    if (response.status != 200) {
        document.getElementById("loginError").innerHTML = responsedData.detail;
        return;
    }

    var CookieDate = new Date;
    CookieDate.setFullYear(CookieDate.getFullYear() +10);
    document.cookie = `token=${responsedData.token}; expires=${CookieDate.toUTCString()};`;
    document.cookie = `userid=${responsedData.user_id_str}; expires=${CookieDate.toUTCString()};`;
    window.location.href = "/home";
}

document.addEventListener("DOMContentLoaded", () => {
    if (userFromLocalStorage != null && JSON.parse(userFromLocalStorage).id == userCookie) {
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
