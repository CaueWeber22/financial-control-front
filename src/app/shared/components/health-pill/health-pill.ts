import { Component, input } from '@angular/core';

@Component({
  selector: 'app-health-pill',
  imports: [],
  templateUrl: './health-pill.html',
  styleUrl: './health-pill.scss',
})
export class HealthPill {
  readonly status = input.required<string>();
}
