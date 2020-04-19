
$(document).ready(function () {
    let socket = io();
    let username = decodeURIComponent(getCookieValue('username'));
    const avatarUrl = decodeURIComponent(getCookieValue('avatarURL'));
    let userTextColour = decodeURIComponent(getCookieValue('userTextColour'));

    socket.emit('addUser', username, avatarUrl, userTextColour);
    socket.emit('getChatHistory');

    // set username, avatar, and text colour
    $('img#my-avatar').attr("src", avatarUrl);
    $('p#my-username').text(username);
    $('li>p.you').css("color", userTextColour);

    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        let message = $('.message').val();
        message = message.replace('\\', '\\\\');
        command = getSlashCommand(message);
        if (command != '') {
            if (command.command === "nick") {
                socket.emit('usernameChange', command.commandValue);
            } else if (command.command === "list" && command.commandValue === "commands") {
                alert('Commands:\n1. To change username, type `\\nick <new username>` \n2. To change font colour, type `\\nickcolor <hex color code>`');
            } else if (command.command === "nickcolor") {
                let newColour = command.commandValue;
                if (newColour.length === 6 && isHexColourCode(newColour)) {
                    newColour = "#" + newColour;
                    socket.emit('textColourChange', newColour);
                } else {
                    alert('Error, bad command:\nValue of new colour should be a 6 character hex-colour code.\nE.g. "\\nickcolor AA00FF"')
                }
            }
            else {
                alert('Error, bad command:\nCommand \"\\' + command.command + '\" which does not exist.')
            }
            $('.message').val('');
            return false;
        }
        message = message.replace(/;/g, '<semicolon>');
        socket.emit('chatMessage', message);
        $('.message').val('');
        return false;
    });

    socket.on('usernameChangeSuccess', function (newUsername) {
        username = newUsername;
        $('p#my-username').text(username);
    });

    socket.on('textColourChangeSuccess', function (newColour) {
        userTextColour = newColour
        $('li>p.you').css("color", userTextColour);
    });

    socket.on('usernameTaken', function (username) {
        alert('Username: ' + username + ' already in use. Could not be changed.')
    });

    socket.on('userListUpdate', function (users) {
        var userListHtml = "";
        for (let key in users) {
            userListHtml += '<li><img class="avatar" src="' + users[key] + '"><p class="username">' + key;
            if (key == username) {
                userListHtml += '</p> <p class="you">(you)';
            }
            userListHtml += '</p></li>';
        }
        $('.user-list').html(userListHtml);
        $('li>p.you').css("color", userTextColour);
    });

    socket.on('chatHistory', function (messageList) {
        let messageHtml = "";
        for (let i = 0; i < messageList.length; i++) {
            let messageContents = messageList[i].split(';');
            let msgDate = prettifyDateString(messageContents[0]);
            let msgAuthor = messageContents[1];
            let msgAvatarUrl = messageContents[2];
            let msgColour = messageContents[3];
            let msgString = messageContents[4].replace(/<semicolon>/g, ';');
            messageHtml += '<div class="chat-log-record flex-row"><p class="date">' + msgDate.toString() +
                '</p><img class="avatar" src="' + msgAvatarUrl + '">';
            if (msgAuthor === username) {
                messageHtml += '<p class="username" style="font-size:14px;">' + msgAuthor;
            } else {
                messageHtml += '<p class="username">' + msgAuthor;
            }
            messageHtml += '</p><p class="chat-log-message" style="color:' + msgColour + '">';
            if (msgAuthor === username) {
                messageHtml += '<b>' + msgString + '</b></p></div>';
            } else {
                messageHtml += msgString + '</p></div>';
            }
        }
        $('.chat-log').html(messageHtml);
        if ($(".chat-log-record")[0].offsetTop < 40) {
            $(".chat-log").removeClass("nonscrollable-chat");
            $(".chat-log").scrollTop($(".chat-log")[0].scrollHeight);
        }
    });

    socket.on('newChatMessage', function (msg) {
        let messageContents = msg.split(';');
        let msgDate = prettifyDateString(messageContents[0]);
        let msgAuthor = messageContents[1];
        let msgAvatarUrl = messageContents[2];
        let msgColour = messageContents[3];
        let msgString = messageContents[4].replace(/<semicolon>/g, ';');
        var messageHtml = '<div class="chat-log-record flex-row"><p class="date">' + msgDate.toString() +
            '</p><img class="avatar" src="' + msgAvatarUrl + '">';
        if (msgAuthor === username) {
            messageHtml += '<p class="username" style="font-size:14px;">' + msgAuthor;
        } else {
            messageHtml += '<p class="username">' + msgAuthor;
        }
        messageHtml += '</p><p class="chat-log-message" style="color:' + msgColour + '">';
        if (msgAuthor === username) {
            messageHtml += '<b>' + msgString + '</b></p></div>';
        } else {
            messageHtml += msgString + '</p></div>';
        }
        $('.chat-log').append(messageHtml);
        if ($(".chat-log-record")[0].offsetTop < 40) {
            $(".chat-log").removeClass("nonscrollable-chat");
            $(".chat-log").scrollTop($(".chat-log")[0].scrollHeight);
        }
    });

    socket.on('disconnect', () => {
        // reconnect if it is accidentally disconnected
        socket.open();
    });

});


function getCookieValue(key) {
    var value = document.cookie.match(key + '=([^;]+)');
    return value ? value.pop() : '';
}

function prettifyDateString(dateString) {
    let prettifiedString = "";
    let dt = new Date(dateString);
    let dateContents = dateString.split(' ');
    let month = dateContents[1];
    let day = dateContents[2];
    let year = dateContents[3];
    let hours = dt.getHours();
    let amOrPm = hours < 12 ? 'AM' : 'PM';
    hours = (hours % 12) || 12;
    let minutes = dt.getMinutes().toString();
    if (minutes.length == 1) {
        minutes = '0' + minutes;
    }
    let timezone = getTimeZoneAcronym(dateString.split('(')[1]);

    prettifiedString += day + "/" + month + "/" + year + " " + hours + ":" + minutes + amOrPm + " (" + timezone + ")"

    return prettifiedString;
}

function getTimeZoneAcronym(timezone) {
    let words = timezone.split(' ');
    timezoneAcronym = "";
    for (let i = 0; i < words.length; i++) {
        timezoneAcronym += words[i].charAt(0);
    }
    return timezoneAcronym;
}

function getSlashCommand(message) {
    let command = message.match(/\\\\(\S+)\s(.+)/);
    if (command) {
        let commandObject = {
            'command': command[1],
            'commandValue': command[2]
        }
        return commandObject;
    }
    else {
        return '';
    }
}

function isHexColourCode(hexValue) {
    hexMatch = hexValue.match(/^[0-9A-F]{6}$/i);
    return hexMatch === null ? false : true;
}
