import { io } from 'socket.io-client';
import Qs from 'qs';

const chatForm = document.getElementById('chat-form') as HTMLFormElement;
const chatMessages = document.querySelector('.chat-messages') as HTMLElement;
const roomName = document.getElementById('room-name') as HTMLElement;
const userList = document.getElementById('users') as HTMLElement;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
}) as { username: string; room: string };

const socket = io();

// Join chatroom
socket.emit('joinRoom', { username, room });

// Listen for roomUsers event
socket.on('roomUsers', ({ room, users }: { room: string; users: { id: string; username: string; room: string }[] }) => {
  outputRoomName(room);
  outputUsers(users);
});

function outputRoomName(room: string) {
  roomName.innerText = room;
}

function outputUsers(users: { id: string; username: string; room: string }[]) {
  userList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}