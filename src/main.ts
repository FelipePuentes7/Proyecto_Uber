import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  carSportOutline,
  carOutline,
  locationOutline,
  navigateOutline,
  personOutline,
  shieldCheckmarkOutline,
  timeOutline,
  cashOutline,
  star,
  starOutline,
  logOutOutline,
  refreshOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  callOutline,
  mailOutline,
  lockClosedOutline,
  keyOutline,
  speedometerOutline,
  analyticsOutline,
  documentTextOutline,
  peopleOutline,
  optionsOutline,
  addCircleOutline,
  radioButtonOnOutline,
  flagOutline,
  playOutline,
  stopCircleOutline,
  locateOutline,
  serverOutline,
  chevronForwardOutline,
   arrowBackOutline,
  searchOutline,
  sparklesOutline,
  pulseOutline,
  cardOutline,
  compassOutline,
  warningOutline,
  checkmarkDoneOutline,
  filterOutline,
  calendarOutline,
  eyeOutline,
  eyeOffOutline,
  constructOutline,
  mapOutline
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

addIcons({
  'car-sport-outline': carSportOutline,
  'car-outline': carOutline,
  'location-outline': locationOutline,
  'navigate-outline': navigateOutline,
  'person-outline': personOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'time-outline': timeOutline,
  'cash-outline': cashOutline,
  'star': star,
  'star-outline': starOutline,
  'log-out-outline': logOutOutline,
  'refresh-outline': refreshOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'close-circle-outline': closeCircleOutline,
  'alert-circle-outline': alertCircleOutline,
  'call-outline': callOutline,
  'mail-outline': mailOutline,
  'lock-closed-outline': lockClosedOutline,
  'key-outline': keyOutline,
  'speedometer-outline': speedometerOutline,
  'analytics-outline': analyticsOutline,
  'document-text-outline': documentTextOutline,
  'people-outline': peopleOutline,
  'options-outline': optionsOutline,
  'add-circle-outline': addCircleOutline,
  'radio-button-on-outline': radioButtonOnOutline,
  'flag-outline': flagOutline,
  'play-outline': playOutline,
  'stop-circle-outline': stopCircleOutline,
  'locate-outline': locateOutline,
  'server-outline': serverOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'arrow-back-outline': arrowBackOutline,
  'search-outline': searchOutline,
  'sparkles-outline': sparklesOutline,
  'pulse-outline': pulseOutline,
  'card-outline': cardOutline,
  'compass-outline': compassOutline,
  'warning-outline': warningOutline,
  'checkmark-done-outline': checkmarkDoneOutline,
  'filter-outline': filterOutline,
  'calendar-outline': calendarOutline,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,
  'construct-outline': constructOutline,
  'map-outline': mapOutline
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'ios',
      animated: true
    }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor]))
  ],
});

