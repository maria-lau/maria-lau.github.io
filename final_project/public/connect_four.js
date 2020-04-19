$(document).ready(function () {
    let socket = io();
    let username = decodeURIComponent(getCookieValue('username'));
    const avatarUrl = decodeURIComponent(getCookieValue('avatarURL'));
    let colorTheme = decodeURIComponent(getCookieValue('colorTheme'));
    const numString = { 1: "one", 2: "two" };
    let gameId = "";
    let playerNum = null;
    let playerTurn = null;

    socket.emit('addUser', username, avatarUrl, colorTheme);

    // variables
    let joinCodeInput = document.getElementById("join-code-text");
    let joinGameButton = document.getElementById("join-game-button");

    // update color theme
    updateColorTheme(colorTheme);

    function updateColorTheme(colorTheme) {
        if (colorTheme === "rosegold") {
            changeThemeRoseGold();
        } else if (colorTheme === "aurora") {
            changeThemeAurora();
        } else {
            changeThemeOcean();
        }
    };

    // setup event listeners
    joinCodeInput.addEventListener("keyup", function (event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            if (joinCodeInput.value.length == 0) {
                alert('Please type a join code to join an existing game.');
                return;
            }
            event.preventDefault();
            joinGameButton.click();
        }
    });

    $("#join-game-button").click(function () {
        if (joinCodeInput.value.length == 0) {
            alert('Please type a join code to join an existing game.');
        } else {
            socket.emit('joinGame', joinCodeInput.value);
        }
    });

    $("#new-game-button").click(function () {
        socket.emit('newGame');
        $("#start-content-wrap").hide();
        $("#game-content-wrap").show();
        $("#opponents-turn").hide();
        $("i.arrow").hide();
    });

    $("#random-game-button").click(function () {
        socket.emit('newRandomGame');
        $("#start-content-wrap").hide();
        $("#game-content-wrap").show();
        $("#opponents-turn").hide();
        $("i.arrow").hide();
    });

    $("#change-name-button").click(function () {
        let newName = prompt("Enter a new username:");
        if (newName != null && newName != "") {
            socket.emit('usernameChange', username, newName);
        }
    });

    $("#change-theme-rosegold-button").click(function () {
        changeThemeRoseGold();
    });

    function changeThemeRoseGold(){
        document.cookie = "colorTheme=rosegold;"
        colorTheme = "rosegold";
        $("#background").removeClass().addClass("background background-rosegold");
        $("#start-content-wrap").removeClass().addClass("start-content-wrap-rosegold");
        $("#disabled").removeClass().addClass("disabled-rosegold");
        $("#game-content-wrap").removeClass().addClass("game-content-wrap-rosegold");
        $("#opponents-turn").removeClass().addClass("opponents-turn-rosegold");
        $("h1").removeClass().addClass("rosegold");
        $("#board").removeClass().addClass("board board-rosegold flex-row");
        $(".game-column").removeClass().addClass("game-column game-column-rosegold flex-column");
        $(".slot").each(function() {
            let oldClass = $(this).attr('class');
            let newClass = oldClass.replace(/aurora/g, "rosegold");
            newClass = newClass.replace(/ocean/g, "rosegold");
            $(this).attr('class', newClass);
        });
        $(".start-button").removeClass().addClass("start-button start-button-rosegold");
        $("li>p#you").removeClass().addClass("you-rosegold");
    }

    $("#change-theme-aurora-button").click(function () {
        changeThemeAurora();
    });

    function changeThemeAurora(){
        document.cookie = "colorTheme=aurora;"
        colorTheme = "aurora";
        $("#background").removeClass().addClass("background background-aurora");
        $("#start-content-wrap").removeClass().addClass("start-content-wrap-aurora");
        $("#disabled").removeClass().addClass("disabled-aurora");
        $("#game-content-wrap").removeClass().addClass("game-content-wrap-aurora");
        $("#opponents-turn").removeClass().addClass("opponents-turn-aurora");
        $("h1").removeClass().addClass("aurora");
        $("#board").removeClass().addClass("board board-aurora flex-row");
        $(".game-column").removeClass().addClass("game-column game-column-aurora flex-column");
        $(".slot").each(function() {
            let oldClass = $(this).attr('class');
            let newClass = oldClass.replace(/rosegold/g, "aurora");
            newClass = newClass.replace(/ocean/g, "aurora");
            $(this).attr('class', newClass);
        });
        $(".start-button").removeClass().addClass("start-button start-button-aurora");
        $("li>p#you").removeClass().addClass("you-aurora");
    }

    $("#change-theme-ocean-button").click(function () {
        changeThemeOcean();
    });

    function changeThemeOcean(){
        document.cookie = "colorTheme=ocean;"
        colorTheme = "ocean";
        $("#background").removeClass().addClass("background background-ocean");
        $("#start-content-wrap").removeClass().addClass("start-content-wrap-ocean");
        $("#disabled").removeClass().addClass("disabled-ocean");
        $("#game-content-wrap").removeClass().addClass("game-content-wrap-ocean");
        $("#opponents-turn").removeClass().addClass("opponents-turn-ocean");
        $("h1").removeClass().addClass("ocean");
        $("#board").removeClass().addClass("board board-ocean flex-row");
        $(".game-column").removeClass().addClass("game-column game-column-ocean flex-column");
        $(".slot").each(function() {
            let oldClass = $(this).attr('class');
            let newClass = oldClass.replace(/rosegold/g, "ocean");
            newClass = newClass.replace(/aurora/g, "ocean");
            $(this).attr('class', newClass);
        });
        $(".start-button").removeClass().addClass("start-button start-button-ocean");
        $("li>p#you").removeClass().addClass("you-ocean");
    }

    $("#col1").mouseover(function () {
        $("#arrow1").css("border-color", "#B69E90");
    }).mouseout(function () {
        $("#arrow1").css("border-color", "#FFFFFF");
    }).click(function () {
        if (playerNum !== playerTurn) {
            return;
        }
        if ($('#16').attr('class') !== ("slot slot-" + colorTheme)) {
            alert('Invalid move. Column is full.');
        } else {
            socket.emit('insertToken', gameId, playerNum, 1);
        }
    });

    $("#col2").mouseover(function () {
        $("#arrow2").css("border-color", "#B69E90");
    }).mouseout(function () {
        $("#arrow2").css("border-color", "#FFFFFF");
    }).click(function () {
        if (playerNum !== playerTurn) {
            return;
        }
        if ($('#26').attr('class') !== ("slot slot-" + colorTheme)) {
            alert('Invalid move. Column is full.');
        } else {
            socket.emit('insertToken', gameId, playerNum, 2);
        }
    });

    $("#col3").mouseover(function () {
        $("#arrow3").css("border-color", "#B69E90");
    }).mouseout(function () {
        $("#arrow3").css("border-color", "#FFFFFF");
    }).click(function () {
        if (playerNum !== playerTurn) {
            return;
        }
        if ($('#36').attr('class') !== ("slot slot-" + colorTheme)) {
            alert('Invalid move. Column is full.');
        } else {
            socket.emit('insertToken', gameId, playerNum, 3);
        }
    });

    $("#col4").mouseover(function () {
        $("#arrow4").css("border-color", "#B69E90");
    }).mouseout(function () {
        $("#arrow4").css("border-color", "#FFFFFF");
    }).click(function () {
        if (playerNum !== playerTurn) {
            return;
        }
        if ($('#46').attr('class') !== ("slot slot-" + colorTheme)) {
            alert('Invalid move. Column is full.');
        } else {
            socket.emit('insertToken', gameId, playerNum, 4);
        }
    });

    $("#col5").mouseover(function () {
        $("#arrow5").css("border-color", "#B69E90");
    }).mouseout(function () {
        $("#arrow5").css("border-color", "#FFFFFF");
    }).click(function () {
        if (playerNum !== playerTurn) {
            return;
        }
        if ($('#56').attr('class') !== ("slot slot-" + colorTheme)) {
            alert('Invalid move. Column is full.');
        } else {
            socket.emit('insertToken', gameId, playerNum, 5);
        }
    });

    $("#col6").mouseover(function () {
        $("#arrow6").css("border-color", "#B69E90");
    }).mouseout(function () {
        $("#arrow6").css("border-color", "#FFFFFF");
    }).click(function () {
        if (playerNum !== playerTurn) {
            return;
        }
        if ($('#66').attr('class') !== ("slot slot-" + colorTheme)) {
            alert('Invalid move. Column is full.');
        } else {
            socket.emit('insertToken', gameId, playerNum, 6);
        }
    });

    $("#col7").mouseover(function () {
        $("#arrow7").css("border-color", "#B69E90");
    }).mouseout(function () {
        $("#arrow7").css("border-color", "#FFFFFF");
    }).click(function () {
        if (playerNum !== playerTurn) {
            return;
        }
        if ($('#76').attr('class') !== ("slot slot-" + colorTheme)) {
            alert('Invalid move. Column is full.');
        } else {
            socket.emit('insertToken', gameId, playerNum, 7);
        }
    });

    socket.on('startedNewGame', function (Id) {
        gameId = Id;
        playerNum = 1;

        $('#disabled-title').text('Game Code: ' + Id);

        let playerListHtml = '<li><img class="avatar" src="' + avatarUrl + '">' +
            '<p class="username">' + username + '</p> <p id="you" class="you-' + colorTheme + '">(you)</p></li>';

        $('.player-list').html(playerListHtml);
    });

    socket.on('startedNewRandomGame', function (Id) {
        gameId = Id;
        playerNum = 1;

        $('#disabled-title').text('Finding a Random Game to Join');
        $('#disabled-explanation').text('As soon as a player becomes available for random pairing, your game will begin.');

        let playerListHtml = '<li><img class="avatar" src="' + avatarUrl + '">' +
            '<p class="username">' + username + '</p> <p id="you" class="you-' + colorTheme + '">(you)</p></li>';

        $('.player-list').html(playerListHtml);
    });

    socket.on('nonExistentCode', function () {
        alert("Sorry, that join code doesn't. Please double check and try again.");
    });

    socket.on('gameFull', function (playerList) {
        let message = "Sorry, the game you are trying to enter is already full. Users:\n";
        for (let name in playerList) {
            message += name + " and ";
        }
        message = message.slice(0, -5);
        message += "\nare currently in the game.";
        alert(message);
    });

    socket.on('successfullyJoinedGame', function () {
        $("#start-content-wrap").hide();
        $("#opponents-turn").hide();
        $("#game-content-wrap").show();
        playerNum = 2;
    });

    socket.on('joinedGame', function (Id, playerList) {
        gameId = Id;

        $("#disabled").hide();
        $("i.arrow").show();

        let playerListHtml = "";
        for (let name in playerList) {
            playerListHtml += '<li><img class="avatar" src="' + playerList[name] + '"><p class="username">' + name;
            if (name == username) {
                playerListHtml += '</p> <p id="you" class="you-' + colorTheme + '">(you)';
            }
            playerListHtml += '</p></li>';
        }
        $('.player-list').html(playerListHtml);
    });

    socket.on('invalidMove', function (slotStates) {
        alert('Invalid move. Column is full.');
        updateSlots(slotStates);
    });

    socket.on('gameCanceled', function () {
        alert('Opponent has left the game or was disconnected. The game has been canceled. Refresh the page to restart.');
        socket.disconnect(true);
    });

    socket.on('nextTurn', function (turn, slotStates) {
        playerTurn = turn;
        $("#slot-colour").removeClass();
        let newClass = "slot slot-" + colorTheme + " slot-player-" + numString[turn] + "-" + colorTheme;
        $("#slot-colour").addClass(newClass);

        if (turn === playerNum) {
            $('#turn').text('Your Turn');
            $("#opponents-turn").hide();
        } else {
            $('#turn').text('Opponents Turn');
            $("#opponents-turn").show();
        }

        updateSlots(slotStates);
    });

    socket.on('gameWon', function (playerNumber, slotStates) {
        updateSlots(slotStates);

        if (playerNumber == playerNum) {
            $("i.arrow").hide();
            $('#disabled-title').text("You Win! :)");
            $('#disabled-explanation').text("Congratulations, you've won the game! Refresh the page if you'd like to start a new game or join an existing one.");
            $("#disabled").show();
        } else {
            $("i.arrow").hide();
            $("#opponents-turn").hide();
            $('#disabled-title').text("You Lose! :(");
            $('#disabled-explanation').text("Sorry, you've lost the game! Refresh the page if you'd like to start a new game or join an existing one.");
            $("#disabled").show();
        }
    });

    socket.on('usernameChangeSuccess', function (newUsername) {
        document.cookie = "username=" + newUsername + ";";
        username = newUsername;
    });

    socket.on('usernameTaken', function (username) {
        alert('Username: ' + username + ' already in use. Could not be changed.')
    });

    socket.on('updatePlayerNames', function (playerList) {
        let playerListHtml = "";
        for (let name in playerList) {
            playerListHtml += '<li><img class="avatar" src="' + playerList[name] + '"><p class="username">' + name;
            if (name == username) {
                playerListHtml += '</p> <p id="you" class="you-' + colorTheme + '">(you)';
            }
            playerListHtml += '</p></li>';
        }
        $('.player-list').html(playerListHtml);
    });

    socket.on('disconnect', () => {
        // reconnect if it is accidentally disconnected
        // socket.open();

        $("i.arrow").hide();
        $("#opponents-turn").hide();
        $('#disabled-title').text('Refresh Page to Restart');
        $('#disabled-explanation').text('Opponent has left the game or was disconnected. The game has been canceled.');
        $("#disabled").show();
    });

    function updateSlots(slotStates) {
        for (let slotId in slotStates) {
            let slot = "#" + slotId;
            $(slot).removeClass();

            let slotState = slotStates[slotId];
            if (slotState === 0) {
                $(slot).addClass("slot slot-" + colorTheme);
            } else {
                let newClass = "slot slot-" + colorTheme + " slot-player-" + numString[slotState] + "-" + colorTheme;
                $(slot).addClass(newClass);
            }
        }
    }
});


function getCookieValue(key) {
    var value = document.cookie.match(key + '=([^;]+)');
    return value ? value.pop() : '';
}
