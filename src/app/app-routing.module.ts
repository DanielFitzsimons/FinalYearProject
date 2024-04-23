import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'authenticator',
    pathMatch: 'full'
  },
  {
    path: 'authenticator',
    loadChildren: () => import('./pages/authenticator/authenticator.module').then( m => m.AuthenticatorPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/profile/profile.module').then( m => m.ProfilePageModule)
  },
  {
    path: 'create-post',
    loadChildren: () => import('./pages/create-post/create-post.module').then( m => m.CreatePostPageModule)
  },
  {
    path: 'messaging',
    loadChildren: () => import('./pages/messaging/messaging.module').then( m => m.MessagingPageModule)
  },
  {
    path: 'run-tracker',
    loadChildren: () => import('./pages/run-tracker/run-tracker.module').then( m => m.RunTrackerPageModule)
  },
  {
    path: 'groups-page',
    loadChildren: () => import('./pages/groups-page/groups-page.module').then( m => m.GroupsPagePageModule)
  },
  {
    path: 'chat-page/:groupId',
    loadChildren: () => import('./pages/chat-page/chat-page.module').then( m => m.ChatPagePageModule)
  },
  {
    path: 'media-files/:groupId',
    loadChildren: () => import('./pages/media-files/media-files.module').then( m => m.MediaFilesPageModule)
  },
  {
    path: 'group-detail',
    loadChildren: () => import('./pages/group-detail/group-detail.module').then( m => m.GroupDetailPageModule)
  },
  {
    path: 'gym-workouts',
    loadChildren: () => import('./pages/gym-workouts/gym-workouts.module').then( m => m.GymWorkoutsPageModule)
  },
  {
    path: 'date-and-time-picker',
    loadChildren: () => import('./components/date-and-time-picker/date-and-time-picker.module').then( m => m.DateAndTimePickerPageModule)
  },
  
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
