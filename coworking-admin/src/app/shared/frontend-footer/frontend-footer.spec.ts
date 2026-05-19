import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontendFooter } from './frontend-footer';

describe('FrontendFooter', () => {
  let component: FrontendFooter;
  let fixture: ComponentFixture<FrontendFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontendFooter],
    }).compileComponents();

    fixture = TestBed.createComponent(FrontendFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
