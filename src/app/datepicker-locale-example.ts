import { Component } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import 'moment/locale/ja';
import 'moment/locale/fr';
import { FormControl } from '@angular/forms';
import { MatCalendar } from '@angular/material/datepicker/calendar';

/** @title Datepicker with different locale */
@Component({
  selector: 'datepicker-locale-example',
  templateUrl: 'datepicker-locale-example.html',
  styleUrls: ['datepicker-locale-example.css'],
})
export class DatepickerLocaleExample {
  exampleHeader = ExampleHeader;
  validFrom: Date;
  validFromFormControl: FormControl;

  constructor(private _adapter: DateAdapter<any>) {}

  ngOnInit() {
    this.validFromFormControl = new FormControl(new Date());
    this.validFrom = new Date();
  }

  setValidFromDate($event: any) {
    this.validFrom = $event;
  }

  german() {
    this._adapter.setLocale('de-DE');
  }
  english() {
    this._adapter.setLocale('en-US');
  }
}

@Component({
  selector: 'example-header',
  template: `
    <div class="example-header">
      <button mat-icon-button (click)="previousClicked('year')">&lt;&lt;</button>
      <button mat-icon-button (click)="previousClicked('month')">&lt;</button>
      {{ (calendar.currentView === 'month' ? calendar.activeDate : calendar.activeDate) | date:(calendar.currentView === 'month' ? 'MMM yyyy' : 'yyyy') }}
      <button mat-icon-button (click)="nextClicked('month')">&gt;</button>
      <button mat-icon-button (click)="nextClicked('year')">&gt;&gt;</button>
    </div>
  `,
  styles: [
    `
    .example-header {
      display: flex;
      align-items: center;
      padding: 0.5em;
      justify-content: space-around;
    }
  `,
  ],
})
export class ExampleHeader {
  constructor(
    public calendar: MatCalendar<Date>,
    private dateAdapter: DateAdapter<Date>
  ) {}

  previousClicked(mode: 'month' | 'year') {
    this.calendar.activeDate =
      mode === 'month'
        ? this.dateAdapter.addCalendarMonths(this.calendar.activeDate, -1)
        : this.dateAdapter.addCalendarYears(this.calendar.activeDate, -1);
  }

  nextClicked(mode: 'month' | 'year') {
    this.calendar.activeDate =
      mode === 'month'
        ? this.dateAdapter.addCalendarMonths(this.calendar.activeDate, 1)
        : this.dateAdapter.addCalendarYears(this.calendar.activeDate, 1);
  }
}
/**  Copyright 2021 Google LLC. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license */
