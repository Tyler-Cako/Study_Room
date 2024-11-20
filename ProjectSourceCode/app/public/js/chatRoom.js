const socket = io();
const form = document.getElementById('send-message-form');
const input = document.getElementById('input-text');
const messages = document.getElementById('message-history');


let currentRoom = parseInt(window.location.pathname.split('/').pop(), 10); // Extract the class_id from the URL and convert to an integer
let username;
let id;

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
    username = data.name;
    id = data.student_id;
    
    // Join a room
    if (currentRoom) {
        socket.emit('joinRoom', { username: username, room: currentRoom })
    } else {
        console.error('Undefined room')
    }
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value && currentRoom != undefined) {
            socket.emit('chatMessage', { room: currentRoom, msg: input.value, student_id: id, display_name: username});
            input.value = '';
        }
        else {
            console.error('Room is undefined');
        }
    });
    
    socket.on('userJoined', (data) => {
        const item = document.createElement('li');
        item.textContent = `User ${data.id} joined the chat`;
        item.style.color = '#0059ff';
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('chatMessage', ({ display_name, msg, time }) => {
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
        timestamp.textContent = new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        msgInfo.appendChild(timestamp);

        msgText = document.createElement('p');
        msgText.classList = "message-text";
        msgText.textContent = msg;
        msgEl.appendChild(msgText);

        messages.appendChild(msgEl);
        messages.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('previousMessages', (msgs) => {
        // same code as whats in onMessage, just populating for each message that was found in db
        messages.innerHTML = '';
        if (Array.isArray(msgs)) {
            msgs.forEach(({ name, message_body, created_at }) => {
                const msgEl = document.createElement('div');
                msgEl.classList = "message";

                const msgInfo = document.createElement('div');
                msgInfo.classList = "message-info row";
                msgEl.appendChild(msgInfo);

                const sender = document.createElement('p');
                sender.classList = "sender";
                sender.textContent = name;
                msgInfo.appendChild(sender);

                const timestamp = document.createElement('p');
                timestamp.classList = "timestamp";
                const messageTime = new Date(created_at); // Convert created_at to Date object
                timestamp.textContent = messageTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                msgInfo.appendChild(timestamp);

                const msgText = document.createElement('p');
                msgText.classList = "message-text";
                msgText.textContent = message_body;
                msgEl.appendChild(msgText);

                messages.appendChild(msgEl);
            });
            window.scrollTo(0, document.body.scrollHeight);
        } else {
            console.error('Expected an array of messages but received:', msgs);
        }
    });

    socket.on('userDisconnect', (data) => {
        const item = document.createElement('li');
        item.textContent = `User ${data.id} disconnected`;
        item.style.color = '#ed004f';
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });

    window.addEventListener('beforeunload', () => {
        messages.innerHTML = '';
        socket.emit('leaveRoom', { room: currentRoom });
      });

}).catch(error => {
    console.error('Error fetching user data:', error);
    // Redirect to login page or show an error message
    window.location.href = '/login';
});

function changeClass(btn, newClass) {
    const prev_active_btn = document.querySelector(".class-switch.focused");
    if (prev_active_btn) {
        prev_active_btn.className = "class-switch";
    }

    btn.className = "class-switch focused";
    
    const titleEl = document.getElementById("class-name");
    const new_title = btn.innerHTML;
    titleEl.innerHTML = new_title;

    // Leave the current room
    socket.emit('leaveRoom', { room: currentRoom });
    messages.innerHTML = '';
    // Update the current room
    currentRoom = newClass;

    // Join the new room
    socket.emit('joinRoom', { username, room: currentRoom });

    // Switch between message lists
    history.pushState(null, '', `./${newClass}`);
}