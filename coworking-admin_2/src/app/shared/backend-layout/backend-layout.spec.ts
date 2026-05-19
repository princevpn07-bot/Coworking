import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackendLayout } from './backend-layout';

describe('BackendLayout', () => {
  let component: BackendLayout;
  let fixture: ComponentFixture<BackendLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackendLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(BackendLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
