function getCookie(name) {
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
}

function timeAgo(date) {
    const now = new Date();
    const diff = now - date; // 差分をミリ秒で計算

    const minute = 60 * 1000; // 1分のミリ秒数
    const hour = 60 * minute; // 1時間のミリ秒数
    const day = 24 * hour;    // 1日のミリ秒数
    const week = 7 * day;     // 1週間のミリ秒数
    const month = 30 * day;   // 1ヶ月のミリ秒数（おおよそ）
    const year = 365 * day;   // 1年のミリ秒数（おおよそ）

    if (diff < minute) {
        const seconds = Math.floor(diff / 1000);
        return `${seconds}秒前`;
    } else if (diff < hour) {
        const minutes = Math.floor(diff / minute);
        return `${minutes}分前`;
    } else if (diff < day) {
        const hours = Math.floor(diff / hour);
        return `${hours}時間前`;
    } else if (diff < week) {
        const days = Math.floor(diff / day);
        return `${days}日前`;
    } else if (diff < month) {
        const weeks = Math.floor(diff / week);
        return `${weeks}週間前`;
    } else if (diff < year) {
        const months = Math.floor(diff / month);
        return `${months}ヶ月前`;
    } else {
        const years = Math.floor(diff / year);
        return `${years}年前`;
    }
}

function addPostToTimeline(board, reverse = false) {
    if (document.querySelector(`[x-nyanfeed-board-id="${board.id_str}"]`)) {
        return;
    }

    // Create the main board div
    const boardElement = document.createElement('div');
    boardElement.classList.add('board');
    boardElement.setAttribute("x-nyanfeed-board-id", board.id_str);

    const boardReply = document.createElement("div");

    if (board.reply != null) {
        const boardReply = document.createElement("div");
        boardReply.className = "board-replyed-to";
        boardReply.innerHTML = `返信先: <a onclick="router('/@${board.reply.user.username}', 'user');">@${board.reply.user.username}</a>`;
        boardElement.appendChild(boardReply);
    }else if (board.reboard != null) {
        const boardReply = document.createElement("div");
        boardReply.className = "board-replyed-to";
        boardReply.innerHTML = `<a onclick="router('/@${board.reboard.user.username}', 'user');">${board.reboard.user.display_name} さんがリボードしました</a>`;
        boardElement.appendChild(boardReply);
    }

    // Create the profile section
    const boardProfile = document.createElement('div');
    boardProfile.classList.add('board-profile');

    const profileIcon = document.createElement('img');
    profileIcon.classList.add('profile-icon');
    profileIcon.src = board.user.icon;
    profileIcon.alt = 'icon';
    profileIcon.loading = "lazy";

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

    createdAt = new Date(board.created_at)

    const boardDate = document.createElement('div');
    boardDate.classList.add('board-date');
    boardDate.title = createdAt;
    boardDate.textContent = timeAgo(createdAt);

    // Append profile icon and profileName to boardProfile
    boardProfile.appendChild(profileIcon);
    boardProfile.appendChild(profileName);
    if (board.user.badge !== null){
        let badge = document.createElement("img");
        badge.className = "badge";
        badge.src = `https://r2.htnmk.com/badges/${board.user.badge}.svg`;
        badge.width = "20";
        badge.loading = "lazy";
        boardProfile.appendChild(badge);
    }
    boardProfile.appendChild(boardDate);

    // Create the content section
    const boardContent = document.createElement('div');
    boardContent.classList.add('board-content');
    boardContent.innerHTML = board.content;
    boardContent.onclick = async () => {
        await router(`/@${board.user.username}/boards/${board.id_str}`, "board");
    };

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

    // Create the actions section
    const boardActions = document.createElement('div');
    boardActions.classList.add('board-actions');

    // 返信
    let actionElement = document.createElement("div");
    actionElement.className = "board-action";
    actionElement.title = "返信";
    actionElement.onclick = async () => {
        await router(`/@${board.user.username}/boards/${board.id_str}`, "board");
    }

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
    boardElement.appendChild(boardActions);

    // Append the board to the body or a specific container
    if (!reverse){
        document.getElementById("boards").prepend(boardElement);
    }else{
        document.getElementById("boards").appendChild(boardElement);
    }
}

socket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    console.log(message);
    if (message.type == "board") {
        addPostToTimeline(message.data);
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

var noLoadingRequired = false;

async function loadBoards(page = 0, clear = false, reverse = false, arrrev = true) {
    if (clear) {
        document.getElementById("boards").innerHTML = '<div style="display: flex; justify-content: center; align-items: center;"><div class="loading"></div></div>';
    }

    const response = await fetch(`/api/timeline/latest?page=${page}`, {
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

    console.log(jsonData);
    if (jsonData.length <= 0) {
        console.log("a");
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
    if (window.location.pathname == "/home" && !loading && !noLoadingRequired && document.getElementById("scrollevent").scrollHeight - document.getElementById("scrollevent").scrollTop <= document.getElementById("scrollevent").clientHeight) {
        loading = true;
        let loadingElement = document.createElement("div");
        loadingElement.style = "display: flex; justify-content: center; align-items: center;";
        loadingElement.innerHTML = '<div class="loading"></div>';
        document.getElementById("boards").append(loadingElement);
        currentPage += 1;
        loadBoards(currentPage, false, true, false).then(() => {
            loadingElement.remove();
            loading = false;
        })
    }
}, {passive: true});

if (window.location.pathname == "/home") {
    document.querySelector(".postButton").style = "";
    loadBoards(0, true, false, true);
}
