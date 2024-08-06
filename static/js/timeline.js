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
        return '数秒前';
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

function addPostToTimeline(board) {
    // Create the main board div
    const boardElement = document.createElement('div');
    boardElement.classList.add('board');
    boardElement.setAttribute("x-nyanfeed-board-id", BigInt(board.id));

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
    boardProfile.appendChild(boardDate);

    // Create the content section
    const boardContent = document.createElement('div');
    boardContent.classList.add('board-content');
    boardContent.innerHTML = board.content;

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
        imageElement = document.createElement("img");
        imageElement.src = `https://r2.htnmk.com/${file}`;
        imageElement.loading = "lazy";
        boardAttachments.append(imageElement);
        console.log(file);
    })

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
    count.innerText = "0";
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
    count.innerText = "0";
    actionElement.appendChild(count);

    boardActions.appendChild(actionElement);

    // いいね
    actionElement = document.createElement("div");
    actionElement.className = "board-action";
    actionElement.title = "いいね";

    icon = document.createElement("img");
    icon.src = "/static/img/heart-outline.svg";
    icon.className = "svg";
    icon.width = "27";
    icon.loading = "lazy";
    actionElement.appendChild(icon);

    count = document.createElement("span");
    count.className = "board-count";
    count.innerText = "0";
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
                url: `https://htnmk.com/@${board.user.username}/boards/${BigInt(board.id)}`,
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
    document.getElementById("boards").prepend(boardElement);
}

socket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    console.log(message);
    if (message.type == "board"){
        addPostToTimeline(message.data);
    }
};

async function loadBoards() {
    response = await fetch("/api/timeline/latest");
    jsonData = await response.json();

    jsonData.slice().reverse().forEach(board => {
        addPostToTimeline(board);
    });
}

loadBoards();
