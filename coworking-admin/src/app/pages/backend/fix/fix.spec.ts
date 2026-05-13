import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fix } from './fix';

describe('Fix', () => {
  let component: Fix;
  let fixture: ComponentFixture<Fix>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fix],
    }).compileComponents();

    fixture = TestBed.createComponent(Fix);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
