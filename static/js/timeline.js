async function loadBoards() {
    response = await fetch("/api/timeline/latest");
    jsonData = await response.json();

    jsonData.slice().reverse().forEach(board => {
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

        // Append profile icon and profileName to boardProfile
        boardProfile.appendChild(profileIcon);
        boardProfile.appendChild(profileName);

        // Create the content section
        const boardContent = document.createElement('div');
        boardContent.classList.add('board-content');
        boardContent.textContent = board.content;

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
        actionElement.appendChild(icon);

        boardActions.appendChild(actionElement);

        // シェア
        actionElement = document.createElement("div");
        actionElement.className = "board-action";
        actionElement.title = "シェア";
        actionElement.addEventListener("click", async () => {
            try {
                await navigator.share({
                    title: "MDN",
                    text: "Learn web development on MDN!",
                    url: "https://developer.mozilla.org",
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
        document.getElementById("boards").appendChild(boardElement);
    });
}

loadBoards();
