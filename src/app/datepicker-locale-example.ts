import { Component } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import 'moment/locale/ja';
import 'moment/locale/fr';
import { FormControl } from '@angular/forms';

/** @title Datepicker with different locale */
@Component({
  selector: 'datepicker-locale-example',
  templateUrl: 'datepicker-locale-example.html',
  styleUrls: ['datepicker-locale-example.css'],
})
export class DatepickerLocaleExample {
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

/**  Copyright 2021 Google LLC. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license */
