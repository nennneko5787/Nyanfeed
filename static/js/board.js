function getCookie(name) {
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
}

function addPostToPage(board, small = false) {
    document.title = `${board.user.display_name} (@${board.user.username}) さん: ${board.raw_content.replace("\r", "").replace("\n", "")} - Nyanfeed`;
    // Create the main board div
    const boardElement = document.createElement('div');
    boardElement.classList.add('board');
    if (small) {
        boardElement.classList.add('board-small');
    }
    boardElement.setAttribute("x-nyanfeed-board-id", board.id_str);

    // Create the profile section
    const boardProfile = document.createElement('div');
    boardProfile.classList.add('board-profile');
    boardProfile.onclick = async () => {
        await router(`/@${board.user.username}`, "profile");
    };

    const profileIcon = document.createElement('div');
    profileIcon.classList.add('profile-icon');
    profileIcon.style.backgroundImage = `url('${board.user.icon}')`;

    const profileName = document.createElement('div');
    profileName.classList.add('profile-name');

    const profileDisplayName = document.createElement('div');
    profileDisplayName.classList.add('profile-display-name');
    profileDisplayName.textContent = board.user.display_name;

    const profileUsername = document.createElement('div');
    profileUsername.classList.add('profile-username');
    profileUsername.textContent = `@${board.user.username}`;

    // Append profile name elements to profileName
    profileName.appendChild(profileDisplayName);
    profileName.appendChild(profileUsername);

    // Append profile icon and profileName to boardProfile
    boardProfile.appendChild(profileIcon);
    boardProfile.appendChild(profileName);
    board.user.badges.forEach((badgeUrl) => {
        let badge = document.createElement("img");
        badge.className = "badge";
        badge.src = `https://r2.htnmk.com/badges/${badgeUrl}.svg`;
        badge.width = "20";
        badge.loading = "lazy";
        boardProfile.appendChild(badge);
    });

    // Create the content section
    const boardContent = document.createElement('div');
    boardContent.classList.add('board-content');
    boardContent.innerHTML = board.content;
    if (small) {
        boardContent.onclick = async () => {
            await router(`/@${board.user.username}/boards/${board.id_str}`, "board");
        };
    }

    // Create the attachment section
    const boardAttachments = document.createElement('div');
    boardAttachments.classList.add('board-attachments');

    const attachmentCount = board.attachments.length;
    if (attachmentCount === 1) {
        boardAttachments.classList.add('one-attachment');
    } else if (attachmentCount === 2) {
        boardAttachments.classList.add('two-attachments');
    } else if (attachmentCount === 3) {
        boardAttachments.classList.add('three-attachments');
    } else if (attachmentCount === 4) {
        boardAttachments.classList.add('four-attachments');
    }

    board.attachments.forEach((file) => {
        let pictureAElement = document.createElement("a");
        pictureAElement.href = `https://r2.htnmk.com/${file}`;
        pictureAElement.setAttribute("data-lightbox", board.id_str);
        pictureAElement.setAttribute("data-title", file);

        const fileExtension = file.split('.').pop();
        let element;

        switch (fileExtension) {
            case "png":
            case "apng":
            case "gif":
            case "jpeg":
            case "jpg":
            case "webp":
                element = document.createElement("img");
                element.src = `https://r2.htnmk.com/${file}`;
                element.loading = "lazy";
                break;
            case "mp4":
            case "webm":
            case "ogg":
                element = document.createElement("video");
                element.src = `https://r2.htnmk.com/${file}`;
                element.controls = true;
                element.loading = "lazy";
                break;
            case "mpeg":
            case "wav":
            case "ogg":
            case "webm":
                element = document.createElement("audio");
                element.src = `https://r2.htnmk.com/${file}`;
                element.controls = true;
                break;
            default:
                console.log(`Unsupported file type: ${fileExtension}`);
                return;
        }

        pictureAElement.appendChild(element)
        boardAttachments.appendChild(pictureAElement);
    });

    createdAt = new Date(board.created_at)

    const boardDate = document.createElement('div');
    boardDate.classList.add('board-datetime');
    boardDate.textContent = createdAt.toLocaleString();

    // Create the actions section
    const boardActions = document.createElement('div');
    boardActions.classList.add('board-actions');

    // 返信
    let actionElement = document.createElement("div");
    actionElement.className = "board-action";
    actionElement.title = "返信";

    let icon = document.createElement("img");
    icon.src = "/static/img/reply.svg";
    icon.className = "svg";
    icon.width = "27";
    icon.loading = "lazy";
    actionElement.appendChild(icon);

    let count = document.createElement("span");
    count.className = "board-count";
    count.textContent = board.replys_count;
    actionElement.appendChild(count);

    boardActions.appendChild(actionElement);

    // リボード
    actionElement = document.createElement("div");
    actionElement.className = "board-action";
    actionElement.title = "リボード / 引用リボード";

    icon = document.createElement("img");
    icon.src = "/static/img/reboard.svg";
    icon.className = "svg";
    icon.width = "27";
    icon.loading = "lazy";
    actionElement.appendChild(icon);

    count = document.createElement("span");
    count.className = "board-count";
    count.textContent = board.reboards_count;
    actionElement.appendChild(count);

    boardActions.appendChild(actionElement);

    // いいね
    actionElement = document.createElement("div");
    actionElement.className = "board-action";
    actionElement.title = "いいね";
    actionElement.setAttribute("x-nyanfeed-board-id", board.id_str);
    actionElement.onclick = (event) => {
        const board_id = event.target.getAttribute("x-nyanfeed-board-id");
        response = fetch(`/api/boards/${board.id_str}/like`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getCookie("token")}`
            }
        }).then((response) => {
            response.json().then((json) => {
                document.querySelectorAll(`.LikeIcon-${board.id_str}`).forEach((icon) => {
                    if (json.iliked) {
                        icon.src = "/static/img/heart.svg";
                        icon.classList.remove("svg");
                    }else{
                        icon.src = "/static/img/heart-outline.svg";
                        icon.classList.add("svg");
                    }
                });

                document.querySelectorAll(`.LikeCount-${board.id_str}`).forEach((count) => {
                    count.textContent = json.count;
                });
            });
        });
    }

    icon = document.createElement("img");
    icon.classList = [`LikeIcon-${board.id_str}`];
    if (board.iliked) {
        icon.src = "/static/img/heart.svg";
    }else{
        icon.src = "/static/img/heart-outline.svg";
        icon.classList.add("svg");
    }
    icon.width = "27";
    icon.loading = "lazy";
    actionElement.appendChild(icon);

    count = document.createElement("span");
    count.classList = ["board-count"];
    count.classList.add(`LikeCount-${board.id_str}`);
    count.textContent = board.liked_id.length;
    actionElement.appendChild(count);

    boardActions.appendChild(actionElement);

    // お気に入り
    actionElement = document.createElement("div");
    actionElement.className = "board-action";
    actionElement.title = "お気に入り";

    icon = document.createElement("img");
    icon.src = "/static/img/star-outline.svg";
    icon.className = "svg";
    icon.width = "27";
    icon.loading = "lazy";
    actionElement.appendChild(icon);

    boardActions.appendChild(actionElement);

    // シェア
    actionElement = document.createElement("div");
    actionElement.className = "board-action";
    actionElement.title = "シェア";
    icon.loading = "lazy";
    actionElement.addEventListener("click", async () => {
        try {
            await navigator.share({
                title: "ボード(投稿)をシェア",
                text: `Nyanfeedで${board.user.display_name}さんの投稿(投稿)を見ました！`,
                url: `https://htnmk.com/@${board.user.username}/boards/${board.id_str}`,
            });
        } catch (err) {
            console.log(err);
        }
    });

    icon = document.createElement("img");
    icon.src = "/static/img/share.svg";
    icon.className = "svg";
    icon.width = "27";
    actionElement.appendChild(icon);

    boardActions.appendChild(actionElement);

    // Append all sections to the board
    boardElement.appendChild(boardProfile);
    boardElement.appendChild(boardContent);
    boardElement.appendChild(boardAttachments);
    boardElement.appendChild(boardDate);
    boardElement.appendChild(boardActions);

    // Append the board to the body or a specific container
    document.getElementById("boardInfo").appendChild(boardElement);
}

