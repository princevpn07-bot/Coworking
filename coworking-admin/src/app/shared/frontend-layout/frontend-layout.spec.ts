import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontendLayout } from './frontend-layout';

describe('FrontendLayout', () => {
  let component: FrontendLayout;
  let fixture: ComponentFixture<FrontendLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontendLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(FrontendLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
