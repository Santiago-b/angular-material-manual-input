import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MatDateFormats,
} from '@angular/material/core';
import {
  MatDatepickerIntl,
  MatCalendar,
  yearsPerPage,
} from '@angular/material/datepicker';
import { ActiveCartService, Region } from '@spartacus/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { dlMetriRegister } from 'src/app/services/dlMetriRegister.service';
import { ageValidator } from '../../shared/component/form-validator/age.validator';

@Component({
  selector: 'cx-custom-holder-line-form',
  templateUrl: './custom-holder-line-form.component.html',
  styleUrls: [
    './custom-holder-line-form.component.scss',
    './custom-holder-line-form.component2.scss',
  ],
})
export class CustomHolderLineFormComponent implements OnInit {
  @Input('holderLine') holderLine;
  @Input('isCheckout') isCheckout;
  @Input('buttons') buttons;

  // @Output('toNext') toNext;
  @Output() toNextStep = new EventEmitter<boolean>();
  addNewStep(value: boolean) {
    this.toNextStep.emit(value);
  }

  @Output() onCancelEvent = new EventEmitter();
  @Output() onSubmitEvent = new EventEmitter();

  @ViewChild('picker') datepicker;
  customHeader = CustomDPHeader;
  curpValidator: ValidatorFn = Validators.pattern(
    '^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$'
  );

  form: FormGroup;
  dateOfBirth: FormControl;
  formDefaultValues: Object;
  region: Region;
  guid: any;
  date: string;
  blured: Object;
  minDate = new Date(new Date().getFullYear() - 100, 0, 1);

  dateFilter = (date: Date) => {
    return date >= this.minDate;
  };

  curpIsMandatory$: Observable<boolean> = this.activeCartService
    .getActive()
    .pipe(
      map((cart) => {
        if (cart?.entries) {
          if (!this.isNumeric(cart?.user?.uid)) {
            //Curp solo será obligatorio si está autenticado por correo y tiene algún chip en el carrito
            for (const entry of cart.entries) {
              const { product } = entry;
              for (let category of product?.categories) {
                if (category?.code == 'amigo_chip') {
                  return true;
                }
              }
            }
          }
          return false;
        }
      })
    );

