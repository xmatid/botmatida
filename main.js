const Discord = require("discord.js");

const ytdl = require("ytdl-core");

const client = new Discord.Client();

const prefix = '.manora';

const queue = new Map();

const fs = require('fs');

client.commands = new Discord.Collection();

const token = 'NzQ5NTk2OTk4MjEwMDI3NTkx.X0uSmw.oN3tfvUOkvcTKd9oN1wLoZccXlk'

const commandFiles = fs.readdirSync('./komendy/').filter(file => file.endsWith('.js'));
for(const file of commandFiles){
    const command = require(`./komendy/${file}`);

    client.commands.set(command.name, command);
}

client.once("ready", () => {
  console.log("Manora (Discord) jest online!");
  client.user.setActivity('kanał MaTiDa.', { type: "WATCHING"}).catch(console.error);
});

client.once("reconnecting", () => {
  console.log("Ponowne łączenie...");
});

client.once("disconnect", () => {
  console.log("Rozłączono z Discordem.");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);
  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase(); 

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}youtube`)) {
    youtube(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}omatidzie`)) {
    omatidzie(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}dajmirole`)) {
    dajmirole(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}najnowszyfilm`)) {
    najnowszyfilm(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}komendy`)) {
    komendy(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}www`)) {
    www(message, serverQueue);
    return; 
  } else {
    message.channel.send("**Wpisz poprawną komendę!** Jeżeli nie znasz komend, *wpisz .manorakomendy*");
  } 
  
});

client.on('message', message =>{
  if(!message.content.startsWith(prefix) || message.author.bot)  return;  

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase(); 

  if(command === 'youtube'){
   client.commands.get('youtube').execute(message, args);
  }
  else if (command == 'omatidzie'){
   client.commands.get('omatidzie').execute(message, args);  
  } 
   else if (command == 'dajmirole'){
       client.commands.get('dajmirole').execute(message, args);}
       
   else if (command == 'najnowszyfilm'){
        client.commands.get('najnowszyfilm').execute(message, args);}
   else if (command == 'komendy'){
       client.commands.get('komendy').execute(message, args);}
   else if (command == 'www'){
       client.commands.get('www').execute(message, args);}
});
async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "Musisz być na **kanale głosowym** aby móc odtwarzać muzykę!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "Potrzebuję uprawnień aby móc **dołączyć i grać** na twoim kanale!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`**${song.title}** została __dodana do kolejki!__`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Musisz być na **kanale głosowym** aby móc pominąć utwór."
    );
  if (!serverQueue)
    return message.channel.send("Nie mam **żadnych piosenek** w kolejce do pominięcia.");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Musisz być na **kanale głosowym** aby móc mnie zatrzymać!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Teraz gram: **${song.title}**`);
}

client.login(token);
