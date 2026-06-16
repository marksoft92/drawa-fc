import { EventEmitter } from "events";

const g = globalThis;
if (!g.__chatEmitter) {
  g.__chatEmitter = new EventEmitter();
  g.__chatEmitter.setMaxListeners(500);
}

export const chatEmitter = g.__chatEmitter;