  constructor(
    private _builder: FormBuilder,
    private render: Renderer2,
    private dlMetri: dlMetriRegister,
    private activeCartService: ActiveCartService
  ) {
    this.form = this._builder.group({
      name: [
        '',
        Validators.compose([Validators.required, this.noWhitespaceValidator]),
      ],
      lastName: [
        '',
        Validators.compose([Validators.required, this.noWhitespaceValidator]),
      ],
      email: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(/^([a-z0-9._%-]+@[a-z0-9._%-]+\.([a-z]{2,3}))$/i),
        ]),
      ],
      dateOfBirth: [
        '',
        Validators.compose([Validators.required, ageValidator]),
      ],
      // curp: ['', Validators.compose([Validators.maxLength(18), Validators.minLength(18)])]
      curp: [null, Validators.compose([this.curpValidator])],
    });
    this.formDefaultValues = this.form.value;

    //this.form.valueChanges.subscribe( _ => this.dlMetri.RegisterValidationErrors(this.form) );

    this.dateOfBirth = new FormControl(
      null,
      Validators.compose([Validators.required, ageValidator])
    );
    this.curpIsMandatory$.subscribe((isMandatory) => {
      if (isMandatory) {
        this.form.controls.curp.setValidators([
          Validators.required,
          this.curpValidator,
        ]);
      } else {
        this.form.controls.curp.clearValidators();
        this.form.controls.curp.setValidators([this.curpValidator]);
      }
      this.form.controls.curp.updateValueAndValidity();
    });

    const local_item = localStorage.getItem('spartacus⚿telcel⚿cart');
    const user = localStorage.getItem('username');

    this.guid = JSON.parse(local_item);

    this.blured = {
      name: false,
      lastName: false,
      email: false,
      dateOfBirth: false,
      curp: false,
    };
  }

  openPicker(): void {
    this.datepicker.open();
    const dpContent = document.getElementsByClassName(
      'mat-datepicker-content'
    )[0];
    const mtCalendar = document.getElementsByClassName('mat-calendar')[0];
    const inputDP = document.getElementById('input-fecha');

    this.render.setStyle(dpContent, 'width', inputDP.offsetWidth + 'px');
    this.render.setStyle(mtCalendar, 'width', inputDP.offsetWidth + 'px');
    this.render.setStyle(mtCalendar, 'height', 'auto');
  }

  ngOnInit(): void {
    if (this.holderLine)
      this.form.reset({
        ...this.holderLine,
        dateOfBirth: this.formatDate(this.holderLine.dateOfBirth),
      });

    if (this.activeCartService.isGuestCart() && !this.holderLine?.email) {
      this.activeCartService.getActive().subscribe((cart) => {
        if (cart?.user?.uid) {
          const splitedUser = cart.user.uid.split('|');
          if (splitedUser.length > 1) {
            const emailGuest = splitedUser[1];
            this.form.controls.email.setValue(emailGuest);
          }
        }
      });
    }
  }

  onCancel(): void {
    this.form.reset(this.formDefaultValues);
    this.onCancelEvent.emit();
  }

  onSubmit(): void {
    const birthdate = this.formatDateSubmit(this.form.get('dateOfBirth').value);
    this.date = birthdate;

    this.form.get('dateOfBirth').setValue(birthdate);
    this.onSubmitEvent.emit({ form: this.form });
  }

  checkSpecialChar(event) {
    let k;
    k = event.charCode;

    return (
      (k >= 48 && k <= 57) ||
      (k > 64 && k < 91) ||
      (k > 96 && k < 123) ||
      k == 8 ||
      k == 32 ||
      k == 241
    );
  }
  pasteData(event) {
    const regExp = '^[a-zA-ZñÑ ]+$';
    const pastedInput: string = event.clipboardData.getData('text/plain');
    const inputText = (<HTMLInputElement>event.target).value + pastedInput;
    if (!inputText.match(regExp)) {
      event.preventDefault();
    }
  }
  checkEmailChar(event) {
    let k;
    k = event.charCode;
    return (
      (k >= 48 && k <= 57) ||
      (k > 63 && k < 91) ||
      (k > 96 && k < 123) ||
      k == 8 ||
      k == 32 ||
      k == 241 ||
      k == 45 ||
      k == 46 ||
      k == 95
    );
  }

  formatDate(date: string): Date {
    if (date && date !== '') {
      return new Date(
        date.substr(6, 4) +
          '-' +
          date.substr(3, 2) +
          '-' +
          date.substr(0, 2) +
          'T00:00:00'
      );
    } else {
      return null;
    }
  }

  formatDateSubmit(date: Date): string {
    const day = new Date(date);
    // return day.getFullYear() + '/'  + (day.getMonth() + 1).toString().padStart(2, '0') + '/' + day.getDate().toString().padStart(2, '0');
    return (
      day.getDate().toString().padStart(2, '0') +
      '/' +
      (day.getMonth() + 1).toString().padStart(2, '0') +
      '/' +
      day.getFullYear()
    );
  }

  onBlur(event): void {
    if (event.target.name == 'curp') {
      this.validateCURP();
    } else {
      this.validateInput();
    }
    let formcontrol: any = this.form.get(event.target.name);
    this.dlMetri.RegisterValidationErrors(formcontrol, event.target.name, '  ');
    this.blured[event.target.name] = true;
    let cut: any;
    if (formcontrol.value[0] == ' ') {
      cut = formcontrol.value.trim();
      this.form.get(event.target.name).setValue(cut);
    }
  }

  onBlurDate(event): void {
    let formcontrol: any = this.form.get(event.target.name);
    this.dlMetri.RegisterValidationErrors(
      formcontrol,
      event.target.name,
      'Datos del titular'
    );
  }
  validateCURP() {
    let curp = this.form.get('curp').value;
    if (curp) {
      curp = curp.toUpperCase();
      if (curp?.length > 0) {
        if (
          !curp.match(
            /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}/
          )
        ) {
          this.form.get('curp').setErrors({ invalidCURP: true });
          return;
        }
      }
    }
  }
  validateInput(): void {
    let userId = this.form.get('email').value;
    if (userId?.length > 0) {
      if (!userId.match(/^([a-z0-9._%-]+@[a-z0-9._%-]+\.([a-z]{2,3}))$/i)) {
        this.form.get('email').setErrors({ invalidEmail: true });
        return;
      }
    }
  }

  public noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { whitespace: true };
  }

  isNumeric(num): boolean {
    return !isNaN(num);
  }

  onBlurPicker(name: string): void {
    this.blured[name] = true;
  }
}

