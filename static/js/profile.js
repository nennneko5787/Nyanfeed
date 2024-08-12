function getCookie(name) {
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
}

document.getElementById("editProfileForm").onsubmit = (event) => {
    event.stopPropagation();
    event.preventDefault()
    event.submitter.disabled = true;

    const formData = new FormData(event.target);

    fetch('/api/users/me/edit', {
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
        const editProfileDialog = document.getElementById("editProfileDialog");
        blurElement.style = "display: none;";
        editProfileDialog.style = "display: none;";
        event.target.reset();
        event.submitter.disabled = false;
        loadUserProfile(data);

    })
    .catch(error => {
        // Handle error
        console.error('Error:', error);
        document.getElementById('editProfileError').textContent = 'An error occurred. Please try again.';
        event.submitter.disabled = false;
    });
}

async function loadUserProfile(username) {
    const response = await fetch(`/api/users/${username}`);
    const user = await response.json();
    document.title = `${user.display_name} (@${user.username}) - Nyanfeed`;
    window.history.pushState({}, "", `/@${user.username}`);

    const userFromLocalStorage = localStorage.getItem("user");
    const data = JSON.parse(userFromLocalStorage);
    console.log(data.id_str);
    console.log(user.id_str);
    if (data.id_str == user.id_str) {
        document.getElementById("displayName").value = user.display_name;
        document.getElementById("description").value = user.raw_description;

        document.querySelector("#followButton > span").textContent = "プロフィールを編集";
        document.querySelector("#followButton").style.width = "40%";
        document.querySelector("#followButton").onclick = () => {
            document.getElementById("blur").style = "";
            document.getElementById("editProfileDialog").style = "";
            document.getElementById("blur").onclick = () => {
                document.getElementById("editProfileDialog").style = "display: none;";
                document.getElementById("blur").style = "display: none;";
                turnstile = "";
            };
            return;
        }
    }

    if (user.header != null) {
        document.querySelector(".user-header > img").src = user.header;
    } else {
        document.querySelector(".user-header > img").style.display = "none";
        document.querySelector(".user-header").style.width = "100%";
        document.querySelector(".user-header").style.height = "35vh";
        document.querySelector(".user-header").style.marginBottom = "4.5px";
        document.querySelector(".user-header").style.backgroundColor = "var(--background-two-color)";
    }

    document.querySelector(".user-icon > img").src = user.icon;

    document.querySelector(".user-displayname").textContent = user.display_name;
    document.querySelector(".user-username").textContent = `@${user.username}`;

    user.badges.forEach((badgeUrl) => {
        let badge = document.createElement("img");
        badge.className = "badge";
        badge.src = `https://r2.htnmk.com/badges/${badgeUrl}.svg`;
        badge.width = "20";
        badge.loading = "lazy";
        document.querySelector(".username-flex").appendChild(badge);
    });

    document.querySelector(".user-description").innerHTML = user.description || "";

    document.querySelector(".user-following").innerHTML = `<b>${user.following.length}</b> フォロー中`;
    document.querySelector(".user-followers").innerHTML = `<b>${user.followers.length}</b> フォロワー`;
}

var username = window.location.pathname.split("/")[1];
var noLoadingRequired = false;

async function loadUserBoards(page = 0, clear = false, reverse = false, arrrev = true) {
    if (clear) {
        document.getElementById("boards").innerHTML = '<div style="display: flex; justify-content: center; align-items: center;"><div class="loading"></div></div>';
    }

    const response = await fetch(`/api/users/${username}/boards?page=${page}`, {
        headers: {
            "Authorization": `Bearer ${getCookie("token")}`
        }
    });
    const jsonData = await response.json();

    if (clear) {
        document.getElementById("boards").innerHTML = "";
    }

    if (arrrev) {
        jsonData.reverse();
    }

    if (jsonData.length <= 0) {
        noLoadingRequired = true;
    }

    // Create an array of promises and wait for all of them to resolve
    await Promise.all(jsonData.map(async (board) => {
        await addPostToTimeline(board, reverse);
    }));
}

var currentPage = 0;
var loading = false;

document.getElementById("scrollevent").addEventListener('scroll', () => {
    if (!loading && !noLoadingRequired && document.getElementById("scrollevent").scrollHeight - document.getElementById("scrollevent").scrollTop <= document.getElementById("scrollevent").clientHeight) {
        loading = true;
        let loadingElement = document.createElement("div");
        loadingElement.style = "display: flex; justify-content: center; align-items: center;";
        loadingElement.innerHTML = '<div class="loading"></div>';
        document.getElementById("boards").append(loadingElement);
        currentPage += 1;
        loadUserBoards(currentPage, false, true, false).then(() => {
            loadingElement.remove();
            loading = false;
        })
    }
}, {passive: true});

document.title = "ユーザー - Nyanfeed";
loadUserProfile(username);
document.querySelector(".postButton").style = "";
loadUserBoards(currentPage, true, false, true);
