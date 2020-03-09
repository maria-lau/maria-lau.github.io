const express = require("express");
const app = express();
const server = require('http').createServer(app);
const AnimalAvatar = require("animal-avatars.js");
const cookieParser = require('cookie-parser');
const io = require('socket.io')(server);

let nameAvatarList = {}; // key = username, value = avatarUrl
let idNameList = {}; // key = socket.id, value = username
let idColourList = {}; // key = socket.id, value = hex colour code
let messageList = []; // list of messages in chat

app.use(cookieParser());

// set a cookie if new session
app.use(function (req, res, next) {
    var username = req.cookies['username'];
    if (username === undefined) {
        let newAvatar = new AnimalAvatar();
        while (newAvatar.getAvatarName() in nameAvatarList) {
            newAvatar = new AnimalAvatar();
        }
        let userTextColour = '#' + Math.floor(Math.random() * 16777215).toString(16);
        res.cookie('username', newAvatar.getAvatarName(), { maxAge: 900000, httpOnly: false }); // expiry set to 15 minutes
        res.cookie('avatarURL', newAvatar.getAvatarUrl());
        res.cookie('userTextColour', userTextColour);
    }
    next();
});

app.use(express.static("public", { index: "chat.html" }));

io.on('connection', function (socket) {

    socket.on('addUser', function (username, avatarUrl, userTextColour) {
        idNameList[socket.id] = username;
        nameAvatarList[username] = avatarUrl;
        idColourList[socket.id] = userTextColour;
        // update user list on client 
        io.emit('userListUpdate', nameAvatarList);
        console.log(username + ' connected');
    });

    socket.on('usernameChange', function (newUsername) {
        if (newUsername in nameAvatarList) {
            socket.emit('usernameTaken', newUsername);
        } else {
            oldUsername = idNameList[socket.id];
            avatarUrl = nameAvatarList[oldUsername];
            idNameList[socket.id] = newUsername;
            nameAvatarList[newUsername] = avatarUrl;
            delete nameAvatarList[oldUsername];
            updateMessageListWithNewUsername(oldUsername, newUsername);
            // update user list on client
            socket.emit('usernameChangeSuccess', newUsername)
            io.emit('userListUpdate', nameAvatarList);
            io.emit('chatHistory', messageList);
        }
    });

    socket.on('textColourChange', function (newTextColour) {
        oldTextColour = idColourList[socket.id];
        idColourList[socket.id] = newTextColour;
        updateMessageListWithNewTextColour(oldTextColour, newTextColour);
        // update user list on client
        socket.emit('textColourChangeSuccess', newTextColour)
        io.emit('chatHistory', messageList);
    });

    socket.on('getChatHistory', function () {
        if (messageList.length > 0) {
            socket.emit('chatHistory', messageList);
        }
    });

    socket.on('chatMessage', function (msg) {
        if (messageList.length >= 200) { // server only needs to remember last 200 messages
            messageList.shift();
        }
        let newMessage = new Date().toString() + ";";
        newMessage += idNameList[socket.id] + ";";
        newMessage += nameAvatarList[idNameList[socket.id]] + ";";
        newMessage += idColourList[socket.id] + ";";
        newMessage += msg;
        messageList.push(newMessage);

        io.emit('newChatMessage', newMessage);
    });

    socket.on('disconnect', function () {
        username = idNameList[socket.id];
        delete idNameList[socket.id];
        delete nameAvatarList[username];
        delete idColourList[socket.id];
        // update user list on client 
        io.emit('userListUpdate', nameAvatarList);
        console.log(username + ' disconnected');
    });
});

server.listen(3000, function () {
    console.log('listening on *:3000');
});

function updateMessageListWithNewUsername(oldUsername, newUsername) {
    for (let i = 0; i < messageList.length; i++) {
        let messageContents = messageList[i].split(';');
        if (messageContents[1].includes(oldUsername)) {
            messageContents[1] = messageContents[1].replace(oldUsername, newUsername);
            messageList[i] = messageContents.join(';')
        }
    }
}

function updateMessageListWithNewTextColour(oldTextColour, newTextColour) {
    for (let i = 0; i < messageList.length; i++) {
        let messageContents = messageList[i].split(';');
        if (messageContents[3] === oldTextColour) {
            messageContents[3] = newTextColour;
            messageList[i] = messageContents.join(';')
        }
    }
}