socket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    console.log(message);
    if (message.type == "board") {
        if (message.data.reply_id_str == boardId) {
            addPostToTimeline(message.data);
        }
    } else if (message.type == "liked") {
        document.querySelectorAll(`.LikeIcon-${message.data.board_id_str}`).forEach((icon) => {
            if (message.data.iliked) {
                icon.src = "/static/img/heart.svg";
                icon.classList.remove("svg");
            }else{
                icon.src = "/static/img/heart-outline.svg";
                icon.classList.add("svg");
            }
        });

        document.querySelectorAll(`.LikeCount-${message.data.board_id_str}`).forEach((count) => {
            count.textContent = message.data.count;
        });
    }
};

async function processReplies(replyData) {
    if (replyData != null) {
        // まずネストされたreplyを再帰的に処理
        if (replyData.reply != null) {
            await processReplies(replyData.reply);
        }

        // 最深部から順に処理
        await addPostToPage(replyData, true);
        console.log(replyData);
    }
}

async function loadBoard(boardId) {
    const response = await fetch(`/api/boards/${boardId}`, {
        headers: {
            "Authorization": `Bearer ${getCookie("token")}`
        }
    });
    const jsonData = await response.json();

    document.getElementById("boardInfo").innerHTML = "";

    if (jsonData.reply != null) {
        await processReplies(jsonData.reply);
    }

    await addPostToPage(jsonData);
}

