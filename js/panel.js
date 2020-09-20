$(document).ready(() => {
    $("html").attr("lang", localeFile.locale);

    const guilds = $("#guilds");
    const embed = $("#embed");
    const channels = $("#channels");
    const channelNameLabel = $("#channelNameLabel");
    const channelName = $("#channelName");
    const chat = $("#chat");
    const toSend = $("#toSend");
    const lastMessages = $("#lastMessages");
    const clearChat = $("#clearChat");
    const send = $("#send");
    const guildName = $("#guildName");
    const leaveGuild = $("#leaveGuild");
    const inviteBtn = $("#inviteBtn");
    const dashboard = $("#dashboard");
    const refreshToken = $("#refreshToken");
    const refreshChat = $("#refreshChat");
    var isPubing = {};
    var embedMode = false;

    /*///////////////////////////////////////////
                    LOADING TRANSLATION
    //////////////////////////////////////////*/

    // Text
    channelNameLabel.html(localeFile.text.channelNameLabel);
    $("#animCheck").html(localeFile.text.scrollCheck);
    channelName.html(`<img class="avatarIMG" src='./img/icon/chat.png'> ${localeFile.text.channelNameLabel}`);

    // Headings
    guildName.html(`<img class="avatarIMG" src="./img/icon/info.png"> ${localeFile.headings.guildName}`);
    $("#autoScrollHead").html(localeFile.headings.autoScroll);
    $("#lastMessagesHead").html(`<img class="avatarIMG" src='./img/icon/clock.png'> ${localeFile.headings.lastMessages}`);
    $("#last").html(localeFile.headings.lastMessages);

    // Buttons
    refreshToken.html(`🔑 ${localeFile.buttons.editToken}`);
    refreshChat.html(`🔁 ${localeFile.buttons.refreshChat}`);
    $("#language").html(`🏳️ ${localeFile.buttons.changeLanguage}`);
    leaveGuild.html(`🚪 ${localeFile.buttons.leave}`);
    inviteBtn.html(`✉ ${localeFile.buttons.invite}`);
    dashboard.html(`✉ ${localeFile.text.dashboard}`);
    send.html(`↩ ${localeFile.buttons.send}`);
    clearChat.html(`♻ ${localeFile.buttons.clearLastMessages}`);

    // Formatting
    $("#bold").attr("title", localeFile.formatting.bold);
    $("#emphasis").attr("title", localeFile.formatting.emphasis);
    $("#underline").attr("title", localeFile.formatting.underline);
    $("#strike").attr("title", localeFile.formatting.strike);
    $("#clear").attr("title", localeFile.formatting.clear);

    /*///////////////////////////////////////////
                    FUNCTIONS
    //////////////////////////////////////////*/

    function contentReplacement(message) {
        return escapeHtml(message.content)
            .replace(/\n/g, "<br>")
            .replace(/(&lt;a:(.*?):(\d{18})&gt;)/g, `<img title="\$2" alt="" class="smallEmojiImg" src="https://cdn.discordapp.com/emojis/\$3" onclick="addText('\$1')">`)
            .replace(/(&lt;:(.*?):(\d{18})&gt;)/g, `<img title="\$2" alt="" class="smallEmojiImg" src="https://cdn.discordapp.com/emojis/\$3" onclick="addText('\$1')">`);
    }

    // This function creates a message to display in the chat, takes a Discord.Message as parameter
    function createMessage(message) {
        let userTag = escapeHtml(message.author.tag);
        let userId = message.author.id;
        let avatarUrl = message.author.avatarURL() || `./img/discord_defaults_avatars/${message.author.discriminator % 5}.png`; // Get the user's avatar, if not, find the color of his default avatar
        let userAvatar = `<a href="${avatarUrl}" target="_blank"><img alt="" src="${avatarUrl}" class="avatarIMG"></a>`;
        let creationDate = new Date(message.createdAt);
        let timestamp = `${creationDate.toLocaleDateString(localeFile.locale)} ${creationDate.toLocaleTimeString(localeFile.locale)}`;
        let html;
        let attachments = [];

        Array.from(message.attachments).forEach((attachment) => {
            let attachmentUrl = attachment[1].url;
            let attachmentTxt = `<a href="${escapeHtml(attachmentUrl)}" target="_blank">`;
            if (attachmentUrl.endsWith(".jpg") || attachmentUrl.endsWith(".jpeg") || attachmentUrl.endsWith(".png")) {
                attachmentTxt += localeFile.fileType.img;
            } else if (attachmentUrl.endsWith(".docx") || attachmentUrl.endsWith(".odt")) {
                attachmentTxt += localeFile.fileType.doc;
            } else if (attachmentUrl.endsWith(".mp4")) {
                attachmentTxt += localeFile.fileType.video;
            } else if (attachmentUrl.endsWith(".mp3")) {
                attachmentTxt += localeFile.fileType.audio;
            } else if (attachmentUrl.endsWith(".pdf")) {
                attachmentTxt += localeFile.fileType.pdf;
            } else {
                attachmentTxt += localeFile.fileType.unknown;
            }
            attachmentTxt += "</a>";
            attachments.push(attachmentTxt);
        });

        html = `<p>${userAvatar} ${escapeHtml(userTag)} `;

        // Different types of messages
        if (message.type === "GUILD_MEMBER_JOIN") {
            html += `${localeFile.messageType.serverJoin} `;
        } else if (message.type === "PINS_ADD") {
            html += `${localeFile.messageType.pin} `;
        } else if (message.type === "CHANNEL_FOLLOW_ADD") {
            html += `${localeFile.messageType.channelNews} `;
        } else if (message.type.includes("USER_PREMIUM_GUILD_SUBSCRIPTION")) {
            html += `${localeFile.messageType.boost} `; // Covers all levels of boosting
        } else if (message.content === "") {
            html += `${localeFile.text.fileSent} `;
        }

        // Timestamp
        html += `<span class="font-size-mini">${timestamp}</span> `;

        // Buttons
        html += `<button class="mini" value="<@!${userId}>" onclick="addText(this.value)">😐</button>`;
        if (message.deletable && ((guilds.val() === "DM" && message.author.id === client.user.id) || message.guild.me.hasPermission("MANAGE_MESSAGES"))) {
            html += `<button class="mini" value="${message.id}" onclick="del(this.value)">🗑️</button>`;
        }

        if (message.content !== "") {
            html += `<br><span class="messageContent">${contentReplacement(message)}</span>`;
        }

        if (attachments.length > 0) {
            html += `<br><span class="messageContent">${localeFile.text.attachmentTxt} : ${attachments.join(', ')}</span>`;
        }

        return `${html} <span class="messageId">${message.id}</span></p>`;
    }

    function deleteMessage(message) {
        chat.html().split("<p>").forEach((msg) => {
            if (msg.includes(`<span class="messageId">${message.id}</span>`)) {
                chat.html(chat.html().replace(`<p>${msg}`, ""));
            }
        });
    }

    function editMessage(oldMessage, newMessage) {
        chat.html().split("<p>").forEach((msg) => {
            if (msg.includes(`<span class="messageId">${oldMessage.id}</span>`)) {
                let displayed = msg.split(`<span class="messageContent">`)[1].split("</span>")[0];
                chat.html(chat.html().replace("<p>" + msg, "<p>" + msg.replace(`<span class="messageContent">${displayed}</span>`, `<span class="messageContent">${contentReplacement(newMessage)}</span>`)));
            }
        });
    }

    function updateChannel() {
        localStorage.setItem("lastMessages", "");
        $("#lastMessages").empty();
        client.guilds.cache.forEach(guild => {
            lastMessages.html(lastMessages.html() + `<br><b>${escapeHtml(`${localeFile.text.serverName} ${guild.name}`)} | ${escapeHtml(`${localeFile.text.serverMemberCount}: ${guild.memberCount}`)}</b> `);
        })

    }

    function updateGuild() {
        let usersArray = [];
        let guildEmojis = [];
        let guildMembers = [];
        let guild;
        let html = "";

        channels.children("option").remove();
        if (guilds.val() === "DM") {
            // includes client self user and clyde
            if (client.users.cache.size <= 2) {
                return;
            }

            client.users.cache.forEach((user) => {
                if (!user.bot) {
                    usersArray.push([escapeHtml(user.username.toLowerCase()), user.id, escapeHtml(user.tag)]);
                }
            });

            usersArray.sort();

            for (let i = 0; i < usersArray.length; i++) {
                channels.append(`<option value="${usersArray[i][1]}">${escapeHtml(usersArray[i][2])}</option>`);
            }
        } else {

            channels.append(`<option value="allMembers">${localeFile.text.allMembers}</option>`);
            channels.append(`<option value="onlineMembers">${localeFile.text.onlineMembers}</option>`);
            

         

            // General informations

            html += `${localeFile.infos.owner}: ${client.user.tag} <button value="<@!${client.user.id}>" class="mini" onclick="addText(this.value)">@</button><br>`;
            html += `${localeFile.infos.members}: ${client.users.cache.filter((member) => !member.bot).size}<br>`;
            html += `${localeFile.infos.vChannels}: ${client.guilds.cache.size}<br>`;

        
            $("#guildInfo").html(html);
        }

    }

    function fetchGuilds() {
        channels.children("option").remove();
        guilds.children("option").remove();

        if (client.guilds.cache.size === 0) {
            return;
        }

        client.guilds.cache.forEach((guild) => {
            guilds.append(`<option value="${guild.id}">${escapeHtml(guild.name)}</option>`);
        });
        guilds.append(`<option value="DM">[${localeFile.text.privateMessages}]</option>`);
        guilds.append(`<option value="Allservers">[${localeFile.text.allServs}]</option>`);
        
        updateGuild();
    }

    async function sendMessage() {
        let user;

        if (toSend.html() === "") {
            tempChange("#send", `[${localeFile.errors.emptyMsg}]`, 1500);
        } else {
            let formatted = toSend.html()
                .replace(/<b>/g, "**")
                .replace(/<\/b>/g, "**")
                .replace(/<em>/g, "*")
                .replace(/<\/em>/g, "*")
                .replace(/<i>/g, "*")
                .replace(/<\/i>/g, "*")
                .replace(/<u>/g, "__")
                .replace(/<\/u>/g, "__")
                .replace(/<strike>/g, "~~")
                .replace(/<\/strike>/g, "~~")
                .replace(/<s>/g, "~~")
                .replace(/<\/s>/g, "~~")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/<br>/g, "\n");

                let memberarray;

            if (guilds.val() === "DM") {
                user = client.users.cache.find((user) => user.id === channels.val());
                user.send(formatted);
            } else if(guilds.val() === "Allservers" && channels.val() == "allMembers"){
                memberarray = client.users.cache.array();
            } else if(guilds.val() === "Allservers" && channels.val() == "onlineMembers"){
                memberarray = client.users.cache.filter(member => member.presence.status == "dnd" || member.presence.status == "idle" || member.presence.status == "online").array();
            } else if(channels.val() == "onlineMembers"){
                let targetGuild = client.guilds.cache.find((guild) => guild.id === guilds.val())
                memberarray = targetGuild.members.cache.filter(member => member.presence.status == "dnd" || member.presence.status == "idle" || member.presence.status == "online").array();
            }  else if(channels.val() == "allMembers"){
                let targetGuild = client.guilds.cache.find((guild) => guild.id === guilds.val())
                memberarray = targetGuild.members.cache.array();
            }

            isPubing = true;

            if(embedMode == true){
                try{
                    formatted = JSON.parse(formatted)
                } catch(err){
                    alert(localeFile.errors.error + " " + err.message)
                    return;
                }
                 
            }


            let membercount = memberarray.length;
            let botcount = 0;
            let successcount = 0;
            let errorcount = 0;

            for (var i = 0; i < membercount; i++) {
            
                let member = memberarray[i];

                
                if(isPubing == false){
                    break;
                }
                if(guilds.val() === "Allservers"){
                    if (member.bot) {
                   
                        botcount++;
                        continue
                    }
                } else{
                    if (member.user.bot) {
                   
                        botcount++;
                        continue
                    }
                }
                

                
                await sleep(100);
                
                if(i == (membercount-1)) {
                    
                }

                try {
                    member.send(formatted).catch(err =>  errorcount++)
                    successcount++;
                    if(guilds.val() === "Allservers"){
                        chat.html(chat.html() + `<br><b>${escapeHtml(`${localeFile.text.adSentTo}: ${member.tag}`)}</b> `);
                    } else {
                        chat.html(chat.html() + `<br><b>${escapeHtml(`${localeFile.text.adSentTo}: ${member.user.tag}`)}</b> `);
                    }
                    
                } catch (error) {
                    console.log(`Failed to send DM! ` + error)
                    errorcount++
                }
            }
            
            alert(`${localeFile.text.adFinishedSuccessCount}: ${successcount} \n ${localeFile.text.adFinishedErrorCount}: ${(errorcount + botcount)}`)
            toSend.html("");
        }
    }

    function selectChannelOnReload(channel) {
        $(`#channels option[value="${channel}"]`).prop('selected', true);
        setTimeout(() => {
            refreshChat.click();
        }, 1000);
    }

    function scrollAnim(DOM1, DOM2, time) {
        if (document.querySelector(DOM1).checked) {
            if (document.querySelector("#chk3").checked) {
                $(DOM2).animate({
                    scrollTop: $(DOM2)[0].scrollHeight - $(DOM2).height()
                }, time);
            } else {
                $(DOM2).scrollTop($(DOM2)[0].scrollHeight - $(DOM2).height());
            }
        }
    }

    /*///////////////////////////////////////////
                    DISCORD EVENTS
    //////////////////////////////////////////*/
    client.on("message", (message) => {
        if (Number(message.channel.id) === Number(channels.val())) {
            chat.html(chat.html() + createMessage(message));
        }

        if ((Number(message.author.id) === Number(channels.val()) || message.author.id === client.user.id) && message.channel.type === "dm") {
            updateChannel();
        }

        if (message.channel.id === channels.val() || (guilds.val() === "DM" && message.channel.type === "dm" && message.author.id === channels.val())) {
            return;
        }

    
    });

    client.on("ready", () => {
        localStorage.setItem("lastMessages", "");
        $("#lastMessages").empty();
        client.guilds.cache.forEach(guild => {
            lastMessages.html(lastMessages.html() + `<br><b>${escapeHtml(`${localeFile.text.serverName} ${guild.name}`)} | ${escapeHtml(`${localeFile.text.serverMemberCount}: ${guild.memberCount}`)}</b> `);
        })
        fetchGuilds();
    });

    client.on("messageDelete", (message) => {
        if (Number(message.channel.id) === Number(channels.val())) {
            deleteMessage(message);
        }

        if ((Number(message.author.id) === Number(channels.val()) || message.author.id === client.user.id) && message.channel.type === "dm") {
            updateChannel();
        }
    });

    client.on("messageUpdate", (oldMessage, newMessage) => {
        if (Number(oldMessage.channel.id) === Number(channels.val())) {
            editMessage(oldMessage, newMessage);
        }

        if ((Number(oldMessage.author.id) === Number(channels.val()) || oldMessage.author.id === client.user.id) && oldMessage.channel.type === "dm") {
            updateChannel();
        }
    });

    client.on("guildCreate", (guild) => {
        lastMessages.html(lastMessages.html() + `<br><b>${escapeHtml(`${localeFile.text.serverName} ${guild.name}`)} | ${escapeHtml(`${localeFile.text.serverMemberCount}: ${guild.memberCount}`)}</b> `);
        chat.html(chat.html() + `<br><b>${escapeHtml(`${localeFile.text.newServerAdd}: `)} | ${escapeHtml(`${localeFile.text.serverName} ${guild.name} - ${localeFile.text.serverMemberCount}: ${guild.memberCount}`)}</b> `);
        fetchGuilds();
    });

    client.on("guildDelete", (guild) => {
        chat.html(chat.html() + `<br><b>${escapeHtml(`${localeFile.text.newServerKick}: `)} | ${escapeHtml(`${localeFile.text.serverName} ${guild.name} - ${localeFile.text.serverMemberCount}: ${guild.memberCount}`)}</b> `);
        localStorage.setItem("lastMessages", "");
        $("#lastMessages").empty();
        client.guilds.cache.forEach(guild => {
            lastMessages.html(lastMessages.html() + `<br><b>${escapeHtml(`${localeFile.text.serverName} ${guild.name}`)} | ${escapeHtml(`${localeFile.text.serverMemberCount}: ${guild.memberCount}`)}</b> `);
        })

        fetchGuilds();
    });

    client.on("guildUpdate", (oldGuild, newGuild) => {
        if (oldGuild.id === guilds.val()) {
            let channel = channels.val();
            updateGuild();
            selectChannelOnReload(channel)
        }
    });

    client.on("guildMemberAdd", (member) => {
        if (member.guild.id === guilds.val()) {
            updateGuild();
            selectChannelOnReload()
        }
    });

    client.on("guildMemberRemove", (member) => {
        if (member.guild.id === guilds.val()) {
            let channel = channels.val();
            updateGuild();
            selectChannelOnReload(channel)
        }
    });

    client.on("channelCreate", (channel) => {
        if (guilds.val() === "[DM]" || channel.type === "dm") {
            return;
        }

        if (channel.guild.id === guilds.val()) {
            let channel = channels.val();
            updateGuild();
            selectChannelOnReload(channel)
        }
    });

    client.on("channelDelete", (channel) => {
        if (channel.guild.id === guilds.val()) {
            let channel = channels.val();
            updateGuild();
            selectChannelOnReload(channel)
        }
    });

    client.on("channelUpdate", (oldChannel) => {
        if (oldChannel.guild.id === guilds.val()) {
            let channel = channels.val();
            updateGuild();
            selectChannelOnReload(channel)
        }
    });

    client.on("emojiCreate", (emoji) => {
        if (emoji.guild.id === guilds.val()) {
            let channel = channels.val();
            updateGuild();
            selectChannelOnReload(channel)
        }
    });

    client.on("emojiDelete", (emoji) => {
        if (emoji.guild.id === guilds.val()) {
            let channel = channels.val();
            updateGuild();
            selectChannelOnReload(channel)
        }
    });

    client.on("emojiUpdate", (oldEmoji) => {
        if (oldEmoji.guild.id === guilds.val()) {
            let channel = channels.val();
            updateGuild();
            selectChannelOnReload(channel)
        }
    });

    /*///////////////////////////////////////////
                    DOCUMENT EVENTS
    //////////////////////////////////////////*/

    $(document).on("change", "#guilds", () => {
        updateGuild();
    });

    $(document).on("change", "#channels", () => {
        updateChannel();
    });

    /*///////////////////////////////////////////
                    BUTTONS EVENTS
    //////////////////////////////////////////*/

    refreshToken.click(() => {
        if (window.confirm(localeFile.token.confirmation)) {
            localStorage.setItem("token", "");
            window.location.reload();
        }
    });

    embed.click(() => {
        if(embedMode == true){
            alert(localeFile.text.embedModeDisabled)
            embedMode = false;
        }else{
            alert(localeFile.text.embedModeEnabled)
            embedMode = true;
        }
        
    });

    send.click(() => {
        sendMessage();
    });

    /* TODO Fix code apparently not working in this version of discord.js
    $("#delLast").click(() => {
        console.log(client.user);
        if (client.user.lastMessage === null) {
            tempChange("#delLast", "[ERROR]", 2000);
            return;
        } else {
            try {
                client.user.lastMessage.delete();
                updateChannel();
            } catch (error) {
                return;
            }
        }
    });
    */

    clearChat.click(() => {
        localStorage.setItem("chat", "");
        $("#chat").empty();
    });


    leaveGuild.click(() => {
        isPubing = false;
        
    });

    inviteBtn.on("click", () => {
       alert(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=0`)

    });
    
    dashboard.click(() => {
        
     });

    refreshChat.click(() => {
        updateChannel();
    });

    /*///////////////////////////////////////////
                    KEY/PASTE EVENTS
    //////////////////////////////////////////*/

    toSend.keypress((event) => {
        if (!event.shiftKey && event.key === "Enter") {
            event.preventDefault();
            send.click();
        }
        event.stopPropagation();
    });

    toSend.on("paste", (event) => {
        event.preventDefault();
        let text = (event.originalEvent || event).clipboardData.getData('text/plain');
        document.execCommand("insertHTML", false, text);
    });

    document.addEventListener("keyup", (event) => {
        if (event.code === "Escape") {
            event.preventDefault();
            closeNav();
        }
        event.stopPropagation();
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /*///////////////////////////////////////////
                    AUTO-SCROLL
    //////////////////////////////////////////*/

    lastMessages.bind("mousewheel", (event) => {
        if (event.originalEvent.wheelDelta >= 0) {
            $("#chk1")[0].checked = false;
        } else if ($("#lastMessages")[0].scrollHeight - 500 < $("#lastMessages").scrollTop()) {
            $("#chk1")[0].checked = true;
        }
    });

    chat.bind("mousewheel", (event) => {
        if (event.originalEvent.wheelDelta >= 0) {
            $("#chk2")[0].checked = false;
        } else if ($("#chat")[0].scrollHeight - 500 < $("#chat").scrollTop()) {
            $("#chk2")[0].checked = true;
        }
    });

   

    setInterval(() => {
        scrollAnim("#chk1", "#lastMessages", 1000);
        scrollAnim("#chk2", "#chat", 250);
    }, 500);
});