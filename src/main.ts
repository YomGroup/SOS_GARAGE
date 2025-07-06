import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './environments/firebase.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