/** Custom header component for datepicker. */
@Component({
  selector: 'example-header',
  styles: [
    `
    .custom-header {
      display: flex;
      padding: 0.5em;
      align-items: center;
      padding-right:20px;
    }

    .custom-header-period-button {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      cursor: pointer;
      outline: inherit;
      height: 1em;
      font-family: 'Source Sans Pro', sans-serif;
      font-size: 20px;
      font-style: normal;
      font-weight: 700;
      line-height: 16px;
      color: #0A3D7E;
      margin: 20px 0px 20px 16px;
      min-width: 0;
      width: auto;
      align-items: center;

    }

    .mat-calendar-spacer {
      flex: 1 1 auto;
    }

    .cx-calendar-previous-button,
    .cx-calendar-next-button{
      cursor: pointer;
    }

    .cx-calendar-arrow {
      height: 16px;
      width: 16px;
      background-size: 16px;
      margin-left: 8px;
      cursor: pointer;
    }

    .calendar-button-wrapper{
      display: flex;
      align-items: center;
    }

    .months-selector {
      display: flex;
      flex-direction: colum;
    }

  `,
  ],
  template: `
    <div class="custom-header">
      <div class="calendar-button-wrapper" (click)="currentPeriodClicked()">
        <button  class="custom-header-period-button">
        {{day}} | {{monthName}} | {{year}}
        </button>

        <span class="cx-calendar-arrow"
        [class.cx-calendar-invert]="calendar.currentView != 'month'">
        </span>
      </div>

      <div class="mat-calendar-spacer"></div>
      <span class="cx-calendar-previous-button" (click)="previousClicked()">
      </span>
      <span class="cx-calendar-next-button" (click)="nextClicked()">
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomDPHeader<D> implements OnDestroy {
  private _destroyed = new Subject<void>();

  day: number;
  year: number;
  showMonthSelector = false;
  currentMonthIndex: number = 0;
  private monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  monthName: string = this.monthNames[this.currentMonthIndex];

  constructor(
    private _dateAdapter: DateAdapter<D>,
    private _calendar: MatCalendar<D>,
    @Inject(forwardRef(() => MatCalendar)) public calendar: MatCalendar<D>
  ) {
    const date = this._calendar.activeDate;
    this.day = this._dateAdapter.getDate(date);
    this.monthName = this.monthNames[this._dateAdapter.getMonth(date)]; // Month index starts at 0
    this.year = this._dateAdapter.getYear(date);
  }
  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  currentPeriodClicked(): void {
    this.calendar.currentView =
      this.calendar.currentView == 'month' ? 'multi-year' : 'month';
  }

  previousClicked() {
    this.calendar.activeDate =
      this.calendar.currentView == 'month'
        ? this._dateAdapter.addCalendarMonths(this.calendar.activeDate, -1)
        : this._dateAdapter.addCalendarYears(
            this.calendar.activeDate,
            this.calendar.currentView == 'year' ? -1 : -yearsPerPage
          );
  }

  nextClicked() {
    this.calendar.activeDate =
      this.calendar.currentView == 'month'
        ? this._dateAdapter.addCalendarMonths(this.calendar.activeDate, 1)
        : this._dateAdapter.addCalendarYears(
            this.calendar.activeDate,
            this.calendar.currentView == 'year' ? 1 : yearsPerPage
          );
  }

  selectMonth(index: number): void {
    this.currentMonthIndex = index;
    this.monthName = this.monthNames[this.currentMonthIndex];
    this.showMonthSelector = false;
  }
}
