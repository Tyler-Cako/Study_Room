interface User {
    id: string;
    username: string;
    room: string;
  }
  
  const users: User[] = [];
  
  // Join user to chat
  export function newUser(id: string, username: string, room: string): User {
    const user = { id, username, room };
    users.push(user);
    return user;
  }
  
  // Get current user
  export function getActiveUser(id: string): User | undefined {
    return users.find(user => user.id === id);
  }
  
  // User leaves chat
  export function exitRoom(id: string): User | undefined {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      return users.splice(index, 1)[0];
    }
  }
  
  // Get room users
  export function getIndividualRoomUsers(room: string): User[] {
    return users.filter(user => user.room === room);
  }