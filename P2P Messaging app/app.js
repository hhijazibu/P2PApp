let localConnection;
let remoteConnection;
const sendChannel = localConnection.createDataChannel('sendChannel');
sendChannel.onmessage = e => log(`Message received: ${e.data}`);
sendChannel.onopen = e => log('Connection opened');
sendChannel.onclose = e => log('Connection closed');

// Signaling
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = message => {
    const data = JSON.parse(message.data);
    handleSignaling(data);
};

function handleSignaling(data) {
    if (data.type === 'offer') {
        createAnswer(data.offer);
    } else if (data.type === 'answer') {
        localConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.type === 'candidate') {
        const candidate = new RTCIceCandidate(data.candidate);
        localConnection.addIceCandidate(candidate);
    }
}

async function createOffer() {
    const offer = await localConnection.createOffer();
    await localConnection.setLocalDescription(offer);
    ws.send(JSON.stringify({type: 'offer', offer: offer}));
}

async function createAnswer(offer) {
    remoteConnection = new RTCPeerConnection();
    remoteConnection.onicecandidate = e => {
        if (e.candidate) {
            ws.send(JSON.stringify({type: 'candidate', candidate: e.candidate}));
        }
    };
    await remoteConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await remoteConnection.createAnswer();
    await remoteConnection.setLocalDescription(answer);
    ws.send(JSON.stringify({type: 'answer', answer: answer}));
}

// Messaging
function sendMessage() {
    const message = document.getElementById('messageInput').value;
    sendChannel.send(message);
    log(`Message sent: ${message}`);
}

function log(message) {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML += `<p>${message}</p>`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    localConnection = new RTCPeerConnection();
    localConnection.onicecandidate = e => {
        if (e.candidate) {
            ws.send(JSON.stringify({type: 'candidate', candidate: e.candidate}));
        }
    };
});
