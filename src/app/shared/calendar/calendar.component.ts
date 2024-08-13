import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
  Input,
  SimpleChanges,
} from '@angular/core';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
} from 'date-fns';
import { Subject } from 'rxjs';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView,
} from 'angular-calendar';
import { EventColor } from 'calendar-utils';
import { CitaDTO } from 'src/app/interfaces/citas';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls:['./calendar.component.css']
})
export class CalendarComponent {
  @Input() dataCita!: CitaDTO[];
  view: CalendarView = CalendarView.Month;
  events: CalendarEvent[] = [];
  CalendarView = CalendarView;

  viewDate: Date = new Date();

  ngOnInit(){
    this.loadCitas();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dataCita']) {
      this.loadCitas();
    }
  }

  actions: CalendarEventAction[] = [
    {
      label: '<i class="fas fa-fw fa-pencil-alt"></i>',
      a11yLabel: 'Edit',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        // this.handleEvent('Edited', event);
      },
    },
    {
      label: '<i class="fas fa-fw fa-trash-alt"></i>',
      a11yLabel: 'Delete',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter((iEvent) => iEvent !== event);
        // this.handleEvent('Deleted', event);
      },
    },
  ];

  loadCitas(){

    this.events = []
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', // Lunes
      day: 'numeric',  // 12
      month: 'long',   // Agosto
      hour: 'numeric', // 15
      minute: 'numeric', // 30
      hour12: true     // Formato 12 horas (am/pm)
    };




    this.dataCita.map( cita => {

      const citaDate = new Date(cita.fechaHora);
      const formattedDate = citaDate.toLocaleDateString('es-ES', options);
      const endDate = new Date(citaDate.getTime() + cita.duracion * 60000);
      const formattedEndDate = endDate.toLocaleDateString('es-ES', options);

      this.events.push(
        {
          start: new Date(cita.fechaHora),
          end: new Date(cita.fechaHora),
          title: `${formattedDate} <------> ${formattedEndDate}` ,
          color: {
            primary: 'red',
            secondary: '#FAE3E3',
          },
          allDay: false,
        }
      )
    })
  }

  refresh = new Subject<void>();

  activeDayIsOpen: boolean = true;


  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });
  }



  addEvent(): void {
    this.events = [
      ...this.events,
      {
        title: 'New event',
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
        color:  {
          primary: '#ad2121',
          secondary: '#FAE3E3',
        },
        draggable: true,
        resizable: {
          beforeStart: true,
          afterEnd: true,
        },
      },
    ];
  }

  deleteEvent(eventToDelete: CalendarEvent) {
    this.events = this.events.filter((event) => event !== eventToDelete);
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }
}
