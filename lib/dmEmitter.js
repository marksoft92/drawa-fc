import { EventEmitter } from "events";
const g = globalThis;
if (!g.__dmEmitter) {
  g.__dmEmitter = new EventEmitter();
  g.__dmEmitter.setMaxListeners(500);
}
export const dmEmitter = g.__dmEmitter;
