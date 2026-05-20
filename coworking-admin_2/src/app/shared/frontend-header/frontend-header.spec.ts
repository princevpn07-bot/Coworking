import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontendHeader } from './frontend-header';

describe('FrontendHeader', () => {
  let component: FrontendHeader;
  let fixture: ComponentFixture<FrontendHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontendHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(FrontendHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
