import dotenv from 'dotenv';

dotenv.config();

export const config = {
  token: process.env.TOKEN || ''
};

export const eventModeFirstOfAprilChats: string[] = [];
export const memeDebugChats: string[] = ['2']