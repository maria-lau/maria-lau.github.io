const express = require("express");
const app = express();
const server = require('http').createServer(app);
const AnimalAvatar = require("animal-avatars.js");
const cookieParser = require('cookie-parser');
const io = require('socket.io')(server);

let userSocketList = {}; // key = username, value = socket.id
let userList = {}; // key = username, value = { avatarUrl, colorTheme}
let gameList = {}; // key = gameId, value = [username]
let userGameList = {}; // key = username, value = gameId
let gameState = {};
let slotIds = [
    "11", "12", "13", "14", "15", "16",
    "21", "22", "23", "24", "25", "26",
    "31", "32", "33", "34", "35", "36",
    "41", "42", "43", "44", "45", "46",
    "51", "52", "53", "54", "55", "56",
    "61", "62", "63", "64", "65", "66",
    "71", "72", "73", "74", "75", "76"
];
let randomGameId = ""; // if not "", then random game is waiting on player


app.use(cookieParser());

// set a cookie if new session
app.use(function (req, res, next) {
    var username = req.cookies['username'];
    if (username === undefined) {
        let newAvatar = new AnimalAvatar();
        while (userSocketList[newAvatar.getAvatarName()]) {
            newAvatar = new AnimalAvatar();
        }
        res.cookie('username', newAvatar.getAvatarName(), { maxAge: 3600000, httpOnly: false }); // expiry set to 60 minutes
        res.cookie('avatarURL', newAvatar.getAvatarUrl());
        res.cookie('colorTheme', "rosegold");
    }
    next();
});

app.use(express.static("public", { index: "connect_four.html" }));

