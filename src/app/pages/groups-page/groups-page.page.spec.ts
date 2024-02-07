import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupsPagePage } from './groups-page.page';

describe('GroupsPagePage', () => {
  let component: GroupsPagePage;
  let fixture: ComponentFixture<GroupsPagePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(GroupsPagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