var noLoadingRequired = false;

async function loadReplys(page = 0, clear = false, reverse = false, arrrev = true) {
    if (clear) {
        document.getElementById("boards").innerHTML = '<div style="display: flex; justify-content: center; align-items: center;"><div class="loading"></div></div>';
    }

    const response = await fetch(`/api/boards/${boardId}/replys?page=${page}`, {
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

var boardId = window.location.pathname.split("/")[3];

document.getElementById("replyForm").onsubmit = (event) => {
    event.stopPropagation(); // Prevent the default form submission
    event.preventDefault()
    event.submitter.disabled = true;

    const formData = new FormData(event.target); // Create a FormData object from the form
    formData.append("replyId", boardId);
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
        event.target.reset();
        event.submitter.disabled = false;
    })
    .catch(error => {
        // Handle error
        console.error('Error:', error);
        document.getElementById('replyError').textContent = 'An error occurred. Please try again.';
        event.submitter.disabled = false;
    });
}

socket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    console.log(message);
    if (message.type == "board") {
        if (message.data.reply_id_str == boardId) {
            addPostToTimeline(message.data);
        }
    } else if (message.type == "liked") {
        document.querySelectorAll(`.LikeIcon-${message.data.board_id_str}`).forEach((icon) => {
            if (message.data.iliked) {
                icon.src = "/static/img/heart.svg";
                icon.classList.remove("svg");
            }else{
                icon.src = "/static/img/heart-outline.svg";
                icon.classList.add("svg");
            }
        });

        document.querySelectorAll(`.LikeCount-${message.data.board_id_str}`).forEach((count) => {
            count.textContent = message.data.count;
        });
    }
};

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
        loadReplys(currentPage, false, true, false).then(() => {
            loadingElement.remove();
            loading = false;
        })
    }
}, {passive: true});

document.querySelector(".postButton").style = "display: none";
document.title = `ボード - Nyanfeed`;

loadBoard(boardId);
loadReplys(0, true, false, true);