io.on('connection', function (socket) {

    socket.on('addUser', function (name, url, color) {
        userSocketList[name] = socket.id;
        if (!userList[name]) {
            userList[name] = {
                avatarUrl: url,
                colorTheme: color
            };
            console.log(name + ' connected');
        } else {
            userList[name].colorTheme = color;
            console.log(name + ' re-connected');
        }
    });

    socket.on('usernameChange', function(oldName, newName){
        if(userSocketList[newName]){
            socket.emit('usernameTaken', newName);
            return;
        }else{
            // change userSocketList
            userSocketList[newName] = userSocketList[oldName];
            delete userSocketList[oldName];

            // change userList
            let url = userList[oldName].avatarUrl;
            let color = userList[oldName].colorTheme;
            userList[newName] = {
                avatarUrl: url,
                colorTheme: color
            };
            delete userList[oldName];

            // change userGameList
            let gameId = userGameList[oldName];
            userGameList[newName] = gameId;
            delete userGameList[oldName];

            // change gameList
            let oldNameIndex = gameList[gameId].indexOf(oldName);
            if(oldNameIndex > -1){
                gameList[gameId].splice(oldNameIndex, 1);
            }
            gameList[gameId].push(newName);

            socket.emit('usernameChangeSuccess', newName);

            let playerList = getGameUsers(gameId);
            io.to(gameId).emit('updatePlayerNames', playerList)
            console.log(oldName + ' successfully changed their username to ' + newName);
        }
    });

    socket.on('newGame', function () {
        cleanUpExistingGames(socket.id);
        let currentPlayerName = getUsernameFromSocketId(socket.id);

        let newGameId = generateGameId();
        socket.join(newGameId);
        gameList[newGameId] = [currentPlayerName];
        userGameList[currentPlayerName] = newGameId;
        socket.emit('startedNewGame', newGameId);

        // create board
        newBoard(newGameId);

        // console.log(userGameList);
        // console.log(gameList);
        // console.log(io.sockets.adapter.rooms);
    });

    socket.on('joinGame', function (joinCode) {
        // joinCode doesn't exist
        if (!gameList[joinCode] || gameList[joinCode].length == 0) {
            socket.emit('nonExistentCode')
            return;
        }

        if (gameList[joinCode].length > 1) {
            let playerList = getGameUsers(joinCode)
            socket.emit('gameFull', playerList)
            return;
        }

        cleanUpExistingGames(socket.id);
        let currentPlayerName = getUsernameFromSocketId(socket.id);

        socket.join(joinCode);
        socket.emit('successfullyJoinedGame');

        gameList[joinCode].push(currentPlayerName);
        userGameList[currentPlayerName] = joinCode;

        let playerList = getGameUsers(joinCode);
        io.to(joinCode).emit('joinedGame', joinCode, playerList);
        io.to(joinCode).emit('nextTurn', gameState[joinCode].turn, gameState[joinCode].slotStates);
    });

    socket.on('newRandomGame', function () {
        cleanUpExistingGames(socket.id);
        let currentPlayerName = getUsernameFromSocketId(socket.id);
        if(randomGameId === ""){
            randomGameId = generateGameId();
            socket.join(randomGameId);
            gameList[randomGameId] = [currentPlayerName];
            userGameList[currentPlayerName] = randomGameId;
            socket.emit('startedNewRandomGame', randomGameId);

            // create board
            newBoard(randomGameId);
        }else{
            socket.join(randomGameId);
            socket.emit('successfullyJoinedGame');

            gameList[randomGameId].push(currentPlayerName);
            userGameList[currentPlayerName] = randomGameId;

            let playerList = getGameUsers(randomGameId);
            io.to(randomGameId).emit('joinedGame', randomGameId, playerList);
            io.to(randomGameId).emit('nextTurn', gameState[randomGameId].turn, gameState[randomGameId].slotStates);
            randomGameId = "";
        }
    });

    socket.on('insertToken', function (gameId, playerNum, col1) {
        let slotId = getSlotId(gameId, col1);

        if (gameState[gameId].slotStates[slotId.toString()] !== 0) {
            socket.emit('invalidMove', gameState[gameId].slotStates);
            return;
        }

        gameState[gameId].slotStates[slotId.toString()] = playerNum;
        if(checkForWin(gameId, playerNum, slotId)){
            io.to(gameId).emit('gameWon', playerNum, gameState[gameId].slotStates);
            return;
        }

        gameState[gameId].turn = (playerNum == 2) ? 1 : 2;
        io.to(gameId).emit('nextTurn', gameState[gameId].turn, gameState[gameId].slotStates);
    });

    socket.on('disconnect', function () {
        cleanUpExistingGames(socket.id);
        let currentPlayerName = getUsernameFromSocketId(socket.id);
        console.log(currentPlayerName + ' disconnected');
    });

    function getSlotId(gameId, col1) {
        let slotId = col1 * 10 + 1;
        let maxSlotId = col1 * 10 + 6;
        while ((gameState[gameId].slotStates[slotId.toString()] !== 0) && (slotId <= maxSlotId)) {
            slotId += 1;
        }
        return slotId;
    }

    function checkForWin(gameId, playerNum, slotId){
        let numInRow = 1;
        // if slotId is row 4 or above, check for a vertical win
        for(let i = slotId - 1; i % 10 != 0 ; i--){
            if(gameState[gameId].slotStates[i.toString()] == playerNum){
                numInRow += 1;
                if(numInRow >= 4){
                    return true;
                }
            }else{
                numInRow = 0;
            }
        }

        // horizontal check
        numInRow = 0;
        let startSlot = (slotId % 10) + 10;
        for(let i = startSlot; i < 77; i+=10){
            if(gameState[gameId].slotStates[i.toString()] == playerNum){
                numInRow += 1;
                if(numInRow >= 4){
                    return true;
                }
            }else{
                numInRow = 0;
            }
        }

        // diagonal NW direction check
        // following slots do not have 4 possible slots diagonally in the NW direction,
        // so not posssible to be a winning slot for the NW diagonal.
        let nonWinningDiagonalSlots = [11, 12, 13, 21, 22, 31, 56, 65, 66, 74, 75, 76];
        if(!nonWinningDiagonalSlots.includes(slotId)){
            numInRow = 0;
            let diagonalSlotIds = getDiagonalNWSlotIds(slotId);
            for(let i = 0; i < diagonalSlotIds.length; i++){
                let iD = diagonalSlotIds[i];
                if(gameState[gameId].slotStates[iD.toString()] == playerNum){
                    numInRow += 1;
                    if(numInRow >= 4){
                        return true;
                    }
                }else{
                    numInRow = 0;
                }
            }
        }

        // diagonal NE direction check
        // following slots do not have 4 possible slots diagonally in the NE direction,
        // so not posssible to be a winning slot for the NE diagonal.
        nonWinningDiagonalSlots = [14, 15, 16, 25, 26, 36, 51, 61, 62, 71, 72, 73];
        if(!nonWinningDiagonalSlots.includes(slotId)){
            numInRow = 0;
            let diagonalSlotIds = getDiagonalNESlotIds(slotId);
            for(let i = 0; i < diagonalSlotIds.length; i++){
                let iD = diagonalSlotIds[i];
                if(gameState[gameId].slotStates[iD.toString()] == playerNum){
                    numInRow += 1;
                    if(numInRow >= 4){
                        return true;
                    }
                }else{
                    numInRow = 0;
                }
            }
        }
        return false;
    }

    function cleanUpExistingGames(socketId) {
        // if socket was in a game, let's clean up that game!
        let currentPlayerName = getUsernameFromSocketId(socketId);
        if (!userGameList[currentPlayerName]) {
            return;
        }
        console.log(currentPlayerName + " disconnected, but was in an existing game!");
        let gameId = userGameList[currentPlayerName];
        io.to(gameId).emit('gameCanceled');

        for (let player in gameList[gameId]) {
            let playerName = gameList[gameId][player];
            delete userGameList[playerName];
            console.log('removed user: ' + playerName + ' from gaame: ' + gameId)
        }
        delete gameList[gameId];
        delete gameState[gameId];
        console.log('deleted game: ' + gameId)
    }
});

server.listen(3000, function () {
    console.log('listening on *:3000');
});


function generateGameId() {
    let id = Math.random().toString(36).replace('0.', '').toUpperCase().substring(2, 8);
    while (gameList[id]) {
        id = Math.random().toString(36).replace('0.', '').toUpperCase().substring(2, 8);
    }
    return id;
}

function getGameUsers(gameId) {
    let users = {};
    for (let player in gameList[gameId]) {
        let playerName = gameList[gameId][player];
        let avatarUrl = userList[playerName].avatarUrl;
        users[playerName] = avatarUrl;
    }
    return users;
}

function getUsernameFromSocketId(socketId) {
    return Object.keys(userSocketList).find(key => userSocketList[key] === socketId);
}

function newBoard(gameId) {
    gameState[gameId] = {
        turn: 1,
        slotStates: {}
    };
    for (let i in slotIds) {
        gameState[gameId].slotStates[slotIds[i]] = 0;
    }
}

function getDiagonalNWSlotIds(slotId){
    let slotIds = [];
    for(let i = slotId; i < 74; i += 9){
        slotIds.push(i);
    }

    for(let i = slotId - 9; i > 13; i -= 9){
        slotIds.push(i);
    }

    slotIds.sort();
    return slotIds;
}

function getDiagonalNESlotIds(slotId){
    let slotIds = [];
    for(let i = slotId; i < 77; i += 11){
        slotIds.push(i);
    }

    for(let i = slotId - 11; i > 10; i -= 11){
        slotIds.push(i);
    }

    slotIds.sort();
    return slotIds;
}
