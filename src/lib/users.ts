import fs from 'fs/promises';
import path from 'path';

<<<<<<< HEAD
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
=======
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
>>>>>>> 07557e884c9895994f1e42d9a50962985d6371eb

export interface User {
  id: string;
  username: string;
  password: string; // Hashed password
}

async function ensureUsersFileExists() {
  try {
    await fs.access(USERS_FILE);
  } catch (error) {
    // If file doesn't exist, create it with an empty array
    await fs.writeFile(USERS_FILE, JSON.stringify([]), 'utf-8');
  }
}

export async function getUsers(): Promise<User[]> {
  await ensureUsersFileExists();
  const fileContent = await fs.readFile(USERS_FILE, 'utf-8');
  return JSON.parse(fileContent);
}

export async function saveUsers(users: User[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(user => user.username === username);
}

export async function createUser(username: string, hashedPassword: string): Promise<User> {
  const users = await getUsers();
  const newUser: User = {
    id: Date.now().toString(), // Simple unique ID
    username,
    password: hashedPassword,
  };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}


