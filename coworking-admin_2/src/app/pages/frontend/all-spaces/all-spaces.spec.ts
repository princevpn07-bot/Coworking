import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSpaces } from './all-spaces';

describe('AllSpaces', () => {
  let component: AllSpaces;
  let fixture: ComponentFixture<AllSpaces>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSpaces],
    }).compileComponents();

    fixture = TestBed.createComponent(AllSpaces);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
