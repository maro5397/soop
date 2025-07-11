import {SoopClient} from "./src"

(async function () {
    const streamerIds = ['gosegu2', 'jingburger1', 'lilpa0309', 'cotton1217', 'b13246', 'devil0108', 'xoals137', 'joey1114', 'sccha21', 'diniowo'];
    const client = new SoopClient();

    for (const streamerId of streamerIds) {
        const liveDetail = await client.live.detail(streamerId)
        const result = liveDetail.CHANNEL.RESULT
        if (result !== 1) {
            console.log("broadcast finished");
            return;
        }
    }
    console.log("broadcast lived");

    for (const streamerId of streamerIds) {
        const soopChat = client.chat({ streamerId: streamerId })

        // 연결 성공
        soopChat.on('connect', response => {
            if(response.username) {
                console.log(`[${response.receivedTime}][${streamerId}] ${response.username} is connected to ${response.streamerId}`)
            } else {
                console.log(`[${response.receivedTime}][${streamerId}] Connected to ${response.streamerId}`)
            }
            console.log(`[${response.receivedTime}][${streamerId}] SYN packet: ${response.syn}`)
        })

        // 채팅방 입장
        soopChat.on('enterChatRoom', response => {
            console.log(`[${response.receivedTime}][${streamerId}] Enter to ${response.streamerId}'s chat room`)
            console.log(`[${response.receivedTime}][${streamerId}] SYN/ACK packet: ${response.synAck}`)
        })

        // 채팅방 공지
        soopChat.on('notification', response => {
            console.log('-'.repeat(50))
            console.log(`[${response.receivedTime}][${streamerId}]`)
            console.log(response.notification.replace(/\r\n/g, '\n'))
            console.log('-'.repeat(50))
        })

        // 일반 채팅
        soopChat.on('chat', response => {
            console.log(`[${response.receivedTime}][${streamerId}] ${response.username}(${response.userId}): ${response.comment}`)
        })

        // 이모티콘 채팅
        soopChat.on('emoticon', response => {
            console.log(`[${response.receivedTime}][${streamerId}] ${response.username}(${response.userId}): ${response.emoticonId}`)
        })

        // 텍스트/음성 후원 채팅
        soopChat.on('textDonation', response => {
            console.log(`\n[${response.receivedTime}][${streamerId}] ${response.fromUsername}(${response.from})님이 ${response.to}님에게 ${response.amount}개 후원`)
            if (Number(response.fanClubOrdinal) !== 0) {
                console.log(`[${response.receivedTime}][${streamerId}] ${response.fanClubOrdinal}번째 팬클럽 가입을 환영합니다.\n`)
            } else {
                console.log(`[${response.receivedTime}][${streamerId}] 이미 팬클럽에 가입된 사용자입니다.\n`)
            }
        })

        // 영상 후원 채팅
        soopChat.on('videoDonation', response => {
            console.log(`\n[${response.receivedTime}][${streamerId}] ${response.fromUsername}(${response.from})님이 ${response.to}님에게 ${response.amount}개 후원`)
            if (Number(response.fanClubOrdinal) !== 0) {
                console.log(`[${response.receivedTime}][${streamerId}] ${response.fanClubOrdinal}번째 팬클럽 가입을 환영합니다.\n`)
            } else {
                console.log(`[${response.receivedTime}][${streamerId}] 이미 팬클럽에 가입된 사용자입니다.\n`)
            }
        })

        // 애드벌룬 후원 채팅
        soopChat.on('adBalloonDonation', response => {
            console.log(`\n[${response.receivedTime}][${streamerId}] ${response.fromUsername}(${response.from})님이 ${response.to}님에게 ${response.amount}개 후원`)
            if (Number(response.fanClubOrdinal) !== 0) {
                console.log(`[${response.receivedTime}][${streamerId}] ${response.fanClubOrdinal}번째 팬클럽 가입을 환영합니다.\n`)
            } else {
                console.log(`[${response.receivedTime}][${streamerId}] 이미 팬클럽에 가입된 사용자입니다.\n`)
            }
        })

        // 구독 채팅
        soopChat.on('subscribe', response => {
            console.log(`\n[${response.receivedTime}][${streamerId}] ${response.fromUsername}(${response.from})님이 ${response.to}님을 구독하셨습니다.`)
            console.log(`[${response.receivedTime}][${streamerId}] ${response.monthCount}개월, ${response.tier}티어\n`)
        })

        // 퇴장 정보
        soopChat.on('exit', response => {
            console.log(`\n[${response.receivedTime}][${streamerId}] ${response.username}(${response.userId})이/가 퇴장하셨습니다\n`)
        })

        // 입장 정보
        soopChat.on('viewer', response => {
            if(response.userId.length > 1) {
                console.log(`[${response.receivedTime}][${streamerId}] 수신한 채팅방 사용자는 ${response.userId.length}명 입니다.`)
            } else {
                console.log(`[${response.receivedTime}][${streamerId}] ${response.userId[0]}이/가 입장하셨습니다`)
            }
        })

        // 방송 종료
        soopChat.on('disconnect', response => {
            console.log(`[${response.receivedTime}][${streamerId}] ${response.streamerId}의 방송이 종료됨`)
        })

        await soopChat.connect();
    }
})();
