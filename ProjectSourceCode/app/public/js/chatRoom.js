const socket = io();
const form = document.getElementById('send-message-form');
const input = document.getElementById('input-text');
const messages = document.getElementById('message-history');


let currentRoom;
let username;


async function getUserData() {
    try {
      const response = await fetch('/user-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies in the request
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
  
      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

getUserData().then(data => {
    username = data.user;
    room = data.room;

    // Join a room
    socket.emit('joinRoom', { username, room });

    form.addEventListener('submit', (e) => {
        console.log(input.value);
        e.preventDefault();
        if (input.value) {
            socket.emit('chatMessage', { room: room, msg: input.value, student_id: id, display_name: username});
            input.value = '';
        }
    }).catch(error => {
        console.error('Error fetching user data:', error);
        // Redirect to login page or show an error message
        window.location.href = '/login';
    });

    socket.on('userJoined', (data) => {
        const item = document.createElement('li');
        item.textContent = `User ${data.id} joined the chat`;
        item.style.color = '#0059ff';
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('chatMessage', ({ display_name, msg, time }) => {
        console.log(messages);
        const msgEl = document.createElement('div');
        msgEl.classList = "message";

        msgInfo = document.createElement('div');
        msgInfo.classList = "message-info row";
        msgEl.appendChild(msgInfo);

        sender = document.createElement('p');
        sender.classList = "sender";
        sender.textContent = display_name;
        msgInfo.appendChild(sender);

        timestamp = document.createElement('p');
        timestamp.classList = "timestamp";
        timestamp.textContent = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        msgInfo.appendChild(timestamp);

        msgText = document.createElement('p');
        msgText.classList = "message-text";
        msgText.textContent = msg;
        msgEl.appendChild(msgText);

        messages.appendChild(msgEl);
        messages.scrollTo(0, document.body.scrollHeight);
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