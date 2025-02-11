# soop

[![npm version](https://img.shields.io/npm/v/soop-extension.svg?style=for-the-badge)](https://www.npmjs.com/package/soop-extension)
[![npm downloads](https://img.shields.io/npm/dm/soop-extension.svg?style=for-the-badge)](http://npm-stat.com/charts.html?package=soop-extension)
[![license](https://img.shields.io/github/license/maro5397/soop?style=for-the-badge)](https://github.com/maro5397/soop/blob/main/LICENSE)
![language](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![createAt](https://img.shields.io/github/created-at/maro5397/soop?style=for-the-badge)

라이브 스트리밍 서비스 숲(soop)의 비공식 API 라이브러리

라이브 스트리밍 서비스 SOOP의 비공식 API 라이브러리입니다.

현재 구현된 기능은 다음과 같습니다.

- 방송 상태 및 상세 정보 조회
- 로그인 (세션/쿠키 조회)
- 채팅 송/수신
    - 채팅 송/수신 기능 사용 시 각별한 주의가 필요함
    - 채팅 송/수신 시 사용자 정보(팬클럽, 구독, 팬가입)정보가 채팅방에 노출됨
    - **_악의적 목적으로 사용할 시 책임을 지지 않음을 밝힘_**

## 설치

> Node 20.17.0 버전에서 개발되었습니다.

```bash
npm install soop-extension
```

## 예시
### 실행 예시
```bash
ts-node example.ts
```
### 코드 예시
```ts
const streamerId = process.env.STREAMER_ID
const client = new SoopClient();

// 라이브 세부정보
// 로그인 (쿠키 반환)
// 아래와 같이 숲 ID, PASSWORD 문자열 입력 가능 (그대로 VCS 업로드 시 공개된 공간에 노출될 수 있음)
// const cookie = await client.auth.signIn("USERID", "PASSWORD");
const cookie  = await client.auth.signIn(process.env.USERID, process.env.PASSWORD);
console.log(cookie)

// 라이브 세부정보 (로그인 후)
const liveDetailWithCookie = await client.live.detail(streamerId, cookie);
console.log(liveDetailWithCookie);

// 라이브 세부정보
const liveDetailWithoutCookie = await client.live.detail(streamerId);
console.log(liveDetailWithoutCookie);

// 채널 정보
const stationInfo = await client.channel.station(streamerId);
console.log(stationInfo)

const soopChat = client.chat({
    streamerId: streamerId,
    login: { userId: process.env.USERID, password: process.env.PASSWORD } // sendChat 기능을 사용하고 싶을 경우 세팅
})

// 연결 성공
soopChat.on('connect', response => {
    if(response.username) {
        console.log(`[${response.receivedTime}] ${response.username} is connected to ${response.streamerId}`)
    } else {
        console.log(`[${response.receivedTime}] Connected to ${response.streamerId}`)
    }
    console.log(`[${response.receivedTime}] SYN packet: ${response.syn}`)
})

// 채팅방 입장
soopChat.on('enterChatRoom', response => {
    console.log(`[${response.receivedTime}] Enter to ${response.streamerId}'s chat room`)
    console.log(`[${response.receivedTime}] SYN/ACK packet: ${response.synAck}`)
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

// 본인이 송신한 채팅
soopChat.on('chat', response => {
    if( response.userId.includes(process.env.USERID) ) {
        console.log(`[${response.receivedTime}] ${response.username}(${response.userId}): ${response.comment}`)
    }
})

// 채팅 연결
await soopChat.connect()

// 채팅 송신
// 바로 채팅 송신 시 채팅방 연결까지 대기 후 송신
// 연속으로 채팅 송신 시 벤 및 송신 실패할 수 있으므로 송신 전 대기 시간 설정 필요
await soopChat.sendChat("ㅎㅇ");
setInterval(async () => {
    await soopChat.sendChat("신기하다");
}, 5000)
```
