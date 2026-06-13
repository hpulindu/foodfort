import { initializeApp, getApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getFirestore,
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";

function ensureApp(): void {
  try {
    getApp();
  } catch {
    initializeApp();
  }
}

export function getDb(): Firestore {
  ensureApp();
  return getFirestore();
}

export function getAuthAdmin(): Auth {
  ensureApp();
  return getAuth();
}

export { FieldValue, Timestamp };
