import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaFilesPage } from './media-files.page';

describe('MediaFilesPage', () => {
  let component: MediaFilesPage;
  let fixture: ComponentFixture<MediaFilesPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(MediaFilesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
