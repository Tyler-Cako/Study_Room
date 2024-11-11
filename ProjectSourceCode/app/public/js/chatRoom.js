const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

async function getUsernameAndRoom() {
    // const response = await fetch('someapi');
    // const data = await response.json();
    const params = new URLSearchParams(window.location.search);
    const data = { user: 'User', room: params.get('room') };
    return data;
}

getUsernameAndRoom().then(data => {
    const username = data.user;
    const room = data.room;

    // Join a room
    socket.emit('joinRoom', { username, room });

    form.addEventListener('submit', (e) => {
        console.log(input.value);
        e.preventDefault();
        if (input.value) {
            socket.emit('chatMessage', { room: room, msg: input.value });
            input.value = '';
        }
    });

    socket.on('userJoined', (data) => {
        const item = document.createElement('li');
        item.textContent = `User ${data.id} joined the chat`;
        item.style.color = '#0059ff';
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('chatMessage', (msg) => {
        const item = document.createElement('li');
        item.textContent = `User ${msg.id}: ${msg.msg}`;
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('userDisconnect', (data) => {
        const item = document.createElement('li');
        item.textContent = `User ${data.id} disconnected`;
        item.style.color = '#ed004f';
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });
}).catch(error => {
    console.error('Error fetching user and rooms:', error);
});