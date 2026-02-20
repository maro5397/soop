# soop

[![npm version](https://img.shields.io/npm/v/soop-extension.svg?style=for-the-badge)](https://www.npmjs.com/package/soop-extension)
[![npm downloads](https://img.shields.io/npm/dm/soop-extension.svg?style=for-the-badge)](http://npm-stat.com/charts.html?package=soop-extension)
[![license](https://img.shields.io/github/license/maro5397/soop?style=for-the-badge)](https://github.com/maro5397/soop/blob/main/LICENSE)
![language](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![createAt](https://img.shields.io/github/created-at/maro5397/soop?style=for-the-badge)

Unofficial API library for SOOP, a live streaming service.

The currently implemented features are as follows:

- Check live stream status and detailed information
- Log in (retrieve session/cookie)
- Send/receive chat messages
    - Be especially careful when using chat send/receive features.
    - When sending/receiving chat, user information (fan club, subscription, fan join) may be exposed in the chat room.
    - **_The author is not responsible for malicious use._**

## Installation

> Developed on Node.js v20.17.0.

```bash
npm install soop-extension
```

## Examples
### API code example
```ts
import { SoopChatEvent, SoopClient } from 'soop-extension'

(async function () {
    const streamerId = process.env.STREAMER_ID
    const client = new SoopClient();

    // Live details
    // Login (returns cookie)
    // You can directly enter SOOP ID and PASSWORD strings as shown below
    // (if pushed to VCS as-is, they may be exposed in public repositories)
    // const cookie = await client.auth.signIn("USERID", "PASSWORD");
    const cookie  = await client.auth.signIn(process.env.USERID, process.env.PASSWORD);
    console.log(cookie)

    // Live details (after login)
    const liveDetailWithCookie = await client.live.detail(streamerId, cookie);
    console.log(liveDetailWithCookie);

    // Live details
    const liveDetailWithoutCookie = await client.live.detail(streamerId);
    console.log(liveDetailWithoutCookie);

    // Channel information
    const stationInfo = await client.channel.station(streamerId);
    console.log(stationInfo)
})();

```
### WebSocket (chat) code example
```ts
import { SoopChatEvent, SoopClient } from 'soop-extension'

(async function () {
    const streamerId = process.env.STREAMER_ID
    const client = new SoopClient();

    const soopChat = client.chat({
        streamerId: streamerId,
        login: { userId: process.env.USERID, password: process.env.PASSWORD } // required if you want to use sendChat
    })

    // Connection successful
    soopChat.on(SoopChatEvent.CONNECT, response => {
        if(response.username) {
            console.log(`[${response.receivedTime}] ${response.username} is connected to ${response.streamerId}`)
        } else {
            console.log(`[${response.receivedTime}] Connected to ${response.streamerId}`)
        }
        console.log(`[${response.receivedTime}] SYN packet: ${response.syn}`)
    })

    // Enter chat room
    soopChat.on(SoopChatEvent.ENTER_CHAT_ROOM, response => {
        console.log(`[${response.receivedTime}] Entered ${response.streamerId}'s chat room`)
        console.log(`[${response.receivedTime}] SYN/ACK packet: ${response.synAck}`)
    })

    // Chat room notice
    soopChat.on(SoopChatEvent.NOTIFICATION, response => {
        console.log('-'.repeat(50))
        console.log(`[${response.receivedTime}]`)
        console.log(response.notification.replace(/\r\n/g, '\n'))
        console.log('-'.repeat(50))
    })

    // Regular chat
    soopChat.on(SoopChatEvent.CHAT, response => {
        console.log(`[${response.receivedTime}] ${response.username}(${response.userId}): ${response.comment}`)
    })

    // Emoticon chat
    soopChat.on(SoopChatEvent.EMOTICON, response => {
        console.log(`[${response.receivedTime}] ${response.username}(${response.userId}): ${response.emoticonId}`)
    })

    // Text/voice donation chat
    soopChat.on(SoopChatEvent.TEXT_DONATION, response => {
        console.log(`\n[${response.receivedTime}] ${response.fromUsername}(${response.from}) donated ${response.amount} to ${response.to}`)
        if (Number(response.fanClubOrdinal) !== 0) {
            console.log(`[${response.receivedTime}] Welcome to fan club #${response.fanClubOrdinal}.\n`)
        } else {
            console.log(`[${response.receivedTime}] This user is already in the fan club.\n`)
        }
    })

    // Video donation chat
    soopChat.on(SoopChatEvent.VIDEO_DONATION, response => {
        console.log(`\n[${response.receivedTime}] ${response.fromUsername}(${response.from}) donated ${response.amount} to ${response.to}`)
        if (Number(response.fanClubOrdinal) !== 0) {
            console.log(`[${response.receivedTime}] Welcome to fan club #${response.fanClubOrdinal}.\n`)
        } else {
            console.log(`[${response.receivedTime}] This user is already in the fan club.\n`)
        }
    })

    // Ad balloon donation chat
    soopChat.on(SoopChatEvent.AD_BALLOON_DONATION, response => {
        console.log(`\n[${response.receivedTime}] ${response.fromUsername}(${response.from}) donated ${response.amount} to ${response.to}`)
        if (Number(response.fanClubOrdinal) !== 0) {
            console.log(`[${response.receivedTime}] Welcome to fan club #${response.fanClubOrdinal}.\n`)
        } else {
            console.log(`[${response.receivedTime}] This user is already in the fan club.\n`)
        }
    })

    // Subscription chat
    soopChat.on(SoopChatEvent.SUBSCRIBE, response => {
        console.log(`\n[${response.receivedTime}] ${response.fromUsername}(${response.from}) subscribed to ${response.to}.`)
        console.log(`[${response.receivedTime}] ${response.monthCount} months, tier ${response.tier}\n`)
    })

    // Exit info
    soopChat.on(SoopChatEvent.EXIT, response => {
        console.log(`\n[${response.receivedTime}] ${response.username}(${response.userId}) has left.\n`)
    })

    // Enter info
    soopChat.on(SoopChatEvent.VIEWER, response => {
        if(response.userId.length > 1) {
            console.log(`[${response.receivedTime}] Received ${response.userId.length} users in the chat room.`)
        } else {
            console.log(`[${response.receivedTime}] ${response.userId[0]} has entered.`)
        }
    })

    // Stream ended
    soopChat.on(SoopChatEvent.DISCONNECT, response => {
        console.log(`[${response.receivedTime}] ${response.streamerId}'s stream has ended`)
    })

    // Unidentified packet
    soopChat.on(SoopChatEvent.UNKNOWN, packet => {
        console.log(packet)
    })

    // Inspect packets in binary form
    soopChat.on(SoopChatEvent.RAW, packet => {
        console.log(packet)
    })

    // Chat sent by yourself
    soopChat.on(SoopChatEvent.CHAT, response => {
        if( response.userId.includes(process.env.USERID) ) {
            console.log(`[${response.receivedTime}] ${response.username}(${response.userId}): ${response.comment}`)
        }
    })

    // Connect to chat
    await soopChat.connect()

    // Send chat
    // If sent immediately, it waits until the chat room connection is established
    // If sending repeatedly, set a delay before sending to avoid bans or failed sends
    await soopChat.sendChat("hi");
    setInterval(async () => {
        await soopChat.sendChat("This is interesting");
    }, 5000)
})();
```
