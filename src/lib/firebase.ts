
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Reemplaza con tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAlPlFKLDJXlAFqvZe9wTP03coZpBSFcGc",
  authDomain: "condo-vote-weigh.firebaseapp.com",
  projectId: "condo-vote-weigh",
  storageBucket: "condo-vote-weigh.firebasestorage.app",
  messagingSenderId: "702261828202",
  appId: "1:702261828202:web:5acb8ed2ad0082ffc44813",
  measurementId: "G-S3C570W323"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

