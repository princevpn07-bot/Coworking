import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatetimeFilter } from './datetime-filter';

describe('DatetimeFilter', () => {
  let component: DatetimeFilter;
  let fixture: ComponentFixture<DatetimeFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatetimeFilter],
    }).compileComponents();

    fixture = TestBed.createComponent(DatetimeFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
