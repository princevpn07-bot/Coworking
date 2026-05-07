import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sapces } from './spaces';

describe('Sapces', () => {
  let component: Sapces;
  let fixture: ComponentFixture<Sapces>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sapces],
    }).compileComponents();

    fixture = TestBed.createComponent(Sapces);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
