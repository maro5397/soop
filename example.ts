import { SoopClient } from "./src";

(async function () {
    const streamerId = "ecvhao"
    const client = new SoopClient();
    const data = await client.live.detail(streamerId);

    const soopChat = client.chat({
        steamerId: streamerId
    })

    // 연결 성공
    soopChat.on('connect', streamerId => {
        console.log(`Connected to ${streamerId}`)
    })

    // 채팅방 입장
    soopChat.on('enterChatRoom', streamerId => {
        console.log(`Enter to ${streamerId}'s chat room`)
    })

    // 일반 채팅
    soopChat.on('chat', chat => {
        console.log(`${chat.username}[${chat.userId}]: ${chat.comment}`)
    })

    // // 이모티콘 채팅
    // soopChat.on('emoticon', emoticon => {
    //     console.log(`\n>> ${donation.profile.nickname} 님이 ${donation.extras.payAmount}원 후원`)
    //     if (donation.message) {
    //         console.log(`>> ${donation.message}`)
    //     }
    //     console.log()
    // })

    // // 후원 채팅
    // soopChat.on('donation', donation => {
    //     console.log(`\n>> ${donation.profile.nickname} 님이 ${donation.extras.payAmount}원 후원`)
    //     if (donation.message) {
    //         console.log(`>> ${donation.message}`)
    //     }
    //     console.log()
    // })

    // 방송 종료
    soopChat.on('disconnect', chatUrl => {
        console.log(`${chatUrl}: 방송이 종료됨`)
    })

    // soopChat.on('raw', packet => {
    //     console.log(packet)
    // })

    // 채팅 연결
    await soopChat.connect()
})();