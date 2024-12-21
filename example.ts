import { SoopClient } from "./src"

(async function () {
    const streamerId = "jingburger1"
    const client = new SoopClient();

    // 라이브 세부정보
    const data = await client.live.detail(streamerId);
    console.log(data)

    const soopChat = client.chat({
        streamerId: streamerId
    })

    // 연결 성공
    soopChat.on('connect', response => {
        console.log(`[${response.receivedTime}] Connected to ${response.streamerId}`)
    })

    // 채팅방 입장
    soopChat.on('enterChatRoom', response => {
        console.log(`[${response.receivedTime}] Enter to ${response.streamerId}'s chat room`)
    })

    // 채팅방 공지
    soopChat.on('notification', response => {
        console.log('-'.repeat(50))
        console.log(`[${response.receivedTime}]`)
        console.log(response.notification.replace(/\r\n/g, '\n'))
        console.log('-'.repeat(50))
    })

    // 일반 채팅
    soopChat.on('chat', response => {
        console.log(`[${response.receivedTime}] ${response.username}(${response.userId}): ${response.comment}`)
    })

    // 이모티콘 채팅
    soopChat.on('emoticon', response => {
        console.log(`[${response.receivedTime}] ${response.username}(${response.userId}): ${response.emoticonId}`)
    })

    // 텍스트/음성 후원 채팅
    soopChat.on('textDonation', response => {
        console.log(`\n[${response.receivedTime}] ${response.fromUsername}(${response.from})님이 ${response.to}님에게 ${response.amount}개 후원`)
        if (Number(response.fanClubOrdinal) !== 0) {
            console.log(`[${response.receivedTime}] ${response.fanClubOrdinal}번째 팬클럽 가입을 환영합니다.\n`)
        } else {
            console.log(`[${response.receivedTime}] 이미 팬클럽에 가입된 사용자입니다.\n`)
        }
    })

    // 영상 후원 채팅
    soopChat.on('videoDonation', response => {
        console.log(`\n[${response.receivedTime}] ${response.fromUsername}(${response.from})님이 ${response.to}님에게 ${response.amount}개 후원`)
        if (Number(response.fanClubOrdinal) !== 0) {
            console.log(`[${response.receivedTime}] ${response.fanClubOrdinal}번째 팬클럽 가입을 환영합니다.\n`)
        } else {
            console.log(`[${response.receivedTime}] 이미 팬클럽에 가입된 사용자입니다.\n`)
        }
    })

    // 애드벌룬 후원 채팅
    soopChat.on('adBalloonDonation', response => {
        console.log(`\n[${response.receivedTime}] ${response.fromUsername}(${response.from})님이 ${response.to}님에게 ${response.amount}개 후원`)
        if (Number(response.fanClubOrdinal) !== 0) {
            console.log(`[${response.receivedTime}] ${response.fanClubOrdinal}번째 팬클럽 가입을 환영합니다.\n`)
        } else {
            console.log(`[${response.receivedTime}] 이미 팬클럽에 가입된 사용자입니다.\n`)
        }
    })

    // 구독 채팅
    soopChat.on('subscribe', response => {
        console.log(`\n[${response.receivedTime}] ${response.fromUsername}(${response.from})님이 ${response.to}님을 구독하셨습니다.`)
        console.log(`[${response.receivedTime}] ${response.monthCount}개월, ${response.tier}티어\n`)
    })

    // 퇴장 정보
    soopChat.on('exit', response => {
        console.log(`\n[${response.receivedTime}] ${response.username}(${response.userId})이/가 퇴장하셨습니다\n`)
    })

    // 입장 정보
    soopChat.on('viewer', response => {
        if(response.userId.length > 1) {
            console.log(`[${response.receivedTime}] 수신한 채팅방 사용자는 ${response.userId.length}명 입니다.`)
        } else {
            console.log(`[${response.receivedTime}] ${response.userId[0]}이/가 입장하셨습니다`)
        }
    })

    // 방송 종료
    soopChat.on('disconnect', response => {
        console.log(`[${response.receivedTime}] ${response.streamerId}의 방송이 종료됨`)
    })

    // 특정하지 못한 패킷
    soopChat.on('unknown', packet => {
        console.log(packet)
    })

    // 패킷을 바이너리 형태로 확인
    soopChat.on('raw', packet => {
        console.log(packet)
    })

    // 채팅 연결
    await soopChat.connect()
})();