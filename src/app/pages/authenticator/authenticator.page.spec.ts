import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthenticatorPage } from './authenticator.page';

describe('AuthenticatorPage', () => {
  let component: AuthenticatorPage;
  let fixture: ComponentFixture<AuthenticatorPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AuthenticatorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
